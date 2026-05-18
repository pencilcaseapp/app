import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { NavigationItem } from './navigation-item';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu';
import { DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu-trigger';
import { DropdownMenuPortal } from '../dropdown-menu/dropdown-menu-portal';
import { DropdownMenuContent } from '../dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '../dropdown-menu/dropdown-menu-item';
import { DropdownMenuSeparator } from '../dropdown-menu/dropdown-menu-separator';
import { MemoryRouter, NavLink } from 'react-router';

/**
 * `NavigationItem` is a single row used in the sidebar
 * navigation. It renders an icon, a title and an optional
 * `actionArea` (for example a dropdown menu trigger).
 *
 * Because it uses Radix UI's `AccordionTrigger`, it has to
 * be rendered inside an `Accordion.Root` / `Accordion.Item`.
 */
const meta: Meta<typeof NavigationItem> = {
  title: 'Navigation/NavigationItem',
  component: NavigationItem,
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={parameters.initialEntries ?? ['/']}>
        <div className="w-55">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NavigationItem>;

export const Default: Story = {
  args: {
    title: 'Create Doc',
    icon: 'create-doc',
    value: 'create-doc',
  },
};

/**
 * Long titles are truncated with an ellipsis. The full
 * title is shown via the native `title` tooltip on hover.
 */
export const TruncatedTitle: Story = {
  args: {
    title: 'A very long navigation item title that should be truncated',
    icon: 'create-doc',
    value: 'long',
  },
};

/**
 * Use `actionArea` to render controls next to the title.
 * On desktop the action area is only visible on hover or
 * focus; on touch devices it is always shown.
 */
export const WithActionArea: Story = {
  parameters: {
    initialEntries: ['/'],
  },
  args: {
    title: 'Work',
    icon: 'create-doc',
    value: 'work',
    as: NavLink,
    to: '/create-doc',
    actionArea: (
      <DropdownMenu>
        <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Item options" />
        <DropdownMenuPortal>
          <DropdownMenuContent align="start">
            <DropdownMenuItem as="button" onClick={action('share')} icon="share">
              Share
            </DropdownMenuItem>
            <DropdownMenuItem as="button" onClick={action('rename')} icon="create-doc">
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem as="button" onClick={action('delete')} color="danger" icon="trash">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    title: 'Create Doc',
    icon: 'create-doc',
    value: 'create-doc',
    iconOnly: true,
  },
};
