/**
 * Every transactional e-mail the app sends. The value is the first half
 * of the idempotency key, so renaming one lets an e-mail that was already
 * sent go out a second time.
 */
export enum EmailTemplate {
  OtpCode = 'otp-code',
  EmailChangeCode = 'email-change-code',
  SubscriptionStarted = 'subscription-started',
  SubscriptionPaymentFailed = 'subscription-payment-failed',
  SubscriptionCanceled = 'subscription-canceled',
  DocumentInvite = 'document-invite',
  DocumentReport = 'document-report',
  ContactMessage = 'contact-message',
  ContractNotice = 'contract-notice',
  AccountDeleted = 'account-deleted',
}

/**
 * `Queued` is an e-mail handed to the background job, recorded when it is
 * queued so the log counts it before it goes out. `Pending` is the claim
 * taken before the provider is called: it is what blocks a second send
 * while the first is in flight. `Skipped` records the sends `sendEmail`
 * deliberately does not make (no API token, a test address), and only
 * `Queued` and `Failed` may be claimed.
 */
export enum EmailLogStatus {
  Queued = 'queued',
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
  Skipped = 'skipped',
}

/**
 * The idempotency key of one e-mail: the template plus whatever makes the
 * send unique, which is always the id of the thing that caused it. The
 * template is part of the key so two templates can never collide on the
 * same scope.
 *
 * The scopes, and why each is the right one:
 *
 * - `otp-code` and `email-change-code` use the id of the code row. Each
 *   request for a new code inserts one, so a resend the user asked for
 *   gets a new key while a retry of the same code does not.
 * - `subscription-started` and `subscription-canceled` use the Creem
 *   subscription id. Both happen once in the life of a subscription.
 * - `subscription-payment-failed` adds the start of the billing period,
 *   because Creem retries a failed payment several times within one
 *   period and each retry sends another `subscription.past_due` event.
 *   One e-mail per period is what we want; when Creem gives us no period
 *   the event id stands in, which dedupes redeliveries of that one event
 *   rather than suppressing every later failure.
 * - `document-invite` uses the id of the invite. An invite the owner sent
 *   again is another invite and goes out; a retried send of the same one
 *   does not, the same way round as the codes above.
 * - `document-report` uses the id of the `document_reports` row. Every
 *   report somebody sends goes out; the key only stops a retry of the
 *   same one.
 * - `contact-message` uses an id drawn for the message when the website's
 *   contact form posts it. Nothing is stored for it, so the id only
 *   stops a retry of that one send.
 * - `contract-notice` uses an id drawn for the cancellation or withdrawal
 *   when the website's form posts it, plus who gets the e-mail: the
 *   customer's confirmation and our inbox's copy are two sends.
 * - `account-deleted` uses the user id and the time of the deletion. An
 *   account restored and deleted again gets the e-mail again, a retry of
 *   the same deletion does not.
 */
export function emailIdempotencyKey(template: EmailTemplate, scope: string) {
  return `${template}:${scope}`;
}
