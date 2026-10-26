import { and, eq, gt, inArray, lt } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { documentReports } from '~/db/schema';
import type { DocumentReportReason } from '~/constants/document';

export interface CreateDocumentReportInput {
  documentId: string;
  userId: string;
  reason: DocumentReportReason;
  details: string | null;
}

export async function createDocumentReport(input: CreateDocumentReportInput) {
  if (!isUuid(input.documentId) || !isUuid(input.userId)) {
    return undefined;
  }

  const [report] = await db
    .insert(documentReports)
    .values(input)
    .returning();

  return report;
}

/** How many reports the user sent since a point in time. */
export async function countDocumentReportsByUser(input: {
  userId: string;
  since: Date;
}) {
  const { userId, since } = input;

  if (!isUuid(userId)) {
    return 0;
  }

  return db.$count(
    documentReports,
    and(
      eq(documentReports.userId, userId),
      gt(documentReports.createdAt, since),
    ),
  );
}

const DELETE_BATCH_SIZE = 1000;

/**
 * Deletes in batches, like the e-mail logs, so a backlog never turns into
 * one long-running statement.
 */
export async function deleteDocumentReportsCreatedBefore(before: Date) {
  let deletedCount = 0;

  while (true) {
    const batch = db
      .select({ id: documentReports.id })
      .from(documentReports)
      .where(lt(documentReports.createdAt, before))
      .limit(DELETE_BATCH_SIZE);

    const deleted = await db
      .delete(documentReports)
      .where(inArray(documentReports.id, batch))
      .returning({ id: documentReports.id });

    deletedCount += deleted.length;

    if (deleted.length < DELETE_BATCH_SIZE) {
      return deletedCount;
    }
  }
}
