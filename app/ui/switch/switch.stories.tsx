import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './switch';

/**
 * Switch component for toggling a boolean setting.
 *
 * Built on the [Base UI Switch](https://base-ui.com/react/components/switch),
 * which provides the `role="switch"` element, the hidden checkbox input for
 * form submission, and the `data-checked` / `data-unchecked` / `data-disabled`
 * attributes this component styles against.
 */
const meta: Meta<typeof Switch> = {
  title: 'Forms/Switch',
  component: Switch,
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Controlled: Story = {
  render: (args) => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [checked, setChecked] = useState(false);
    return (
      <Switch
        {...args}
        checked={checked}
        onCheckedChange={setChecked}
      />
    );
  },
  args: {
    id: 'link-sharing',
    label: 'Link sharing',
  },
};

export const Unchecked: Story = {
  args: {
    id: 'link-sharing',
    label: 'Link sharing',
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    id: 'link-sharing',
    label: 'Link sharing',
    checked: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    'id': 'link-sharing',
    'aria-label': 'Link sharing',
    'checked': true,
  },
};

export const Disabled: Story = {
  args: {
    id: 'link-sharing',
    label: 'Link sharing',
    disabled: true,
    checked: false,
  },
};

export const DisabledChecked: Story = {
  args: {
    id: 'link-sharing',
    label: 'Link sharing',
    disabled: true,
    checked: true,
  },
};

export const WithHint: Story = {
  args: {
    id: 'link-sharing',
    label: 'Link sharing',
    hint: 'Anyone with the link will be able to view this document.',
    checked: false,
  },
};

export const WithError: Story = {
  args: {
    id: 'link-sharing',
    label: 'Link sharing',
    errorMessage: 'Link sharing could not be enabled',
    checked: false,
  },
};
