import { Lettermint } from 'lettermint';
import { getConfig } from '~/config';

export type EmailData = {
  name?: string;
  email: string;
};

export type SendEmailInput = {
  to: EmailData;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const config = getConfig();
  const apiToken = config.email.apiToken;

  if (!apiToken) {
    console.warn('Email API token is not set. Skipping email sending …');
    return;
  }

  const lettermint = new Lettermint({
    apiToken,
  });

  await lettermint.email
    .from(formatEmailData(config.email.from))
    .to(formatEmailData(to))
    .subject(subject)
    .html(html)
    .send();
}

function formatEmailData(data: EmailData) {
  if (data.name) {
    return `${data.name} <${data.email}>`;
  }

  return data.email;
}
