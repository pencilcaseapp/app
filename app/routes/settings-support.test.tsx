import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RouterContextProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { supportRequestCopies } from '~/constants/support';
import {
  optionalUserSessionContext,
  userSessionContext,
} from '~/contexts/user-session';
import { SendSupportRequestError } from '~/services/support';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';
import { action } from './settings-support';
import type { Route } from './+types/settings-support';

const sendSupportRequestMock = vi.fn();
vi.mock('~/services/support', async importOriginal => ({
  ...await importOriginal<typeof import('~/services/support')>(),
  sendSupportRequest: (...args: unknown[]) => sendSupportRequestMock(...args),
}));

const DOC_ID = '11111111-2222-4333-8444-555555555555';

async function renderSupport() {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  context.set(userSessionContext, userFixture);

  await renderRoute('/doc/:id/settings/support', {
    params: { id: DOC_ID },
    context,
    parentRoute: '/doc/:id/settings',
  });

  return userEvent.setup();
}

beforeEach(() => {
  sendSupportRequestMock.mockResolvedValue([null]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('the support route', () => {
  test('ask for a message instead of sending an empty one', async () => {
    const person = await renderSupport();

    await person.click(await screen.findByRole('button', { name: 'Send' }));

    expect(await screen.findByText(supportRequestCopies.messageRequired))
      .toBeInTheDocument();
    expect(screen.getByLabelText('Message'))
      .toHaveAttribute('aria-invalid', 'true');
    expect(sendSupportRequestMock).not.toHaveBeenCalled();
  });

  test('send the message with the page and the browser', async () => {
    const person = await renderSupport();

    await person.type(
      await screen.findByLabelText('Message'),
      'Images I paste don’t show up.',
    );
    await person.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText(supportRequestCopies.sent))
      .toBeInTheDocument();
    expect(sendSupportRequestMock).toHaveBeenCalledWith({
      user: userFixture,
      message: 'Images I paste don’t show up.',
      url: window.location.href,
      userAgent: expect.any(String),
    });
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  test('say so when the account sent too many messages', async () => {
    sendSupportRequestMock.mockResolvedValue([
      SendSupportRequestError.TooManyRequests,
    ]);
    const person = await renderSupport();

    await person.type(await screen.findByLabelText('Message'), 'Hello');
    await person.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert'))
      .toHaveTextContent(supportRequestCopies.tooManyRequests);
    expect(screen.getByLabelText('Message')).toHaveValue('Hello');
  });
});

describe('the support action', () => {
  test('take the user agent from the request', async () => {
    const formData = new FormData();
    formData.set('csrf', 'test-token');
    formData.set('message', 'Hello');
    formData.set('url', `http://localhost/doc/${DOC_ID}/settings/support`);

    const request = new Request(
      `http://localhost/doc/${DOC_ID}/settings/support`,
      {
        method: 'POST',
        body: formData,
        headers: { 'user-agent': 'Mozilla/5.0 Safari/605.1.15' },
      },
    );
    const context = new RouterContextProvider();
    context.set(userSessionContext, userFixture);

    const result = await action({
      request,
      url: new URL(request.url),
      pattern: '/doc/:id/settings/support',
      params: { id: DOC_ID },
      context,
    } as Route.ActionArgs);

    expect(result).toEqual({ ok: true });
    expect(sendSupportRequestMock).toHaveBeenCalledWith({
      user: userFixture,
      message: 'Hello',
      url: `http://localhost/doc/${DOC_ID}/settings/support`,
      userAgent: 'Mozilla/5.0 Safari/605.1.15',
    });
  });
});
