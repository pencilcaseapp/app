import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropdownMenu } from './dropdown-menu';
import { DropdownMenuTrigger } from './dropdown-menu-trigger';
import { DropdownMenuPortal } from './dropdown-menu-portal';
import { DropdownMenuContent } from './dropdown-menu-content';
import { DropdownMenuItem } from './dropdown-menu-item';
import { MemoryRouter } from 'react-router';
import { action } from 'storybook/actions';
import { DropdownMenuSeparator } from './dropdown-menu-separator';
import { Typography } from '../typography/typography';
import { Avatar } from '../avatar/avatar';

const meta: Meta<typeof DropdownMenu> = {
  title: 'Navigation/DropdownMenu',
  component: DropdownMenuContent,
};

export default meta;
type Story = StoryObj<typeof DropdownMenuContent>;

/**
 * The `DropdownMenuContent` displays a menu to
 * the user — such as a set of actions or links
 * to certain pages — triggered by a button/link.
 * The DropdownMenu component uses its own context
 * to manage the open state of the menu, allowing for
 * a clean exit animation when the menu is closed.
 */
export const BasicExample: Story = {
  render: () => (
    <MemoryRouter>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger iconTitle="Document Settings" />
          <DropdownMenuPortal>
            <DropdownMenuContent align="end">
              <DropdownMenuItem as="button" onClick={action('clicked')}>
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem>
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem color="danger" as="button">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
    </MemoryRouter>
  ),
};

/**
 * Shows the dropdown menu alongside surrounding text content
 * to better visualize the background color and backdrop blur
 * of the `DropdownMenuContent`.
 */
export const WithSurroundingContent: Story = {
  render: () => (
    <MemoryRouter>
      <div className="max-w-lg space-y-4 p-6">
        <Typography variant="heading2">Document settings</Typography>
        <Typography variant="bodySmall">
          Configure sharing, permissions, and other options for this document.
          Use the menu below to access available actions.
        </Typography>
        <div className="flex items-center justify-between rounded-xl bg-pca-grey-100 dark:bg-pca-grey-800 p-4">
          <Typography variant="bodySmall">Actions</Typography>
          <DropdownMenu>
            <DropdownMenuTrigger iconTitle="Document Settings" />
            <DropdownMenuPortal>
              <DropdownMenuContent align="end">
                <DropdownMenuItem as="button" onClick={action('clicked')} icon="share">
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem icon="folder">
                  Move to folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem color="danger" as="button" disabled>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
        <Typography variant="bodySmall">
          Changes are saved automatically.
          Deleted documents cannot be recovered.
        </Typography>
      </div>
    </MemoryRouter>
  ),
};

export const WithCustomTrigger: Story = {
  render: () => (
    <MemoryRouter>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar name="Pency Pencil" />
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end">
              <DropdownMenuItem as="button" onClick={action('clicked')}>
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem>
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem color="danger" as="button">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
    </MemoryRouter>
  ),
};
