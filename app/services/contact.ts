import { randomUUID } from 'node:crypto';
import type { ContractNotice } from '~/constants/contract-notice';
import { EmailTemplate } from '~/constants/email';
import { queueEmail } from './email-templates';

/** Mails a message from the website's contact form to our inbox. */
export async function sendContactMessage(input: {
  email: string;
  message: string;
}) {
  await queueEmail({
    template: EmailTemplate.ContactMessage,
    input: { messageId: randomUUID(), ...input },
  });
}

/**
 * Takes a cancellation or withdrawal from the website's forms: the
 * customer gets the confirmation the law asks for, with the time it
 * reached us, and our inbox a copy to carry it out.
 */
export async function sendContractNotice(notice: ContractNotice) {
  const noticeId = randomUUID();
  const receivedAt = new Date().toISOString();

  for (const recipient of ['customer', 'inbox'] as const) {
    await queueEmail({
      template: EmailTemplate.ContractNotice,
      input: { noticeId, notice, receivedAt, recipient },
    });
  }
}
