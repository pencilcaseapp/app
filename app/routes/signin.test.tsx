import './signin';
import { beforeEach, expect, test, vi } from 'vitest';
import { renderRoute } from '~/utils/testing';
import { userEvent } from '@testing-library/user-event';
import { commonCopies } from '~/constants/common-copies';
import { href } from 'react-router';
import { otpFixture } from '~/test/fixtures/otp';
import { InitMagicCodeError } from '~/services/auth';
import { userFixture } from '~/test/fixtures/user';
import { act, fireEvent } from '@testing-library/react';
import { withSearchParams } from '~/utils/url';
import { SearchParamAuth } from '~/constants/search-params';

const initMagicCodeMock = vi.fn();
vi.mock('~/services/auth', async (importActual) => {
  const actual = await importActual();
  return {
    ...actual as object,
    initMagicCode: () => initMagicCodeMock(),
  };
});

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

beforeEach(() => {
  vi.clearAllMocks();
});

test('matches snapshot', async () => {
  const { container } = await renderRoute('/signin');

  expect(container).toMatchSnapshot();
});

test('handles form validation errors', async () => {
  const { findByLabelText, findByText } = await renderRoute('/signin');

  const emailInput = await findByLabelText('E-Mail');
  const submitButton = await findByText(commonCopies.actions.continue);

  await userEvent.type(emailInput, 'invalid-email');
  await act(async () => {
    fireEvent.submit(submitButton);
  });

  expect(await findByText('Invalid email address')).toBeInTheDocument();
});

test('redirects after form submission', async () => {
  initMagicCodeMock.mockResolvedValue([null, { otp: otpFixture }]);

  const { findByLabelText, findByText } = await renderRoute('/signin');

  const emailInput = await findByLabelText('E-Mail');
  const submitButton = await findByText(commonCopies.actions.continue);

  await userEvent.type(emailInput, userFixture.email);
  await act(async () => {
    fireEvent.submit(submitButton);
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

test('returns form error on too many requests', async () => {
  initMagicCodeMock.mockResolvedValue([InitMagicCodeError.TooManyRequests]);

  const { findByLabelText, findByText } = await renderRoute('/signin');

  const emailInput = await findByLabelText('E-Mail');
  const submitButton = await findByText(commonCopies.actions.continue);

  await userEvent.type(emailInput, 'test@example.com');
  await act(async () => {
    fireEvent.submit(submitButton);
  });

  expect(await findByText('Too many requests. Please try again later.')).toBeInTheDocument();
});
