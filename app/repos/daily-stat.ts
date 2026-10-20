import { sql, type InferSelectModel } from 'drizzle-orm';
import { db } from '~/db';
import { dailyStats } from '~/db/schema';

export type DailyStat = InferSelectModel<typeof dailyStats>;

export type DailyStatCounter = Exclude<keyof DailyStat, 'date'>;

type Executor = Pick<typeof db, 'insert'>;

export function getUtcDate(at = new Date()) {
  return at.toISOString().slice(0, 10);
}

/**
 * Adds to one counter of today's (UTC) row, creating the row on the day's
 * first event. Pass the transaction of the write being counted, so the
 * count and the write commit or roll back together.
 */
export async function incrementDailyStat(
  counter: DailyStatCounter,
  by = 1,
  executor: Executor = db,
) {
  if (by <= 0) {
    return;
  }

  const column = dailyStats[counter];

  await executor
    .insert(dailyStats)
    .values({ date: getUtcDate(), [counter]: by })
    .onConflictDoUpdate({
      target: dailyStats.date,
      set: { [counter]: sql`${column} + ${by}` },
    });
}

export async function getDailyStat(date: string) {
  return db.query.dailyStats.findFirst({
    where: {
      date,
    },
  });
}
