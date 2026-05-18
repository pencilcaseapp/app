import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavigationItem } from './navigation-item';

describe('NavigationItem', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <NavigationItem
        href="/spaces/personal"
        title="Personal"
        icon="space"
        actionArea={<span data-testid="action-area">…</span>}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders the title and icon', () => {
    const { container } = render(
      <NavigationItem href="/spaces/personal" title="Personal" icon="space" />,
    );

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders as an anchor by default and forwards rest props', () => {
    const { container } = render(
      <NavigationItem href="/spaces/personal" title="Personal" icon="space" />,
    );

    const anchor = container.querySelector('a');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('href', '/spaces/personal');
  });

  test('renders the actionArea as a sibling of the link', () => {
    render(
      <NavigationItem
        href="/spaces/personal"
        title="Personal"
        icon="space"
        actionArea={<span data-testid="action-area">action</span>}
      />,
    );

    const action = screen.getByTestId('action-area');
    expect(action).toBeInTheDocument();
    expect(action.closest('a')).toBeNull();
  });

  describe('iconOnly', () => {
    test('does not render the title text', () => {
      render(
        <NavigationItem
          href="/spaces/personal"
          title="Personal"
          icon="space"
          iconOnly
        />,
      );

      expect(screen.queryByText('Personal')).not.toBeInTheDocument();
    });

    test('does not render the actionArea', () => {
      render(
        <NavigationItem
          href="/spaces/personal"
          title="Personal"
          icon="space"
          iconOnly
          actionArea={<span data-testid="action-area">action</span>}
        />,
      );

      expect(screen.queryByTestId('action-area')).not.toBeInTheDocument();
    });
  });
});
