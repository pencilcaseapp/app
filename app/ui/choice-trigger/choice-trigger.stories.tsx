import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChoiceTrigger } from './choice-trigger';

/**
 * The compact label and caret that opens a chooser.
 *
 * It is only the trigger, so it can be handed to whichever chooser the choice
 * calls for: `Select` renders it through Base UI's `render` when the value is
 * submitted with a form, `DropdownMenu` through Radix's `asChild` when picking
 * acts straight away. Both look the same because both are this button.
 */
const meta: Meta<typeof ChoiceTrigger> = {
  title: 'Forms/ChoiceTrigger',
  component: ChoiceTrigger,
};

export default meta;
type Story = StoryObj<typeof ChoiceTrigger>;

export const BasicExample: Story = {
  args: { children: 'Can edit' },
};

export const Disabled: Story = {
  args: { children: 'Can edit', disabled: true },
};

export const Truncated: Story = {
  render: () => (
    <div className="w-40">
      <ChoiceTrigger>Can edit and manage sharing</ChoiceTrigger>
    </div>
  ),
};
