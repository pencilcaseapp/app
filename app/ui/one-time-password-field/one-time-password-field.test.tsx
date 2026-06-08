import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { OneTimePasswordField } from './one-time-password-field';

describe('OneTimePasswordField', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <OneTimePasswordField
        value=""
        onValueChange={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('disabled matches snapshot', () => {
    const { container } = render(
      <OneTimePasswordField
        value=""
        onValueChange={() => {}}
        disabled
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('error message matches snapshot', () => {
    const { container } = render(
      <OneTimePasswordField
        value=""
        onValueChange={() => {}}
        errorMessage="Invalid code"
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
