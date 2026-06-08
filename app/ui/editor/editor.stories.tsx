import type { Meta, StoryObj } from '@storybook/react-vite';
import { Editor } from './editor';
import { initialEditorStateFixture } from '~/test/fixtures/editor';

const meta = {
  title: 'Editor/Editor',
  component: Editor,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    avatars: [],
    initialEditorState: JSON.stringify(initialEditorStateFixture),
  },
};
