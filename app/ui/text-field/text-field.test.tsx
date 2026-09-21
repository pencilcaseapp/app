import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  test('renders trailing content inside the field', () => {
    render(
      <TextField
        id="email"
        label="Email"
        trailing={<button type="button">Can edit</button>}
      />,
    );

    const input = screen.getByLabelText('Email');
    const trailing = screen.getByRole('button', { name: 'Can edit' });

    expect(trailing).toBeInTheDocument();
    // The box around the input is what carries the field's border, so the
    // trailing content sits inside it rather than after the field.
    expect(input.parentElement).toContainElement(trailing);
  });

  test('keeps the field 44px tall with trailing content', () => {
    render(
      <TextField
        id="email"
        label="Email"
        trailing={<button type="button">Can edit</button>}
      />,
    );

    // h-11 is 44px, the height the design gives these fields.
    expect(screen.getByLabelText('Email').parentElement).toHaveClass('h-11');
  });

  test('keeps the input bordered when there is no trailing content', () => {
    render(<TextField id="email" label="Email" />);

    expect(screen.getByLabelText('Email')).toHaveClass('border');
  });
});
