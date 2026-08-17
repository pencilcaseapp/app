import { render } from 'react-email';
import { Lettermint } from 'lettermint';
import type React from 'react';
import { getConfig } from '~/config';

export type EmailData = {
  name?: string;
  email: string;
};

export type SendEmailInput = {
  to: EmailData;
  subject: string;
  email: React.ReactElement;
};

export async function sendEmail({ to, subject, email }: SendEmailInput) {
  const config = getConfig();
  const apiToken = config.email.apiToken;

  if (!apiToken) {
    console.warn('Email API token is not set. Skipping email sending …');
    return;
  }

  const [html, text] = await Promise.all([
    render(email),
    render(email, { plainText: true }),
  ]);

  const lettermint = new Lettermint({
    apiToken,
  });

  await lettermint.email
    .from(formatEmailData(config.email.from))
    .to(formatEmailData(to))
    .subject(subject)
    .html(html)
    .text(text)
    .send();
}

function formatEmailData(data: EmailData) {
  if (data.name) {
    return `${data.name} <${data.email}>`;
  }

  return data.email;
}
