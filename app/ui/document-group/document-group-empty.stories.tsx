import type { Meta, StoryObj } from '@storybook/react-vite';
import { Root as AccordionRoot } from '@radix-ui/react-accordion';
import { DocumentGroup } from './document-group';
import { DocumentGroupEmpty } from './document-group-empty';
import { Button } from '../button/button';

/**
 * `DocumentGroupEmpty` is the empty state of a `DocumentGroup` —
 * rendered as the group's body when it has no items yet. It is
 * generic on purpose: any group (Deleted, Shared, a future folder)
 * passes its own icon, message, and optional call to action.
 */
const meta: Meta<typeof DocumentGroupEmpty> = {
  title: 'Navigation/DocumentGroupEmpty',
  component: DocumentGroupEmpty,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <AccordionRoot
        type="multiple"
        defaultValue={['group']}
        className="flex flex-col gap-1.5 w-62.5 px-3 py-2"
      >
        <DocumentGroup icon="space" title="Design Research" value="group">
          <Story />
        </DocumentGroup>
      </AccordionRoot>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentGroupEmpty>;

/**
 * The plain message-only empty state.
 */
export const Default: Story = {
  args: {
    children: 'No documents here',
  },
};

/**
 * With a muted icon above the message.
 */
export const WithIcon: Story = {
  args: {
    icon: 'no-docs',
    children: 'No documents here',
  },
};

/**
 * With a call to action, for groups the user can fill themselves.
 */
export const WithActionArea: Story = {
  args: {
    icon: 'no-docs',
    children: 'No documents here',
    actionArea: <Button colorLight="primary">Create doc</Button>,
  },
};
