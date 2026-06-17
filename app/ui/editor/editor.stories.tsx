import type { Meta, StoryObj } from '@storybook/react-vite';
import { Editor } from './editor';
import { initialEditorStateFixture } from '~/test/fixtures/editor';
import { SidebarProvider } from '../sidebar-context/sidebar-provider';

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
