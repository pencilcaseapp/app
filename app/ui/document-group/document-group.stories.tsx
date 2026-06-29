import type { Meta, StoryObj } from '@storybook/react-vite';
import { Root as AccordionRoot } from '@radix-ui/react-accordion';
import { action } from 'storybook/actions';
import { DocumentGroup } from './document-group';
import { Typography } from '../typography/typography';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu';
import { DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu-trigger';
import { DropdownMenuPortal } from '../dropdown-menu/dropdown-menu-portal';
import { DropdownMenuContent } from '../dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '../dropdown-menu/dropdown-menu-item';
import { DropdownMenuSeparator } from '../dropdown-menu/dropdown-menu-separator';
import { DocumentItem } from '../document-item/document-item';
import { MemoryRouter } from 'react-router';
import { NavLink } from 'react-router';

/**
 * `DocumentGroup` is a collapsible section built on top of
 * Radix UI's `Accordion`. Each item has an icon, a title,
 * an optional `actionArea` rendered next to the title,
 * and a body that expands/collapses on click.
 *
 * Because `DocumentGroup` is an accordion item, it must be
 * rendered inside an `Accordion.Root`.
 */
const meta: Meta<typeof DocumentGroup> = {
  title: 'Navigation/DocumentGroup',
  component: DocumentGroup,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <AccordionRoot type="multiple" className="flex flex-col gap-1.5 w-62.5 px-3 py-2">
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </AccordionRoot>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentGroup>;

export const Default: Story = {
  args: {
    title: 'Personal',
    icon: 'space',
    value: 'personal',
    children: (
      <Typography variant="bodySmall">
        Documents that only belong to you live in this space.
      </Typography>
    ),
  },
};

/**
 * Use `actionArea` to render controls (e.g. a button or
 * dropdown menu) inline with the title.
 */
export const WithActionArea: Story = {
  args: {
    title: 'Work',
    icon: 'space',
    value: 'work',
    actionArea: (
      <DropdownMenu>
        <DropdownMenuTrigger iconTitle="Space options" />
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
              Delete Space
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    ),
    children: (
      <Typography variant="bodySmall">
        Documents shared with your collaborators.
      </Typography>
    ),
  },
};

/**
 * Multiple `DocumentGroup`s can be composed inside the same
 * `Accordion.Root`. With `type="multiple"`, several items
 * can be expanded at the same time.
 */
export const MultipleItems: Story = {
  render: () => (
    <>
      <DocumentGroup title="All Documents" icon="space" value="all-documents">
        <DocumentItem
          as={NavLink}
          to="/documents/1"
          title="Le Cours Français (A.2.1)"
          actionArea={(
            <DropdownMenu>
              <DropdownMenuTrigger iconTitle="Space options" />
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
                    Delete Space
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          )}
        />
        <DocumentItem
          as={NavLink}
          to="/documents/2"
          title="Le Cours Français (A.2.2)"
          actionArea={(
            <DropdownMenu>
              <DropdownMenuTrigger iconTitle="Space options" />
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
                    Delete Space
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          )}
        />
        <DocumentItem
          as={NavLink}
          to="/documents/3"
          title="Le Cours Français (A.2.3) x5"
          actionArea={(
            <DropdownMenu>
              <DropdownMenuTrigger iconTitle="Space options" />
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
                    Delete Space
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          )}
        />

      </DocumentGroup>
      <DocumentGroup title="Personal" icon="space" value="personal">
        <Typography variant="bodySmall">
          Your private documents.
        </Typography>
      </DocumentGroup>
      <DocumentGroup title="Shared" icon="share" value="shared">
        <Typography variant="bodySmall">
          Documents shared with your collaborators.
        </Typography>
      </DocumentGroup>
      <DocumentGroup title="Trash" icon="trash" value="trash">
        <Typography variant="bodySmall">
          Deleted documents are kept here for 30 days.
        </Typography>
      </DocumentGroup>
    </>
  ),
};
