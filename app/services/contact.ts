import { randomUUID } from 'node:crypto';
import { sendEmailContactMessage } from './email-templates';

/** Mails a message from the website's contact form to our inbox. */
export async function sendContactMessage(input: {
  email: string;
  message: string;
}) {
  await sendEmailContactMessage({ messageId: randomUUID(), ...input });
}
