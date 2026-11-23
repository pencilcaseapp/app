import type { Meta, StoryObj } from '@storybook/react-vite';
import { DocumentGroupEmpty } from './document-group-empty';
import { Button } from '../button/button';

/**
 * `DocumentGroupEmpty` is the empty state of a folder in the navigation,
 * rendered in place of its documents when it has none. It is generic on
 * purpose: every folder passes its own icon, message, and optional call
 * to action.
 */
const meta: Meta<typeof DocumentGroupEmpty> = {
  title: 'Navigation/DocumentGroupEmpty',
  component: DocumentGroupEmpty,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <div className="w-62.5 px-3 py-2">
        <Story />
      </div>
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
    actionArea: <Button colorLight="grey-900">Create doc</Button>,
  },
};
