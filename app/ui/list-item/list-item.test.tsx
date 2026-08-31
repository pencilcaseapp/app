import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ListItem } from './list-item';

describe('ListItem', () => {
  it('renders the check icon with theme colors by default', () => {
    const { container } = render(
      <ul>
        <ListItem>Unlimited docs</ListItem>
      </ul>,
    );

    expect(screen.getByText('Unlimited docs')).toBeInTheDocument();

    const iconWrapper = container.querySelector('svg')?.parentElement;

    expect(iconWrapper).toHaveClass('text-pca-grey-900');
    expect(iconWrapper).toHaveClass('dark:text-white');
    expect(container).toMatchSnapshot();
  });

  it('renders a success icon', () => {
    const { container } = render(
      <ul>
        <ListItem iconColorLight="green-700" iconColorDark="green-700">
          Hosted in the EU
        </ListItem>
      </ul>,
    );

    const iconWrapper = container.querySelector('svg')?.parentElement;

    expect(iconWrapper).toHaveClass('text-pca-green-700');
    expect(iconWrapper).toHaveClass('dark:text-pca-green-700');
  });

  it('renders a danger icon and a custom icon', () => {
    const { container } = render(
      <ul>
        <ListItem
          icon="close"
          iconColorLight="red-500"
          iconColorDark="red-500"
        >
          No access control
        </ListItem>
      </ul>,
    );

    const iconWrapper = container.querySelector('svg')?.parentElement;

    expect(iconWrapper).toHaveClass('text-pca-red-500');
    expect(container).toMatchSnapshot();
  });

  it('pins the colors for fixed surfaces', () => {
    const { container } = render(
      <ul>
        <ListItem iconColorDark="grey-900" textColorDark="grey-900">
          Support small tech
        </ListItem>
      </ul>,
    );

    expect(container.querySelector('svg')?.parentElement)
      .toHaveClass('dark:text-pca-grey-900');
    expect(screen.getByText('Support small tech'))
      .toHaveClass('dark:text-pca-grey-900');
  });
});
