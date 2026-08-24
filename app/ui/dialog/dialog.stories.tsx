/* eslint-disable @eslint-react/rules-of-hooks */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Dialog } from './dialog';
import { DialogContent } from './dialog-content';
import { DialogTopbar } from './dialog-topbar';
import { Button } from '../button/button';
import { Typography } from '../typography/typography';
import { NavigationItem } from '../navigation-item/navigation-item';
import { TextField } from '../text-field/text-field';

/**
 * `Dialog` is a thin wrapper around Base UI's `Dialog.Root` and is composed
 * with `DialogContent` (portal, backdrop, viewport and popup) and the
 * optional `DialogTopbar`. Trigger, close, title and description parts come
 * straight from `@base-ui/react/dialog`.
 *
 * The content area is always rendered, the top, side and footer areas are
 * opt-in, so the same component covers a small confirmation dialog and a
 * full settings area. A `sideArea` splits everything below the topbar into
 * two columns, which keeps the footer inside the content column instead of
 * running under the navigation.
 */
const meta: Meta<typeof Dialog> = {
  title: 'Overlay/Dialog',
  component: Dialog,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    modal: {
      control: 'boolean',
      description: 'Whether the dialog traps focus and locks page scroll.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

/**
 * The smallest useful composition: a trigger, a title, a description and no
 * chrome around the content area.
 */
export const Default: Story = {
  render: args => (
    <div className="flex min-h-dvh items-center justify-center">
      <Dialog {...args}>
        <BaseDialog.Trigger
          render={<Button colorLight="primary">Open dialog</Button>}
        />
        <DialogContent size="small">
          <BaseDialog.Title render={<Typography variant="heading3" as="h2" />}>
            Delete document
          </BaseDialog.Title>
          <BaseDialog.Description
            render={(
              <Typography
                variant="bodySmall"
                as="p"
                textColorLight="grey-600"
                textColorDark="grey-400"
                className="mt-2"
              />
            )}
          >
            This action cannot be undone.
          </BaseDialog.Description>
        </DialogContent>
      </Dialog>
    </div>
  ),
};

/**
 * A confirmation dialog with a topbar and a footer. The topbar owns the
 * title and the close trigger, the footer is laid out by the consumer.
 */
export const WithTopbarAndFooter: Story = {
  render: args => (
    <div className="flex min-h-dvh items-center justify-center">
      <Dialog {...args}>
        <BaseDialog.Trigger
          render={<Button colorLight="primary">Open dialog</Button>}
        />
        <DialogContent
          size="small"
          topArea={<DialogTopbar title="Delete document" />}
          footerArea={(
            <div className="flex items-center justify-end gap-2">
              <BaseDialog.Close
                render={<Button colorLight="secondary">Cancel</Button>}
              />
              <Button colorLight="danger">Delete</Button>
            </div>
          )}
        >
          <Typography
            variant="bodySmall"
            textColorLight="grey-600"
            textColorDark="grey-400"
          >
            “Meeting notes” will be deleted for everyone it is shared with.
          </Typography>
        </DialogContent>
      </Dialog>
    </div>
  ),
};

const settingsSections = [
  { id: 'Account', icon: 'settings' },
  { id: 'Subscription', icon: 'space' },
  { id: 'Support', icon: 'info' },
] as const;

/**
 * The settings composition: a large, full height dialog whose navigation
 * lives in the `sideArea`, so it owns a full height column and the footer
 * only spans the content next to it. The topbar only shows a back button
 * once a sub page is open — `onBack` is what makes it appear, so without it
 * the slot stays empty and the title stays optically centred.
 */
export const Settings: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [section, setSection] = useState<string>('Account');
    const [isChangingEmail, setIsChangingEmail] = useState(false);

    const openSection = (id: string) => {
      setSection(id);
      setIsChangingEmail(false);
    };

    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Button colorLight="primary" onClick={() => setOpen(true)}>
          Open settings
        </Button>
        <Dialog {...args} open={open} onOpenChange={setOpen}>
          <DialogContent
            size="large"
            isFullHeight
            topArea={(
              <DialogTopbar
                title={isChangingEmail ? 'Change e-mail' : section}
                onBack={
                  isChangingEmail
                    ? () => setIsChangingEmail(false)
                    : undefined
                }
              />
            )}
            sideArea={(
              <nav className="flex h-full w-44 flex-col justify-between gap-1">
                <div className="flex flex-col gap-1">
                  {settingsSections.map(({ id, icon }) => (
                    <NavigationItem
                      key={id}
                      as="button"
                      type="button"
                      icon={icon}
                      title={id}
                      aria-current={id === section ? 'page' : undefined}
                      onClick={() => openSection(id)}
                    />
                  ))}
                </div>
                <Button
                  colorLight="secondary"
                  className="w-full justify-start text-pca-red-500! dark:text-pca-red-500!"
                >
                  Logout
                </Button>
              </nav>
            )}
            footerArea={(
              <div className="flex items-center justify-end gap-2">
                <BaseDialog.Close
                  render={<Button colorLight="secondary">Cancel</Button>}
                />
                <Button>{isChangingEmail ? 'Continue' : 'Save'}</Button>
              </div>
            )}
          >
            {isChangingEmail
              ? (
                  <div className="flex flex-col gap-4">
                    <Typography variant="heading3" as="h3">
                      Enter new e-mail
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      textColorLight="grey-600"
                      textColorDark="grey-400"
                    >
                      We will send a verification code to your new address so
                      you do not get locked out of your account.
                    </Typography>
                    <TextField
                      id="new-email"
                      type="email"
                      label="E-mail"
                      placeholder="your@email.com"
                    />
                  </div>
                )
              : (
                  <div className="flex flex-col items-start gap-4">
                    <Typography variant="heading3" as="h3">
                      {section}
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      textColorLight="grey-600"
                      textColorDark="grey-400"
                    >
                      The
                      {' '}
                      {section}
                      {' '}
                      settings live here.
                    </Typography>
                    {section === 'Account' && (
                      <Button
                        colorLight="secondary"
                        onClick={() => setIsChangingEmail(true)}
                      >
                        Change e-mail
                      </Button>
                    )}
                  </div>
                )}
          </DialogContent>
        </Dialog>
      </div>
    );
  },
};
