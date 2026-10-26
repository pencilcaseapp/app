import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextArea } from './text-area';

describe('TextArea', () => {
  test('renders the text area with label', () => {
    const { container } = render(<TextArea id="test" label="Test Label" />);

    expect(container).toMatchSnapshot();
  });

  test('labels the field', () => {
    render(<TextArea id="details" label="Details" />);

    expect(screen.getByLabelText('Details').tagName).toBe('TEXTAREA');
  });

  test('renders hint text', () => {
    render(<TextArea id="details" label="Details" hint="Optional" />);

    expect(screen.getByText('Optional')).toBeInTheDocument();
  });
});
