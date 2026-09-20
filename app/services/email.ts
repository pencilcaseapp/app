import { render } from 'react-email';
import { Lettermint } from 'lettermint';
import type React from 'react';
import { getConfig } from '~/config';
import {
  emailIdempotencyKey,
  type EmailTemplate,
} from '~/constants/email';
import {
  claimEmailLog,
  markEmailLogFailed,
  markEmailLogSent,
  markEmailLogSkipped,
} from '~/repos/email-log';

export type EmailData = {
  name?: string;
  email: string;
};

export type SendEmailInput = {
  to: EmailData;
  subject: string;
  email: React.ReactElement;
  template: EmailTemplate;
  /**
   * What makes this send unique within its template — the id of whatever
   * caused it. See `emailIdempotencyKey` for the scope each template uses.
   */
  idempotencyScope: string;
  userId?: string;
};

/**
 * Sends one transactional e-mail, at most once. The idempotency key is
 * claimed in `email_logs` before the provider is called, so a retried job
 * or a redelivered webhook finds the key taken and sends nothing; the same
 * key goes to Lettermint, which drops the duplicate should a send have
 * reached them without us recording the answer.
 */
export async function sendEmail(input: SendEmailInput) {
  const { to, subject, email, template, idempotencyScope, userId } = input;
  const config = getConfig();
  const apiToken = config.email.apiToken;
  const idempotencyKey = emailIdempotencyKey(template, idempotencyScope);

  const log = await claimEmailLog({
    idempotencyKey,
    template,
    email: to.email,
    subject,
    userId,
  });

  if (!log) {
    console.warn(`Skipping already sent email ${idempotencyKey} …`);
    return;
  }

  if (!apiToken) {
    console.warn('Email API token is not set. Skipping email sending …');
    await markEmailLogSkipped({ id: log.id, reason: 'No API token' });
    return;
  }

  if (isTestEmailAddress(to.email)) {
    console.warn(`Skipping email to the test address ${to.email} …`);
    await markEmailLogSkipped({ id: log.id, reason: 'Test address' });
    return;
  }

  const [html, text] = await Promise.all([
    render(email),
    render(email, { plainText: true }),
  ]);

  const lettermint = new Lettermint({
    apiToken,
  });

  try {
    const response = await lettermint.email
      .idempotencyKey(idempotencyKey)
      .from(formatEmailData(config.email.from))
      .to(formatEmailData(to))
      .subject(subject)
      .html(html)
      .text(text)
      .send();

    await markEmailLogSent({
      id: log.id,
      providerMessageId: response?.message_id,
    });
  }
  catch (error) {
    await markEmailLogFailed({
      id: log.id,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
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
