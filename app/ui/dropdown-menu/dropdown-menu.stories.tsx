import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
import { Icon } from '../icon/icon';
import { ChoiceTrigger } from '../choice-trigger/choice-trigger';

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
                <DropdownMenuItem icon="space">
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

/**
 * The `solid` variant swaps the frosted surface for an opaque background and a
 * hairline border, so the menu stays legible over busy or coloured content
 * where the backdrop blur would otherwise show through.
 */
export const SolidVariant: Story = {
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
              <DropdownMenuContent align="end" variant="solid">
                <DropdownMenuItem as="button" onClick={action('clicked')} icon="share">
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem icon="space">
                  Move to folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem color="danger" as="button">
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

/**
 * `trailing` pins content to the right hand side of an item — a check mark for
 * the current choice, a keyboard shortcut, a count. The label keeps the space
 * it does not use.
 */
export const WithTrailingContent: Story = {
  render: () => (
    <MemoryRouter>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger iconTitle="Access" />
          <DropdownMenuPortal>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                as="button"
                onClick={action('clicked')}
                trailing={<Icon icon="check" className="h-4 w-4" />}
              >
                Can view
              </DropdownMenuItem>
              <DropdownMenuItem as="button" onClick={action('clicked')}>
                Can edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem color="danger" as="button">
                Remove access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
    </MemoryRouter>
  ),
};

const ROLE_LABEL = { view: 'Can view', edit: 'Can edit' } as const;

type Role = keyof typeof ROLE_LABEL;

type Person = {
  id: string;
  name: string;
  email: string;
  role: Role;
  pending?: boolean;
};

const INVITED: Person[] = [
  {
    id: 'p1',
    name: 'Alexandra Konstantinopoulou',
    email: 'alexandra.konstantinopoulou@example-university.edu',
    role: 'edit',
  },
  { id: 'p2', name: 'Jörg Müller', email: 'joerg@example.de', role: 'view', pending: true },
  { id: 'p3', name: 'Sam Okafor', email: 'sam@okafor.studio', role: 'edit' },
];

/**
 * The role beside an invited person is a menu rather than a select: picking
 * one acts straight away, and the list also holds "Remove access", which is a
 * command and could never be an option in a listbox.
 *
 * It shares `ChoiceTrigger` with the `Select`, so the chooser in the invite
 * field and the one on a row are the same button. Pick a role or remove
 * somebody and the list updates.
 */
export const PeopleWithAccess: Story = {
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [people, setPeople] = useState(INVITED);

    const setRole = (id: string, role: Role) => setPeople(current =>
      current.map(person => (person.id === id ? { ...person, role } : person)),
    );
    const remove = (id: string) => setPeople(current =>
      current.filter(person => person.id !== id),
    );

    return (
      <MemoryRouter>
        <div className="max-w-md space-y-3 p-6">
          <Typography variant="bodyTiny" textColorLight="grey-700" textColorDark="grey-300">
            People with access
          </Typography>
          <ul className="flex flex-col gap-1">
            {people.map(person => (
              <li key={person.id} className="flex min-h-11 items-center gap-3">
                <Avatar name={person.name} as="div" />
                <div className="flex min-w-0 grow flex-col">
                  <Typography variant="bodySmall" className="truncate">
                    {person.name}
                    {person.pending ? ' · Invited' : ''}
                  </Typography>
                  <Typography variant="bodyTiny" className="truncate" textColorLight="grey-700" textColorDark="grey-300">
                    {person.email}
                  </Typography>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <ChoiceTrigger aria-label={`Access for ${person.name}`}>
                      {ROLE_LABEL[person.role]}
                    </ChoiceTrigger>
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent align="end" variant="solid">
                      {(Object.keys(ROLE_LABEL) as Role[]).map(role => (
                        <DropdownMenuItem
                          key={role}
                          as="button"
                          onSelect={() => setRole(person.id, role)}
                          trailing={person.role === role
                            ? <Icon icon="check" className="h-4 w-4" />
                            : undefined}
                        >
                          {ROLE_LABEL[role]}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        as="button"
                        color="danger"
                        onSelect={() => remove(person.id)}
                      >
                        Remove access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenu>
              </li>
            ))}
          </ul>
          {people.length === 0 && (
            <Typography variant="bodySmall">
              Nobody else has access to this document.
            </Typography>
          )}
        </div>
      </MemoryRouter>
    );
  },
};
