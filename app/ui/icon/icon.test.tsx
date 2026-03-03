import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Icon } from './icon';
import { icons } from './icons';

describe('Icon Component', () => {
  it('should render with icon name', () => {
    Object.keys(icons).forEach((icon) => {
      const { container } = render(<Icon icon={icon as keyof typeof icons} />);
      expect(container).toMatchSnapshot();
    });
  });
});
