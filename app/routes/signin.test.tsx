import { expect, test, vi } from 'vitest';
import { renderRoute } from '~/utils/testing';
import { userEvent } from '@testing-library/user-event';
import { commonCopies } from '~/constants/common-copies';
import { href } from 'react-router';

vi.mock('~/services/auth', async () => ({
  initMagicCode: () => ({ otp: { id: 'mock-otp-id' } }),
}));

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
  const { getByLabelText, getByText } = await renderRoute('/signin');

  const emailInput = getByLabelText('E-Mail');
  const submitButton = getByText(commonCopies.actions.continue);

  await userEvent.type(emailInput, 'test@example.com');
  await userEvent.click(submitButton);

  vi.waitFor(() => {
    expect(redirectMock).toHaveBeenCalledWith(href('/otp/:otpId', { otpId: 'mock-otp-id' }));
  });
});
