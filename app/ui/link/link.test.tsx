import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Link } from './link';
import { MemoryRouter, Link as ReactRouterLink } from 'react-router';

describe('Link', () => {
  test('renders a link', () => {
    const { container } = render(
      <Link variant="body" href="https://pencilcase.app" target="_blank">
        Go to pencil case
      </Link>,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders a react router link', () => {
    const { container } = render(
      <MemoryRouter>
        <Link variant="body" as={ReactRouterLink} to="/some-path">
          Go to pencil case
        </Link>
      </MemoryRouter>,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders a link with custom styling', () => {
    const { container } = render(
      <MemoryRouter>
        <Link
          variant="body"
          href="https://pencilcase.app"
          textColorLight="red-500"
          textColorDark="white"
        >
          Go to pencil case
        </Link>
      </MemoryRouter>,
    );

    expect(container).toMatchSnapshot();
  });
});
