export const FREE_DOCUMENT_LIMIT = 3;

/**
 * The statuses Creem moves a subscription through. The `status` column
 * stays plain text so a status Creem introduces later is stored rather
 * than rejected — this enum types everything on our side that reasons
 * about them.
 */
export enum SubscriptionStatus {
  Active = 'active',
  Trialing = 'trialing',
  PastDue = 'past_due',
  ScheduledCancel = 'scheduled_cancel',
  Canceled = 'canceled',
  Unpaid = 'unpaid',
  Paused = 'paused',
  Incomplete = 'incomplete',
}
