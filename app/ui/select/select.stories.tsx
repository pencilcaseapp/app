import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Select } from './select';
import { Typography } from '../typography/typography';

/**
 * A chooser for a value the surrounding form submits later.
 *
 * Built on the [Base UI Select](https://base-ui.com/react/components/select),
 * which provides the `role="listbox"` popup, the hidden input that carries the
 * value into `FormData`, and the `data-highlighted` / `data-popup-open` /
 * `data-disabled` attributes this component styles against.
 *
 * Use the `DropdownMenu` instead when picking an option acts straight away, or
 * when the list also holds commands such as removing access.
 */
const meta: Meta<typeof Select> = {
  title: 'Forms/Select',
  component: Select,
};

export default meta;
type Story = StoryObj<typeof Select<string>>;

const roles = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];

export const BasicExample: Story = {
  render: () => (
    <div className="flex items-center justify-center p-6">
      <Select aria-label="Access" items={roles} defaultValue="view" />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [value, setValue] = useState('view');
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Select
          aria-label="Access"
          items={roles}
          value={value}
          onValueChange={setValue}
        />
        <Typography variant="bodySmall">
          Selected:
          {' '}
          {value}
        </Typography>
      </div>
    );
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1 p-6">
      <Select
        label="Link access"
        items={roles}
        defaultValue="view"
      />
    </div>
  ),
};

/**
 * The `solid` variant matches the dropdown menu's, for a select that opens
 * over busy or coloured content where the backdrop blur would show through.
 */
export const SolidVariant: Story = {
  render: () => (
    <div className="max-w-lg space-y-4 p-6">
      <Typography variant="heading2">Share document</Typography>
      <Typography variant="bodySmall">
        Choose what anyone with the link is allowed to do with this document.
      </Typography>
      <div className="flex items-center justify-between rounded-xl bg-pca-grey-100 p-4 dark:bg-pca-grey-800">
        <Typography variant="bodySmall">Link access</Typography>
        <Select
          aria-label="Link access"
          items={roles}
          defaultValue="view"
          variant="solid"
        />
      </div>
      <Typography variant="bodySmall">
        Anyone with the link can open this document without signing in.
      </Typography>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center justify-center p-6">
      <Select
        aria-label="Access"
        items={roles}
        defaultValue="view"
        disabled={true}
      />
    </div>
  ),
};
