// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { documentReportCopies } from '~/constants/document';
import { userSessionContext } from '~/contexts/user-session';
import { ReportDocumentError } from '~/services/document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-report';
import type { Route } from './+types/doc-report';

const reportDocumentMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/document')>();
  return {
    ...actual,
    reportDocument: (...args: unknown[]) => reportDocumentMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  reportDocumentMock.mockResolvedValue([null]);
});

function callAction(fields: Record<string, string>) {
  const formData = new FormData();
  formData.set('csrf', 'test-token');

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  const request = new Request(
    `http://localhost/doc/${documentFixture.id}/report`,
    { method: 'POST', body: formData },
  );
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/report',
    params: { id: documentFixture.id },
    context,
  } as Route.ActionArgs);
}

test('reports the document as the signed in user', async () => {
  const result = await callAction({
    reason: 'spam',
    details: 'Links to a fake shop.',
  });

  expect(reportDocumentMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    user: userFixture,
    reason: 'spam',
    details: 'Links to a fake shop.',
  });
  expect(result).toStrictEqual({ ok: true });
});

test('takes a report without details', async () => {
  await callAction({ reason: 'other', details: '' });

  expect(reportDocumentMock).toHaveBeenCalledWith(
    expect.objectContaining({ reason: 'other', details: '' }),
  );
});

test('responds with 400 without a known reason', async () => {
  await expect(callAction({ reason: 'boring', details: '' })).rejects.toMatchObject({
    init: { status: 400 },
  });
  expect(reportDocumentMock).not.toHaveBeenCalled();
});

test('responds with 403 when the service denies the user', async () => {
  reportDocumentMock.mockResolvedValue([ReportDocumentError.PermissionDenied]);

  await expect(callAction({ reason: 'spam', details: '' })).rejects.toMatchObject({
    init: { status: 403 },
  });
});

test('says so when the user sent too many reports', async () => {
  reportDocumentMock.mockResolvedValue([ReportDocumentError.TooManyReports]);

  expect(await callAction({ reason: 'spam', details: '' })).toStrictEqual({
    ok: false,
    error: documentReportCopies.tooManyReports,
  });
});
