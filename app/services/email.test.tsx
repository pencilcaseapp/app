import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendEmail } from './email';

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
        email: 'john@example.com',
      },
      subject: 'Test Email',
      email: <p>This is a test email.</p>,
    });

    expect(lettermintEmailMock.from).toHaveBeenCalledWith('pencil case <inbox@pencilcaseapp.com>');
    expect(lettermintEmailMock.to).toHaveBeenCalledWith('John Doe <john@example.com>');
    expect(lettermintEmailMock.subject).toHaveBeenCalledWith('Test Email');
    expect(lettermintEmailMock.send).toHaveBeenCalledTimes(1);
  });

  it('renders the template to both an HTML and a plain text body', async () => {
    await sendEmail({
      to: { email: 'john@example.com' },
      subject: 'Test Email',
      email: <p>This is a test email.</p>,
    });

    const [html] = lettermintEmailMock.html.mock.calls[0];
    const [text] = lettermintEmailMock.text.mock.calls[0];

    expect(html).toContain('<p>This is a test email.</p>');
    expect(text).toBe('This is a test email.');
  });
});
