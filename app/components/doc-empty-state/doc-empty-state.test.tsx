import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocEmptyState } from './doc-empty-state';
import { SidebarProvider } from '~/ui/sidebar-context/sidebar-provider';

describe('DocEmptyState', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <SidebarProvider>
        <DocEmptyState
          title="Not Found"
          description="It may have been deleted."
          actionArea={<button>Go home</button>}
        />
      </SidebarProvider>,
    );

    expect(container).toMatchSnapshot();
  });
});
