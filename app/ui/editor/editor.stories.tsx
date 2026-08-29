import type { Meta, StoryObj } from '@storybook/react-vite';
import { Editor } from './editor';
import {
  emptyEditorStateFixture,
  initialEditorStateFixture,
} from '~/test/fixtures/editor';
import { SidebarProvider } from '../sidebar-context/sidebar-provider';
import { PRESENCE_COLORS } from '~/constants/presence';

const meta = {
  title: 'Editor/Editor',
  component: Editor,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    avatars: [],
    initialEditorState: JSON.stringify(initialEditorStateFixture),
  },
};

/* What a freshly created document looks like: one empty heading showing the
   placeholder. */
export const Empty: Story = {
  args: {
    avatars: [],
    initialEditorState: JSON.stringify(emptyEditorStateFixture),
  },
};

export const WithCollaborators: Story = {
  args: {
    avatars: [
      { id: 'caroline', name: 'Caroline', color: PRESENCE_COLORS[9] },
      { id: 'harold', name: 'Harold', color: PRESENCE_COLORS[1] },
      { id: 'alfred', name: 'Alfred', color: PRESENCE_COLORS[11] },
    ],
    initialEditorState: JSON.stringify(initialEditorStateFixture),
  },
};

export const WithCollaboratorOverflow: Story = {
  args: {
    avatars: [
      { id: 'caroline', name: 'Caroline', color: PRESENCE_COLORS[9] },
      { id: 'harold', name: 'Harold', color: PRESENCE_COLORS[1] },
      { id: 'alfred', name: 'Alfred', color: PRESENCE_COLORS[11] },
      { id: 'otter', name: 'Otter', color: PRESENCE_COLORS[5] },
      { id: 'quokka', name: 'Quokka', color: PRESENCE_COLORS[14] },
    ],
    initialEditorState: JSON.stringify(initialEditorStateFixture),
  },
};
