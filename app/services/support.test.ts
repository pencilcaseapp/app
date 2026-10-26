import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailTemplate } from '~/constants/email';
import { SUPPORT_REQUEST_LIMIT } from '~/constants/support';
import { userFixture } from '~/test/fixtures/user';
import { sendSupportRequest, SendSupportRequestError } from './support';

const countEmailLogsByUserMock = vi.fn();
vi.mock('~/repos/email-log', () => ({
  countEmailLogsByUser: (...args: unknown[]) =>
    countEmailLogsByUserMock(...args),
}));

const sendEmailSupportRequestMock = vi.fn();
vi.mock('./email-templates', () => ({
  sendEmailSupportRequest: (...args: unknown[]) =>
    sendEmailSupportRequestMock(...args),
}));

const input = {
  user: userFixture,
  message: '  Images I paste don’t show up.\n',
  url: 'https://docs.pencilcase.app/doc/doc-id/settings/support',
  userAgent: 'Mozilla/5.0 (Macintosh) Safari/605.1.15',
};

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-10-26T12:00:00Z') });
  countEmailLogsByUserMock.mockResolvedValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('sendSupportRequest', () => {
  it('e-mails the message with the page and the browser', async () => {
    const [error] = await sendSupportRequest(input);

    expect(error).toBeNull();
    expect(sendEmailSupportRequestMock).toHaveBeenCalledWith({
      requestId: expect.any(String),
      message: 'Images I paste don’t show up.',
      url: input.url,
      userAgent: input.userAgent,
      sender: { id: userFixture.id, email: userFixture.email },
    });
  });

  it('sends every message under its own key', async () => {
    await sendSupportRequest(input);
    await sendSupportRequest(input);

    const [[first], [second]] = sendEmailSupportRequestMock.mock.calls;
    expect(first.requestId).not.toBe(second.requestId);
  });

  it('counts the messages of the last day', async () => {
    countEmailLogsByUserMock.mockResolvedValue(SUPPORT_REQUEST_LIMIT - 1);

    const [error] = await sendSupportRequest(input);

    expect(error).toBeNull();
    expect(countEmailLogsByUserMock).toHaveBeenCalledWith({
      userId: userFixture.id,
      template: EmailTemplate.SupportRequest,
      since: new Date('2026-10-25T12:00:00Z'),
    });
  });

  it('refuses a message past the limit', async () => {
    countEmailLogsByUserMock.mockResolvedValue(SUPPORT_REQUEST_LIMIT);

    const [error] = await sendSupportRequest(input);

    expect(error).toBe(SendSupportRequestError.TooManyRequests);
    expect(sendEmailSupportRequestMock).not.toHaveBeenCalled();
  });
});
