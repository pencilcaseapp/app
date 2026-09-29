import { Lettermint } from 'lettermint';

export interface LettermintEmail {
  apiToken: string;
  idempotencyKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendLettermintEmail(email: LettermintEmail) {
  const lettermint = new Lettermint({
    apiToken: email.apiToken,
  });

  const response = await lettermint.email
    .idempotencyKey(email.idempotencyKey)
    .from(email.from)
    .to(email.to)
    .subject(email.subject)
    .html(email.html)
    .text(email.text)
    .send();

  return response?.message_id;
}
