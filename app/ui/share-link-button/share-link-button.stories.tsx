import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShareLinkButton } from './share-link-button';

/**
 * 📤 The `ShareLinkButton` hands the given `link` to the native share sheet
 * through the Web Share API, which is what phones and tablets offer instead
 * of copying a link to the clipboard.
 *
 * Browsers without the API do nothing on click, so only render it where
 * `useCanShare` says the sheet is available.
 */
const meta: Meta<typeof ShareLinkButton> = {
  title: 'Forms/ShareLinkButton',
  component: ShareLinkButton,
  args: {
    link: 'https://pencilcase.app/doc/42',
    label: 'Share link',
  },
};

export default meta;
type Story = StoryObj<typeof ShareLinkButton>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
