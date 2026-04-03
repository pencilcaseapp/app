import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toolbar } from './toolbar';
import { ToolbarGroup } from './toolbar-group';
import { ToolbarToggle } from './toolbar-toggle';
import { ToolbarSeparator } from './toolbar-separator';

/**
 * Toolbar provides a container for grouping actions.
 * Use ToolbarGroup to visually cluster related buttons (ToolbarToggle),
 * and ToolbarSeparator to divide groups.
 */
const meta: Meta<typeof Toolbar> = {
  title: 'Editor/Toolbar',
  component: Toolbar,
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

export const WithGroups: Story = {
  render: () => (
    <Toolbar>
      <ToolbarGroup>
        <ToolbarToggle tooltipLabel="Heading 1" icon="h1" isActive />
        <ToolbarToggle tooltipLabel="Heading 2" icon="h2" isActive={false} />
        <ToolbarToggle tooltipLabel="Heading 3" icon="h3" isActive={false} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ToolbarToggle tooltipLabel="Bold" icon="bold" isActive={false} />
        <ToolbarToggle tooltipLabel="Italic" icon="italic" isActive={false} />
        <ToolbarToggle tooltipLabel="Underline" icon="underline" isActive={false} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ToolbarToggle tooltipLabel="Bulleted list" icon="listUl" isActive={false} />
        <ToolbarToggle tooltipLabel="Numbered list" icon="listOl" isActive={false} />
        <ToolbarToggle tooltipLabel="Checklist" icon="listCheck" isActive={false} />
      </ToolbarGroup>
    </Toolbar>
  ),
};
