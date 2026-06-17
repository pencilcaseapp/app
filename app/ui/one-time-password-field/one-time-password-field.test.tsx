import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { OneTimePasswordField } from './one-time-password-field';

describe('OneTimePasswordField', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <OneTimePasswordField
        name="otp"
        value=""
        onChange={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('disabled matches snapshot', () => {
    const { container } = render(
      <OneTimePasswordField
        name="otp"
        value=""
        onChange={() => {}}
        disabled
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('error message matches snapshot', () => {
    const { container } = render(
      <OneTimePasswordField
        name="otp"
        value=""
        onChange={() => {}}
        errorMessage="Invalid code"
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('hint matches snapshot', () => {
    const { container } = render(
      <OneTimePasswordField
        name="otp"
        value=""
        onChange={() => {}}
        hint="Enter the code sent to your email"
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
