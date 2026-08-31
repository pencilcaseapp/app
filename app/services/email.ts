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

  if (isTestEmailAddress(to.email)) {
    console.warn(`Skipping email to the test address ${to.email} …`);
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

const testEmailDomains = ['example.com', 'example.net', 'example.org'];

const testEmailTlds = ['.test', '.invalid', '.example', '.localhost'];

/**
 * The e2e tests sign their throwaway users up as `e2e-…@pencilcase.app`
 * (see e2e/fixtures.ts), and the reserved example/test domains never
 * route anywhere — none of these must reach Lettermint when a real
 * token is configured.
 */
export function isTestEmailAddress(email: string) {
  const address = email.trim().toLowerCase();
  const atIndex = address.lastIndexOf('@');

  if (atIndex === -1) {
    return false;
  }

  const localPart = address.slice(0, atIndex);
  const domain = address.slice(atIndex + 1);

  return localPart.startsWith('e2e-')
    || testEmailDomains.includes(domain)
    || testEmailTlds.some(tld => domain.endsWith(tld));
}

function formatEmailData(data: EmailData) {
  if (data.name) {
    return `${data.name} <${data.email}>`;
  }

  return data.email;
}
