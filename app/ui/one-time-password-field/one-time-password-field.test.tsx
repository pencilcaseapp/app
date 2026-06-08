import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { OneTimePasswordField } from './one-time-password-field';

describe('OneTimePasswordField', () => {
  test('renders the text field with label', () => {
    const { container } = render(
      <OneTimePasswordField
        value=""
        onValueChange={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
