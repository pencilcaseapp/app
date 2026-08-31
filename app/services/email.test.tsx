import { afterEach, describe, expect, it, vi } from 'vitest';
import { isTestEmailAddress, sendEmail } from './email';

const lettermintEmailMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  subject: vi.fn().mockReturnThis(),
  html: vi.fn().mockReturnThis(),
  text: vi.fn().mockReturnThis(),
  send: vi.fn(),
};

vi.mock('lettermint', () => ({
  Lettermint: class {
    email = lettermintEmailMock;
  },
}));

vi.mock('~/config', () => ({
  getConfig: () => ({
    email: {
      apiToken: 'test-api-token',
      from: {
        name: 'pencil case',
        email: 'inbox@pencilcaseapp.com',
      },
    },
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('sendEmail', () => {
  it('sends an email with formatted sender and recipient', async () => {
    await sendEmail({
      to: {
        name: 'John Doe',
        email: 'john@doe.com',
      },
      subject: 'Test Email',
      email: <p>This is a test email.</p>,
    });

    expect(lettermintEmailMock.from).toHaveBeenCalledWith('pencil case <inbox@pencilcaseapp.com>');
    expect(lettermintEmailMock.to).toHaveBeenCalledWith('John Doe <john@doe.com>');
    expect(lettermintEmailMock.subject).toHaveBeenCalledWith('Test Email');
    expect(lettermintEmailMock.send).toHaveBeenCalledTimes(1);
  });

  it('renders the template to both an HTML and a plain text body', async () => {
    await sendEmail({
      to: { email: 'john@doe.com' },
      subject: 'Test Email',
      email: <p>This is a test email.</p>,
    });

    const [html] = lettermintEmailMock.html.mock.calls[0];
    const [text] = lettermintEmailMock.text.mock.calls[0];

    expect(html).toContain('<p>This is a test email.</p>');
    expect(text).toBe('This is a test email.');
  });

  it('never hands a test address to Lettermint', async () => {
    await sendEmail({
      to: { email: 'e2e-a-123@pencilcase.app' },
      subject: 'Test Email',
      email: <p>This is a test email.</p>,
    });

    expect(lettermintEmailMock.send).not.toHaveBeenCalled();
  });
});

describe('isTestEmailAddress', () => {
  it.each([
    'e2e-a-123@pencilcase.app',
    'E2E-B-456@PENCILCASE.APP',
    'john@example.com',
    'jane@example.org',
    'someone@sub.example',
    'dev@app.test',
    'dev@localhost.localhost',
  ])('treats %s as a test address', (email) => {
    expect(isTestEmailAddress(email)).toBe(true);
  });

  it.each([
    'john@doe.com',
    'e2e@pencilcase.app',
    'henrik@wakesys.com',
    'not-an-email',
  ])('treats %s as a real address', (email) => {
    expect(isTestEmailAddress(email)).toBe(false);
  });
});
