import type { Meta, StoryObj } from '@storybook/react-vite';
import { Editor } from './editor';
import { initialEditorStateFixture } from '~/test/fixtures/editor';
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

export const WithCollaborators: Story = {
  args: {
    avatars: [
      { name: 'Caroline', color: PRESENCE_COLORS[9] },
      { name: 'Harold', color: PRESENCE_COLORS[1] },
      { name: 'Alfred', color: PRESENCE_COLORS[11] },
    ],
    initialEditorState: JSON.stringify(initialEditorStateFixture),
  },
};

export const WithCollaboratorOverflow: Story = {
  args: {
    avatars: [
      { name: 'Caroline', color: PRESENCE_COLORS[9] },
      { name: 'Harold', color: PRESENCE_COLORS[1] },
      { name: 'Alfred', color: PRESENCE_COLORS[11] },
      { name: 'Otter', color: PRESENCE_COLORS[5] },
      { name: 'Quokka', color: PRESENCE_COLORS[14] },
    ],
    initialEditorState: JSON.stringify(initialEditorStateFixture),
  },
};
