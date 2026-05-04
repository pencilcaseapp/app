import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { TextField } from './text-field';

describe('TextField', () => {
  test('renders the text field with label', () => {
    const { container } = render(
      <TextField id="test" label="Test Label" />,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders disabled state', () => {
    const { container } = render(
      <TextField id="test" label="Test Label" disabled />,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders error state', () => {
    const { container } = render(
      <TextField id="test" label="Test Label" errorMessage="Error message" />,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders hint text', () => {
    const { container } = render(
      <TextField id="test" label="Test Label" hint="Hint text" />,
    );

    expect(container).toMatchSnapshot();
  });
});
