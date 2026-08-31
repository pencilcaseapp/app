import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeatureListItem } from './feature-list-item';

describe('FeatureListItem', () => {
  it('renders with the grey check icon by default', () => {
    const { container } = render(
      <ul>
        <FeatureListItem>Unlimited docs</FeatureListItem>
      </ul>,
    );

    expect(screen.getByText('Unlimited docs')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveClass('text-pca-grey-900');
    expect(container).toMatchSnapshot();
  });

  it('renders a success icon', () => {
    const { container } = render(
      <ul>
        <FeatureListItem iconColor="success">
          Hosted in the EU
        </FeatureListItem>
      </ul>,
    );

    expect(container.querySelector('svg')).toHaveClass('text-pca-green-700');
  });

  it('renders a danger icon and a custom icon', () => {
    const { container } = render(
      <ul>
        <FeatureListItem icon="close" iconColor="danger">
          No access control
        </FeatureListItem>
      </ul>,
    );

    expect(container.querySelector('svg')).toHaveClass('text-pca-red-500');
    expect(container).toMatchSnapshot();
  });

  it('pins the text colors for fixed surfaces', () => {
    render(
      <ul>
        <FeatureListItem textColorDark="grey-900">
          Support small tech
        </FeatureListItem>
      </ul>,
    );

    expect(screen.getByText('Support small tech'))
      .toHaveClass('dark:text-pca-grey-900');
  });
});
