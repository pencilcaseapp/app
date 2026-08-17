/* eslint-disable @eslint-react/rules-of-hooks */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Dialog } from './dialog';
import { DialogContent } from './dialog-content';
import { DialogTopbar } from './dialog-topbar';
import { Button } from '../button/button';
import { Typography } from '../typography/typography';

/**
 * `Dialog` is a thin wrapper around Base UI's `Dialog.Root` and is composed
 * with `DialogContent` (portal, backdrop, viewport and popup) and the
 * optional `DialogTopbar`. Trigger, close, title and description parts come
 * straight from `@base-ui/react/dialog`.
 *
 * The content area is always rendered, the top and footer areas are opt-in,
 * so the same component covers a small confirmation dialog and a full
 * settings area.
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

/**
 * The settings composition: a large, full height dialog whose topbar shows a
 * back button once a sub page is open. `onBack` is what makes the back
 * button appear — without it the slot stays empty so the title stays
 * optically centred.
 */
export const Settings: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [section, setSection] = useState<string | undefined>(undefined);

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
                title={section ?? 'Settings'}
                onBack={section ? () => setSection(undefined) : undefined}
              />
            )}
            footerArea={(
              <div className="flex items-center justify-end gap-2">
                <BaseDialog.Close
                  render={<Button colorLight="secondary">Cancel</Button>}
                />
                <Button>Save</Button>
              </div>
            )}
          >
            {section
              ? (
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
                )
              : (
                  <div className="flex flex-col gap-1">
                    {['Account', 'Subscription', 'Support'].map(item => (
                      <Button
                        key={item}
                        colorLight="secondary"
                        className="w-full justify-start"
                        onClick={() => setSection(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                )}
          </DialogContent>
        </Dialog>
      </div>
    );
  },
};
