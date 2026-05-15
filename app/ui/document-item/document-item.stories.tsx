import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { MemoryRouter, NavLink } from 'react-router';
import { DocumentItem } from './document-item';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu';
import { DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu-trigger';
import { DropdownMenuPortal } from '../dropdown-menu/dropdown-menu-portal';
import { DropdownMenuContent } from '../dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '../dropdown-menu/dropdown-menu-item';
import { DropdownMenuSeparator } from '../dropdown-menu/dropdown-menu-separator';

/**
 * `DocumentItem` represents a single document entry in a list, typically
 * rendered inside a `SpaceItem`. It displays the document title and an
 * optional `actionArea` (e.g. a dropdown menu) that is only revealed on
 * hover or focus on larger screens.
 *
 * By default `DocumentItem` renders as an `<a>` element, but the
 * polymorphic `as` prop allows it to render as any other element or
 * component — for example a React Router `NavLink`.
 *
 * ```tsx
 * import { NavLink } from 'react-router';
 *
 * <DocumentItem
 *   as={NavLink}
 *   to="/documents/1"
 *   title="My Document"
 * />
 * ```
 */
const meta: Meta<typeof DocumentItem> = {
  title: 'Navigation/DocumentItem',
  component: DocumentItem,
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
type Story = StoryObj<typeof DocumentItem>;

/**
 * The simplest form of a `DocumentItem` — just a title rendered as a link.
 */
export const Default: Story = {
  render: () => (
    <DocumentItem
      as={NavLink}
      to="/documents/1"
      title="Le Cours Français (A.2.1)"
      actionArea={(
        <DropdownMenu>
          <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Document options" />
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
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      )}
    />
  ),
};

/**
 * When a `DocumentItem` is rendered as a `NavLink` and the current route
 * matches its `to` prop, React Router sets `aria-current="page"` on the
 * element, which the component picks up to render an active background.
 */
export const Active: Story = {
  parameters: {
    initialEntries: ['/documents/1'],
  },
  render: () => (
    <DocumentItem
      as={NavLink}
      to="/documents/1"
      title="Le Cours Français (A.2.1)"
      actionArea={(
        <DropdownMenu>
          <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Document options" />
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
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      )}
    />
  ),
};

/**
 * A long title is truncated with an ellipsis and the full title is shown
 * as a native tooltip via the `title` attribute.
 */
export const TruncatedTitle: Story = {
  render: () => (
    <DocumentItem
      as={NavLink}
      to="/documents/1"
      title="A very long document title that will not fit inside the container and gets truncated"
      actionArea={(
        <DropdownMenu>
          <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Document options" />
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
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      )}
    />
  ),
};

/**
 * `DocumentItem` accepts an `actionArea` that is rendered to the right of
 * the title. On large screens it stays hidden until the item is hovered or
 * focused; on small screens it is always visible.
 */
export const WithActionArea: Story = {
  render: () => (
    <DocumentItem
      as={NavLink}
      to="/documents/1"
      title="Le Cours Français (A.2.1)"
      actionArea={(
        <DropdownMenu>
          <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Document options" />
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
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      )}
    />
  ),
};

/**
 * Multiple `DocumentItem`s rendered as a list.
 */
export const List: Story = {
  render: () => (
    <>
      <DocumentItem
        as={NavLink}
        to="/documents/1"
        title="Le Cours Français (A.2.1)"
        actionArea={(
          <DropdownMenu>
            <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Document options" />
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
                  Delete Document
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
            <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Document options" />
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
                  Delete Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        )}
      />
      <DocumentItem
        as={NavLink}
        to="/documents/3"
        title="Le Cours Français (A.2.3)"
        actionArea={(
          <DropdownMenu>
            <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Document options" />
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
                  Delete Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        )}
      />
    </>
  ),
};
