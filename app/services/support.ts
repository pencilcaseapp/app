import { randomUUID } from 'node:crypto';
import { EmailTemplate } from '~/constants/email';
import {
  SUPPORT_REQUEST_LIMIT,
  SUPPORT_REQUEST_WINDOW_MS,
} from '~/constants/support';
import { countEmailLogsByUser } from '~/repos/email-log';
import type { User } from '~/repos/user';
import { sendEmailSupportRequest } from './email-templates';

export enum SendSupportRequestError {
  TooManyRequests,
}

export type SendSupportRequestResult = [SendSupportRequestError] | [null];

export interface SendSupportRequestInput {
  user: Pick<User, 'id' | 'email'>;
  message: string;
  url: string;
  userAgent: string;
}

/**
 * E-mails a message from the contact form to our inbox, with the page the
 * sender was on and their browser for debugging. Nothing is stored but
 * the e-mail log, which is also what caps an account at
 * `SUPPORT_REQUEST_LIMIT` messages a day.
 */
export async function sendSupportRequest(
  input: SendSupportRequestInput,
): Promise<SendSupportRequestResult> {
  const { user, url, userAgent } = input;

  const count = await countEmailLogsByUser({
    userId: user.id,
    template: EmailTemplate.SupportRequest,
    since: new Date(Date.now() - SUPPORT_REQUEST_WINDOW_MS),
  });

  if (count >= SUPPORT_REQUEST_LIMIT) {
    return [SendSupportRequestError.TooManyRequests];
  }

  await sendEmailSupportRequest({
    requestId: randomUUID(),
    message: input.message.trim(),
    url,
    userAgent,
    sender: { id: user.id, email: user.email },
  });

  return [null];
}
