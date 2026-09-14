import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RouterContextProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  optionalUserSessionContext,
  userSessionContext,
} from '~/contexts/user-session';
import {
  InitEmailChangeError,
  VerifyEmailChangeError,
} from '~/services/email-change';
import { emailChangeRequestFixture } from '~/test/fixtures/email-change-request';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';

const redirectMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    redirect: (url: string, init?: number | ResponseInit) => {
      redirectMock(url);
      return actual.redirect(url, init);
    },
  };
});

const getValidEmailChangeRequestMock = vi.fn();
vi.mock('~/repos/email-change-request', () => ({
  getValidEmailChangeRequest: (...args: unknown[]) =>
    getValidEmailChangeRequestMock(...args),
}));

const initEmailChangeMock = vi.fn();
const verifyEmailChangeMock = vi.fn();
vi.mock('~/services/email-change', async importOriginal => ({
  ...await importOriginal<typeof import('~/services/email-change')>(),
  initEmailChange: (...args: unknown[]) => initEmailChangeMock(...args),
  verifyEmailChange: (...args: unknown[]) => verifyEmailChangeMock(...args),
}));

const MOBILE_QUERY = '(width < 40rem)';

const useMediaMock = vi.fn().mockReturnValue(false);

vi.mock('react-use', async importOriginal => ({
  ...await importOriginal<typeof import('react-use')>(),
  useMedia: (query: string) => useMediaMock(query),
}));

const DOC_ID = '11111111-2222-4333-8444-555555555555';
const request = { ...emailChangeRequestFixture, email: 'new@example.com' };
const verifyUrl
  = `/doc/${DOC_ID}/settings/account/email/${request.id}`;
const emailUrl = `/doc/${DOC_ID}/settings/account/email`;
const accountUrl = `/doc/${DOC_ID}/settings/account`;

async function renderVerify({ isMobile = false } = {}) {
  useMediaMock.mockImplementation(
    (query: string) => isMobile && query === MOBILE_QUERY,
  );

  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  context.set(userSessionContext, userFixture);

  await renderRoute('/doc/:id/settings/account/email/:requestId', {
    params: { id: DOC_ID, requestId: request.id },
    context,
    parentRoute: '/doc/:id/settings',
  });

  return userEvent.setup();
}

async function enterCode(person: ReturnType<typeof userEvent.setup>) {
  await person.type(
    await screen.findByLabelText('Verification Code'), '123456',
  );
  await person.click(screen.getByRole('button', { name: 'Verify' }));
}

beforeEach(() => {
  getValidEmailChangeRequestMock.mockResolvedValue(request);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('the verify e-mail change route', () => {
  test('show the address the code went to', async () => {
    await renderVerify();

    expect(
      await screen.findByRole('dialog', { name: 'Change e-mail' }),
    ).toBeInTheDocument();
    expect(screen.getByText('new@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resend' }))
      .toBeInTheDocument();
  });

  test('send the user back to the address step without a request',
    async () => {
      getValidEmailChangeRequestMock.mockResolvedValue(undefined);

      await renderVerify();

      await vi.waitFor(() => {
        expect(redirectMock).toHaveBeenCalledWith(
          `${emailUrl}?toastDanger=The+code+has+expired.+Please+request+a+new+one.`,
        );
      });
    });

  test('refuse the request of another user', async () => {
    getValidEmailChangeRequestMock
      .mockResolvedValue({ ...request, userId: 'someone-else' });

    await renderVerify();

    await vi.waitFor(() => {
      expect(redirectMock).toHaveBeenCalledWith(
        expect.stringContaining(`${emailUrl}?toastDanger=`),
      );
    });
  });

  test('return to the account with a toast once verified', async () => {
    verifyEmailChangeMock.mockResolvedValueOnce([null, { user: userFixture }]);
    const person = await renderVerify();

    await enterCode(person);

    await vi.waitFor(() => {
      expect(verifyEmailChangeMock)
        .toHaveBeenCalledWith(userFixture, request.id, '123456');
      expect(redirectMock).toHaveBeenCalledWith(
        `${accountUrl}?toastSuccess=E-mail+successfully+changed`,
      );
    });
  });

  test('show an invalid code', async () => {
    verifyEmailChangeMock
      .mockResolvedValueOnce([VerifyEmailChangeError.Invalid]);
    const person = await renderVerify();

    await enterCode(person);

    expect(await screen.findByText(
      'Invalid code. Please check the code and try again.',
    )).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  test('start over on an expired code', async () => {
    verifyEmailChangeMock
      .mockResolvedValueOnce([VerifyEmailChangeError.Expired]);
    const person = await renderVerify();

    await enterCode(person);

    await vi.waitFor(() => {
      expect(redirectMock).toHaveBeenCalledWith(
        expect.stringContaining(`${emailUrl}?toastDanger=The+code+has+expired`),
      );
    });
  });

  test('resend the code to the same address', async () => {
    initEmailChangeMock.mockResolvedValueOnce(
      [null, { request: { ...request, id: '22222222-2222-4222-8222-222222222222' } }],
    );
    const person = await renderVerify();

    await person.click(await screen.findByRole('button', { name: 'Resend' }));

    await vi.waitFor(() => {
      expect(initEmailChangeMock)
        .toHaveBeenCalledWith(userFixture, 'new@example.com');
      expect(redirectMock).toHaveBeenCalledWith(
        `${emailUrl}/22222222-2222-4222-8222-222222222222`,
      );
    });
  });

  test('stay on the code with a toast when resending is rate limited',
    async () => {
      initEmailChangeMock
        .mockResolvedValueOnce([InitEmailChangeError.TooManyRequests]);
      const person = await renderVerify();

      await person.click(
        await screen.findByRole('button', { name: 'Resend' }),
      );

      await vi.waitFor(() => {
        expect(redirectMock).toHaveBeenCalledWith(
          `${verifyUrl}?toastDanger=Too+many+requests.+Please+try+again+later.`,
        );
      });
    });

  test('render the buttons below the code on mobile', async () => {
    const person = await renderVerify({ isMobile: true });

    expect(await screen.findByRole('button', { name: 'Verify' }))
      .toHaveClass('w-full');
    expect(screen.getByRole('button', { name: 'Resend' }))
      .toHaveClass('w-full');

    verifyEmailChangeMock.mockResolvedValueOnce([null, { user: userFixture }]);
    await enterCode(person);

    await vi.waitFor(() => {
      expect(verifyEmailChangeMock).toHaveBeenCalledTimes(1);
    });
  });
});
