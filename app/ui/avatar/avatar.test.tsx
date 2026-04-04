import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './avatar';

describe('small', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <Avatar name="Pency Pencilton" size="small" />,
    );

    expect(container).toMatchSnapshot();
  });
});

describe('large', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <Avatar name="Pency Pencilton" size="large" />,
    );

    expect(container).toMatchSnapshot();
  });
});

describe('custom color', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <Avatar name="Alice" color="#E74C3C" />,
    );

    expect(container).toMatchSnapshot();
  });
});

describe('initials', () => {
  test('renders first character of name', () => {
    render(<Avatar name="Pency Pencilton" />);

    expect(screen.getByText('P')).toBeInTheDocument();
  });

  test('uppercases the first character', () => {
    render(<Avatar name="alice" />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
