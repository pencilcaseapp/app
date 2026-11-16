import { randomUUID } from 'node:crypto';
import type { ContractNotice } from '~/constants/contract-notice';
import {
  sendEmailContactMessage,
  sendEmailContractNotice,
} from './email-templates';

/** Mails a message from the website's contact form to our inbox. */
export async function sendContactMessage(input: {
  email: string;
  message: string;
}) {
  await sendEmailContactMessage({ messageId: randomUUID(), ...input });
}

/**
 * Takes a cancellation or withdrawal from the website's forms: the
 * customer gets the confirmation the law asks for, with the time it
 * reached us, and our inbox a copy to carry it out.
 */
export async function sendContractNotice(notice: ContractNotice) {
  await sendEmailContractNotice({
    noticeId: randomUUID(),
    notice,
    receivedAt: new Date(),
  });
}
