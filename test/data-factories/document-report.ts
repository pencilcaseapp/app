import { faker } from '@faker-js/faker';
import { db } from '~/db';
import { documentReports } from '~/db/schema';

export async function createDocumentReport(input: {
  documentId: string;
  userId: string;
  createdAt?: Date;
}) {
  const [report] = await db.insert(documentReports).values({
    ...input,
    reason: 'spam',
    details: faker.lorem.sentence(),
  }).returning();

  return report;
}
