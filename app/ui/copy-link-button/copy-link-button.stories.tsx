import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyLinkButton } from './copy-link-button';

/**
 * 🔗 The `CopyLinkButton` writes the given `link` to the clipboard and swaps
 * to a confirmation state for `copiedDuration` milliseconds.
 *
 * All labels are props, so the copy stays in the app layer and never in the
 * UI library.
 */
const meta: Meta<typeof CopyLinkButton> = {
  title: 'Forms/CopyLinkButton',
  component: CopyLinkButton,
  args: {
    link: 'https://pencilcase.app/doc/42',
    label: 'Copy link',
    copiedLabel: 'Link copied!',
  },
};

export default meta;
type Story = StoryObj<typeof CopyLinkButton>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
