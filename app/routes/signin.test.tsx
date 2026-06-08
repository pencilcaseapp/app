import { beforeEach, expect, test, vi } from 'vitest';
import { renderRoute } from '~/utils/testing';
import { userEvent } from '@testing-library/user-event';
import { commonCopies } from '~/constants/common-copies';
import { href } from 'react-router';
import { otpFixture } from '~/test/fixtures/otp';
import { InitMagicCodeError } from '~/services/auth';

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
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    redirect: (url: string) => {
      redirectMock(url);
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
  const { getByLabelText, getByText } = await renderRoute('/signin');
  const emailInput = getByLabelText('E-Mail');
  const submitButton = getByText(commonCopies.actions.continue);

  await userEvent.type(emailInput, 'invalid-email');
  await userEvent.click(submitButton);

  expect(getByText('Invalid email address')).toBeInTheDocument();
});

test('redirects after form submission', async () => {
  initMagicCodeMock.mockResolvedValueOnce([null, otpFixture]);

  const { getByLabelText, getByText } = await renderRoute('/signin');

  const emailInput = getByLabelText('E-Mail');
  const submitButton = getByText(commonCopies.actions.continue);

  await userEvent.type(emailInput, 'test@example.com');
  await userEvent.click(submitButton);

  vi.waitFor(() => {
    expect(redirectMock).toHaveBeenCalledWith(href('/otp/:otpId', { otpId: otpFixture.id }));
  });
});

test('returns form error on too many requests', async () => {
  initMagicCodeMock.mockResolvedValueOnce([InitMagicCodeError.TooManyRequests]);

  const { getByLabelText, getByText } = await renderRoute('/signin');

  const emailInput = getByLabelText('E-Mail');
  const submitButton = getByText(commonCopies.actions.continue);

  await userEvent.type(emailInput, 'test@example.com');
  await userEvent.click(submitButton);

  vi.waitFor(() => {
    expect(getByText('Too many requests')).toBeInTheDocument();
  });
});
