import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProfile } from './user-profile';

describe('with a name', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <UserProfile name="Pency Pencilton" email="pency@pencilcase.app" />,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders the name and the e-mail', () => {
    render(
      <UserProfile name="Pency Pencilton" email="pency@pencilcase.app" />,
    );

    expect(screen.getByText('Pency Pencilton')).toBeInTheDocument();
    expect(screen.getByText('pency@pencilcase.app')).toBeInTheDocument();
  });
});

describe('without a name', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <UserProfile name={null} email="pency@pencilcase.app" />,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders the e-mail once, as the display name', () => {
    render(<UserProfile name={null} email="pency@pencilcase.app" />);

    expect(screen.getAllByText('pency@pencilcase.app')).toHaveLength(1);
  });
});
