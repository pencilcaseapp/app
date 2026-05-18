import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Root as AccordionRoot } from '@radix-ui/react-accordion';
import { DocumentGroup } from './document-group';

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

describe('DocumentGroup', () => {
  test('renders the title', () => {
    renderInAccordion(
      <DocumentGroup title="Personal" icon="space" value="personal">
        body content
      </DocumentGroup>,
    );

    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('is collapsed by default', () => {
    renderInAccordion(
      <DocumentGroup title="Personal" icon="space" value="personal">
        body content
      </DocumentGroup>,
    );

    expect(
      screen.getByRole('button', { name: 'Personal' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('body content')).not.toBeInTheDocument();
  });

  test('expands when the trigger is clicked', async () => {
    const user = userEvent.setup();
    renderInAccordion(
      <DocumentGroup title="Personal" icon="space" value="personal">
        body content
      </DocumentGroup>,
    );

    await user.click(screen.getByRole('button', { name: 'Personal' }));

    expect(
      screen.getByRole('button', { name: 'Personal' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  test('renders expanded when its value is in the accordion defaultValue', () => {
    renderInAccordion(
      <DocumentGroup title="Personal" icon="space" value="personal">
        body content
      </DocumentGroup>,
      { defaultValue: ['personal'] },
    );

    expect(
      screen.getByRole('button', { name: 'Personal' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  test('renders an icon', () => {
    const { container } = renderInAccordion(
      <DocumentGroup title="Personal" icon="space" value="personal">
        body
      </DocumentGroup>,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  describe('actionArea', () => {
    test('renders the actionArea when provided', () => {
      renderInAccordion(
        <DocumentGroup
          title="Work"
          icon="space"
          value="work"
          actionArea={<span data-testid="action-area">Options</span>}
        >
          body
        </DocumentGroup>,
      );

      expect(screen.getByTestId('action-area')).toBeInTheDocument();
    });

    test('does not render an actionArea container when omitted', () => {
      renderInAccordion(
        <DocumentGroup title="Personal" icon="space" value="personal">
          body
        </DocumentGroup>,
      );

      // Only the AccordionTrigger button should exist.
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    test('should match snapshot', () => {
      const { container } = renderInAccordion(
        <DocumentGroup
          title="Work"
          icon="space"
          value="work"
          actionArea={<span data-testid="action-area">Options</span>}
        >
          body
        </DocumentGroup>,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
