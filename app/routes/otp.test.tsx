import './otp';
import { beforeEach, expect, test, vi } from 'vitest';
import { SearchParamAuth } from '~/constants/search-params';
import { otpFixture } from '~/test/fixtures/otp';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';
import { sessionFixture } from '~/test/fixtures/session';
import { userEvent } from '@testing-library/user-event';
import { VerifyMagicCodeError } from '~/services/auth';
import { fireEvent } from '@testing-library/dom';
import { act } from 'react';
import { withSearchParams } from '~/utils/url';
import { href } from 'react-router';

const redirectMock = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    redirect: (url: string, init?: number | ResponseInit) => {
      redirectMock(url);
      return actual.redirect(url, init);
    },
  };
});

const getValidOtpMock = vi.fn();
vi.mock('~/repos/otp', () => ({
  getValidOtp: () => getValidOtpMock(),
}));

const verifyMagicCodeMock = vi.fn();
const initMagicCodeMock = vi.fn();
const createSessionCookieMock = vi.fn();
vi.mock('~/services/auth', async () => {
  const actual = await vi.importActual<typeof import('~/services/auth')>('~/services/auth');
  return {
    ...actual,
    initMagicCode: () => initMagicCodeMock(),
    verifyMagicCode: () => verifyMagicCodeMock(),
    createSessionCookie: () => createSessionCookieMock(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

test('matches snapshot', async () => {
  getValidOtpMock.mockResolvedValueOnce(otpFixture);

  const { container } = await renderRoute('/otp/:otpId', {
    params: {
      otpId: otpFixture.id,
    },
    searchParams: {
      [SearchParamAuth.Email]: userFixture.email,
    },
  });

  await act(() => new Promise(resolve => setTimeout(resolve)));

  expect(container).toMatchSnapshot();
});

test('redirects to onboarding on successful verification', async () => {
  getValidOtpMock.mockResolvedValueOnce(otpFixture);
  verifyMagicCodeMock.mockResolvedValueOnce([null, { otp: otpFixture }]);
  createSessionCookieMock.mockResolvedValueOnce(sessionFixture);

  const { findByLabelText, findByText } = await renderRoute('/otp/:otpId', {
    params: {
      otpId: otpFixture.id,
    },
    searchParams: {
      [SearchParamAuth.Email]: userFixture.email,
    },
  });

  const input = await findByLabelText('One-Time Password');
  const button = await findByText('Continue');

  await userEvent.type(input, '123456');

  await act(async () => {
    await fireEvent.submit(button);
  });

  await vi.waitFor(() => {
    expect(redirectMock).toHaveBeenCalledWith('/onboarding');
  });
});

test('redirects to signin with expired param', async () => {
  getValidOtpMock.mockResolvedValueOnce(null);

  await renderRoute('/otp/:otpId', {
    params: {
      otpId: otpFixture.id,
    },
    searchParams: {
      [SearchParamAuth.Email]: userFixture.email,
    },
  });

  expect(redirectMock).toHaveBeenCalledWith('/signin?isExpired=true');
});

test('shows form error on invalid code', async () => {
  getValidOtpMock.mockResolvedValue(otpFixture);
  verifyMagicCodeMock.mockResolvedValueOnce([
    VerifyMagicCodeError.Invalid,
  ]);

  const { findByLabelText, findByText } = await renderRoute('/otp/:otpId', {
    params: {
      otpId: otpFixture.id,
    },
    searchParams: {
      [SearchParamAuth.Email]: userFixture.email,
    },
  });

  const input = await findByLabelText('One-Time Password');
  const button = await findByText('Continue');

  await userEvent.type(input, '123456');

  await act(async () => {
    await fireEvent.submit(button);
  });

  expect(
    await findByText('Invalid code. Please check the code and try again.'),
  ).toBeInTheDocument();
});

test('redirects on expired code', async () => {
  getValidOtpMock.mockResolvedValue(otpFixture);
  verifyMagicCodeMock.mockResolvedValueOnce([
    VerifyMagicCodeError.Expired,
  ]);

  const { findByLabelText, findByText } = await renderRoute('/otp/:otpId', {
    params: {
      otpId: otpFixture.id,
    },
    searchParams: {
      [SearchParamAuth.Email]: userFixture.email,
    },
  });

  const input = await findByLabelText('One-Time Password');
  const button = await findByText('Continue');

  await userEvent.type(input, '123456');

  await act(async () => {
    await fireEvent.submit(button);
  });

  await vi.waitFor(() => {
    expect(redirectMock).toHaveBeenCalledWith('/signin?isExpired=true');
  });
});

test('resends code', async () => {
  getValidOtpMock.mockResolvedValue(otpFixture);
  initMagicCodeMock.mockResolvedValueOnce([null, { otp: otpFixture }]);

  const { findByText } = await renderRoute('/otp/:otpId', {
    params: {
      otpId: otpFixture.id,
    },
    searchParams: {
      [SearchParamAuth.Email]: userFixture.email,
    },
  });

  const button = await findByText('Resend code');

  await act(async () => {
    await fireEvent.submit(button);
  });

  await vi.waitFor(() => {
    expect(redirectMock).toHaveBeenCalledWith(
      withSearchParams(
        href('/otp/:otpId', { otpId: otpFixture.id }),
        { [SearchParamAuth.Email]: userFixture.email },
      ),
    );
  });
});
