import { render } from '@testing-library/react';
import { HorizontalOverflow } from './horizontal-overflow';
import { describe, expect, it } from 'vitest';

describe('HorizontalOverflow', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <HorizontalOverflow>
        <div>Pencil Case</div>
      </HorizontalOverflow>,
    );

    expect(container).toMatchSnapshot();
  });
});
