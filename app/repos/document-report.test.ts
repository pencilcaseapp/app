import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { documentReports, documents } from '~/db/schema';
import { createSharedDocument } from '~/test/data-factories/document';
import { createDocumentReport as createReportRow } from '~/test/data-factories/document-report';
import { createTestUser } from '~/test/data-factories/user';
import {
  countDocumentReportsByUser,
  createDocumentReport,
  deleteDocumentReportsCreatedBefore,
} from './document-report';

async function reportedDocument() {
  const owner = await createTestUser();
  const reporter = await createTestUser();
  const document = await createSharedDocument(owner.id);

  return { reporter, document };
}

describe('createDocumentReport', () => {
  it('records the report', async () => {
    const { reporter, document } = await reportedDocument();

    const report = await createDocumentReport({
      documentId: document.id,
      userId: reporter.id,
      reason: 'harassment',
      details: 'Insults a colleague.',
    });

    expect(report).toStrictEqual({
      id: expect.any(String),
      documentId: document.id,
      userId: reporter.id,
      reason: 'harassment',
      details: 'Insults a colleague.',
      createdAt: expect.any(Date),
    });
  });

  it('returns undefined for an invalid id', async () => {
    const { reporter } = await reportedDocument();

    expect(await createDocumentReport({
      documentId: 'nope',
      userId: reporter.id,
      reason: 'spam',
      details: null,
    })).toBeUndefined();
  });

  it('outlives the purge of the reported document', async () => {
    const { reporter, document } = await reportedDocument();
    const report = await createReportRow({
      documentId: document.id,
      userId: reporter.id,
    });

    await db.delete(documents).where(eq(documents.id, document.id));

    const [kept] = await db.select().from(documentReports)
      .where(eq(documentReports.id, report.id));
    expect(kept.documentId).toBeNull();
  });
});

describe('countDocumentReportsByUser', () => {
  it('counts the user\'s reports since the given time', async () => {
    const { reporter, document } = await reportedDocument();
    const input = { documentId: document.id, userId: reporter.id };
    await createReportRow(input);
    await createReportRow(input);
    await createReportRow({ ...input, createdAt: new Date('2020-01-01') });

    expect(await countDocumentReportsByUser({
      userId: reporter.id,
      since: new Date('2021-01-01'),
    })).toBe(2);
  });

  it('counts nothing for an invalid id', async () => {
    expect(await countDocumentReportsByUser({
      userId: 'nope',
      since: new Date(0),
    })).toBe(0);
  });
});

describe('deleteDocumentReportsCreatedBefore', () => {
  it('deletes the reports created before the given time only', async () => {
    const { reporter, document } = await reportedDocument();
    const input = { documentId: document.id, userId: reporter.id };
    const old = await createReportRow({
      ...input,
      createdAt: new Date('2020-01-01'),
    });
    const recent = await createReportRow(input);

    const deletedCount
      = await deleteDocumentReportsCreatedBefore(new Date('2021-01-01'));

    expect(deletedCount).toBeGreaterThanOrEqual(1);
    const ids = (await db.select({ id: documentReports.id })
      .from(documentReports)).map(row => row.id);
    expect(ids).not.toContain(old.id);
    expect(ids).toContain(recent.id);
  });
});
