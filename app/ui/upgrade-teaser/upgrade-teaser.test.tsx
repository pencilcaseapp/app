import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Link as ReactRouterLink, MemoryRouter } from 'react-router';
import { UpgradeTeaser } from './upgrade-teaser';

describe('UpgradeTeaser', () => {
  it('renders the copy it is given', () => {
    const { getByText } = render(
      <UpgradeTeaser
        href="#upgrade"
        plan="Pro"
        title="Invite people by email"
        action="Upgrade"
      />,
    );

    expect(getByText('Pro')).toBeInTheDocument();
    expect(getByText('Invite people by email')).toBeInTheDocument();
    expect(getByText('Upgrade')).toBeInTheDocument();
  });

  it('renders an anchor by default', () => {
    const { getByRole } = render(
      <UpgradeTeaser
        href="#upgrade"
        plan="Pro"
        title="Invite people by email"
        action="Upgrade"
      />,
    );

    expect(getByRole('link')).toHaveAttribute('href', '#upgrade');
  });

  it('renders a react router link', () => {
    const { getByRole } = render(
      <MemoryRouter>
        <UpgradeTeaser
          as={ReactRouterLink}
          to="/upgrade"
          plan="Pro"
          title="Invite people by email"
          action="Upgrade"
        />
      </MemoryRouter>,
    );

    expect(getByRole('link')).toHaveAttribute('href', '/upgrade');
  });

  it('renders a button', () => {
    const { getByRole } = render(
      <UpgradeTeaser
        as="button"
        type="button"
        plan="Pro"
        title="Invite people by email"
        action="Upgrade"
      />,
    );

    expect(getByRole('button')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <UpgradeTeaser
        href="#upgrade"
        plan="Pro"
        title="Invite people by email"
        action="Upgrade"
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
