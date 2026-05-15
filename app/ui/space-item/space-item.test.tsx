import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Root as AccordionRoot } from '@radix-ui/react-accordion';
import { SpaceItem } from './space-item';

function renderInAccordion(
  ui: React.ReactNode,
  { defaultValue }: { defaultValue?: string[] } = {},
) {
  return render(
    <AccordionRoot type="multiple" defaultValue={defaultValue}>
      {ui}
    </AccordionRoot>,
  );
}

describe('SpaceItem', () => {
  test('renders the title', () => {
    renderInAccordion(
      <SpaceItem title="Personal" icon="space" value="personal">
        body content
      </SpaceItem>,
    );

    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('is collapsed by default', () => {
    renderInAccordion(
      <SpaceItem title="Personal" icon="space" value="personal">
        body content
      </SpaceItem>,
    );

    expect(
      screen.getByRole('button', { name: 'Personal' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('body content')).not.toBeInTheDocument();
  });

  test('expands when the trigger is clicked', async () => {
    const user = userEvent.setup();
    renderInAccordion(
      <SpaceItem title="Personal" icon="space" value="personal">
        body content
      </SpaceItem>,
    );

    await user.click(screen.getByRole('button', { name: 'Personal' }));

    expect(
      screen.getByRole('button', { name: 'Personal' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  test('renders expanded when its value is in the accordion defaultValue', () => {
    renderInAccordion(
      <SpaceItem title="Personal" icon="space" value="personal">
        body content
      </SpaceItem>,
      { defaultValue: ['personal'] },
    );

    expect(
      screen.getByRole('button', { name: 'Personal' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  test('renders an icon', () => {
    const { container } = renderInAccordion(
      <SpaceItem title="Personal" icon="space" value="personal">
        body
      </SpaceItem>,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  describe('actionArea', () => {
    test('renders the actionArea when provided', () => {
      renderInAccordion(
        <SpaceItem
          title="Work"
          icon="space"
          value="work"
          actionArea={<span data-testid="action-area">Options</span>}
        >
          body
        </SpaceItem>,
      );

      expect(screen.getByTestId('action-area')).toBeInTheDocument();
    });

    test('does not render an actionArea container when omitted', () => {
      renderInAccordion(
        <SpaceItem title="Personal" icon="space" value="personal">
          body
        </SpaceItem>,
      );

      // Only the AccordionTrigger button should exist.
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    test('should match snapshot', () => {
      const { container } = renderInAccordion(
        <SpaceItem
          title="Work"
          icon="space"
          value="work"
          actionArea={<span data-testid="action-area">Options</span>}
        >
          body
        </SpaceItem>,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
