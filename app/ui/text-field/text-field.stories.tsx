import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './text-field';
import { Select } from '../select/select';

/**
 * TextField component for user input
 */
const meta: Meta<typeof TextField> = {
  title: 'Forms/TextField',
  component: TextField,
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Text: Story = {
  args: {
    id: 'name',
    type: 'text',
    label: 'Name',
    placeholder: 'e.g. John Doe',
  },
};

export const Disabled: Story = {
  args: {
    id: 'name',
    type: 'text',
    value: '',
    label: 'Name',
    placeholder: 'e.g. John Doe',
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    id: 'name',
    type: 'text',
    label: 'Name',
    placeholder: 'e.g. John Doe',
    errorMessage: 'Please enter a valid name',
  },
};

export const WithHint: Story = {
  args: {
    id: 'name',
    type: 'text',
    label: 'Name',
    placeholder: 'e.g. John Doe',
    hint: 'Your full name is required',
  },
};

/**
 * `trailing` pins content to the right hand side of the field, inside its
 * border. It sits next to the input rather than over it, so it can be any
 * width and the typed value never runs underneath it.
 */
export const WithTrailing: Story = {
  render: () => (
    <TextField
      id="invite-email"
      type="email"
      label="Invite"
      placeholder="name@mail.com"
      trailing={(
        <Select
          aria-label="Access for the invited person"
          items={[
            { value: 'view', label: 'Can view' },
            { value: 'edit', label: 'Can edit' },
          ]}
          defaultValue="edit"
        />
      )}
    />
  ),
};

export const WithTrailingAndError: Story = {
  render: () => (
    <TextField
      id="invite-email-error"
      type="email"
      label="Invite"
      placeholder="name@mail.com"
      errorMessage="Enter a valid email address"
      trailing={(
        <Select
          aria-label="Access for the invited person"
          items={[
            { value: 'view', label: 'Can view' },
            { value: 'edit', label: 'Can edit' },
          ]}
          defaultValue="edit"
        />
      )}
    />
  ),
};

/**
 * A field with a trailing element is the same height as one without: the
 * padding stays on the input in both, so both come out 46px.
 *
 * The `<input>` itself measures 44px in the trailing case, because there the
 * border sits on the box around it rather than on the input. The field you
 * can see is the bordered box, and that is 46px either way.
 */
export const HeightMatchesPlainField: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <TextField
        id="plain-field"
        type="email"
        label="Without a trailing element"
        placeholder="name@mail.com"
      />
      <TextField
        id="trailing-field"
        type="email"
        label="With a trailing element"
        placeholder="name@mail.com"
        trailing={(
          <Select
            aria-label="Access for the invited person"
            items={[
              { value: 'view', label: 'Can view' },
              { value: 'edit', label: 'Can edit' },
            ]}
            defaultValue="edit"
          />
        )}
      />
    </div>
  ),
};
