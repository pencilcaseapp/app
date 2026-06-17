import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { OneTimePasswordField } from './one-time-password-field';
import { act } from 'react';

describe('OneTimePasswordField', () => {
  test('matches snapshot', async () => {
    const { container } = render(
      <OneTimePasswordField
        name="otp"
        value=""
        onChange={() => {}}
      />,
    );

    await act(() => new Promise(resolve => setTimeout(resolve)));

    expect(container).toMatchSnapshot();
  });

  test('disabled matches snapshot', async () => {
    const { container } = render(
      <OneTimePasswordField
        name="otp"
        value=""
        onChange={() => {}}
        disabled
      />,
    );

    await act(() => new Promise(resolve => setTimeout(resolve)));

    expect(container).toMatchSnapshot();
  });

  test('error message matches snapshot', async () => {
    const { container } = render(
      <OneTimePasswordField
        name="otp"
        value=""
        onChange={() => {}}
        errorMessage="Invalid code"
      />,
    );

    await act(() => new Promise(resolve => setTimeout(resolve)));

    expect(container).toMatchSnapshot();
  });

  test('hint matches snapshot', async () => {
    const { container } = render(
      <OneTimePasswordField
        name="otp"
        value=""
        onChange={() => {}}
        hint="Enter the code sent to your email"
      />,
    );

    await act(() => new Promise(resolve => setTimeout(resolve)));

    expect(container).toMatchSnapshot();
  });
});
