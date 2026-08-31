/* eslint-disable @eslint-react/rules-of-hooks */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from './responsive-dialog';
import { ResponsiveDialogContent } from './responsive-dialog-content';
import { ResponsiveDialogContentInner } from './responsive-dialog-content-inner';
import { ResponsiveDialogTopbar } from './responsive-dialog-topbar';
import { Drawer } from '../drawer/drawer';
import { DrawerContent } from '../drawer/drawer-content';
import { DrawerContentInner } from '../drawer/drawer-content-inner';
import { Button } from '../button/button';
import { NavigationItem } from '../navigation-item/navigation-item';
import { Typography } from '../typography/typography';

/**
 * `ResponsiveDialog` renders the bottom sheet drawer below Tailwind's `sm`
 * breakpoint and the centered dialog on every larger viewport — resize the
 * preview across 640px to switch between the two. Compose it with
 * `ResponsiveDialogContent`, `ResponsiveDialogContentInner` and the
 * `ResponsiveDialogTrigger`, `Close`, `Title` and `Description` parts,
 * which all follow the active variant.
 */
const meta: Meta<typeof ResponsiveDialog> = {
  title: 'Overlay/ResponsiveDialog',
  component: ResponsiveDialog,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    modal: {
      control: 'boolean',
      description: 'Whether the overlay traps focus and locks page scroll.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResponsiveDialog>;

/**
 * The smallest useful composition: a trigger, a title and a description.
 */
export const Default: Story = {
  render: args => (
    <div className="flex min-h-dvh items-center justify-center">
      <ResponsiveDialog {...args}>
        <ResponsiveDialogTrigger
          render={<Button colorLight="primary">Open</Button>}
        />
        <ResponsiveDialogContent>
          <ResponsiveDialogContentInner>
            <ResponsiveDialogTitle
              render={<Typography variant="heading3" as="h2" />}
            >
              Delete document
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription
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
            </ResponsiveDialogDescription>
          </ResponsiveDialogContentInner>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  ),
};

/**
 * A confirmation with a footer. The footer sits inside the dialog popup on
 * large viewports and becomes the pinned drawer footer on mobile.
 */
export const WithFooter: Story = {
  render: args => (
    <div className="flex min-h-dvh items-center justify-center">
      <ResponsiveDialog {...args}>
        <ResponsiveDialogTrigger
          render={<Button colorLight="primary">Open</Button>}
        />
        <ResponsiveDialogContent>
          <ResponsiveDialogContentInner
            footerArea={(
              <div className="flex items-center justify-end gap-2">
                <ResponsiveDialogClose
                  render={<Button colorLight="secondary">Cancel</Button>}
                />
                <Button colorLight="danger">Delete</Button>
              </div>
            )}
          >
            <ResponsiveDialogTitle
              className="mb-2"
              render={<Typography variant="heading3" as="h2" />}
            >
              Delete document
            </ResponsiveDialogTitle>
            <Typography
              variant="bodySmall"
              textColorLight="grey-600"
              textColorDark="grey-400"
            >
              “Meeting notes” will be deleted for everyone it is shared with.
            </Typography>
          </ResponsiveDialogContentInner>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  ),
};

/**
 * A multi-page composition held together by `ResponsiveDialogTopbar`: the
 * topbar owns the title and the close trigger in both variants, and shows
 * a back button once `onBack` is passed — here while the sub page is open.
 */
export const WithTopbar: Story = {
  render: (args) => {
    const [isOnSubPage, setIsOnSubPage] = useState(false);

    return (
      <div className="flex min-h-dvh items-center justify-center">
        <ResponsiveDialog {...args}>
          <ResponsiveDialogTrigger
            render={<Button colorLight="primary">Open settings</Button>}
          />
          <ResponsiveDialogContent size="large" isFullHeight>
            <ResponsiveDialogContentInner
              topArea={(
                <ResponsiveDialogTopbar
                  title={isOnSubPage ? 'Account' : 'Settings'}
                  onBack={isOnSubPage
                    ? () => setIsOnSubPage(false)
                    : undefined}
                />
              )}
            >
              {isOnSubPage
                ? (
                    <Typography
                      variant="bodySmall"
                      textColorLight="grey-600"
                      textColorDark="grey-400"
                    >
                      The Account settings live here.
                    </Typography>
                  )
                : (
                    <NavigationItem
                      as="button"
                      type="button"
                      icon="account"
                      title="Account"
                      onClick={() => setIsOnSubPage(true)}
                    />
                  )}
            </ResponsiveDialogContentInner>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>
    );
  },
};

/**
 * A `ResponsiveDialog` nested inside a drawer (like a delete confirmation
 * opened from a sidebar rendered as a bottom sheet). On mobile it opens as
 * a second drawer stacked on the first — Base UI registers the nesting
 * automatically because the root renders inside the parent drawer's tree,
 * and marks the parent popup with `data-nested-drawer-open` — while on
 * desktop it opens as the regular centered dialog.
 */
export const NestedInsideDrawer: Story = {
  render: args => (
    <div className="flex min-h-dvh items-center justify-center">
      <Drawer>
        <BaseDrawer.Trigger
          render={<Button colorLight="primary">Open sidebar</Button>}
        />
        <DrawerContent>
          <DrawerContentInner>
            <div className="flex flex-col items-start gap-4">
              <BaseDrawer.Title render={<Typography variant="heading3" as="h2" />}>
                Documents
              </BaseDrawer.Title>
              <ResponsiveDialog {...args}>
                <ResponsiveDialogTrigger
                  render={(
                    <Button colorLight="secondary">
                      Delete “Meeting notes”
                    </Button>
                  )}
                />
                <ResponsiveDialogContent>
                  <ResponsiveDialogContentInner
                    footerArea={(
                      <div className="flex items-center justify-end gap-2">
                        <ResponsiveDialogClose
                          render={(
                            <Button colorLight="secondary">Cancel</Button>
                          )}
                        />
                        <Button colorLight="danger">Delete</Button>
                      </div>
                    )}
                  >
                    <ResponsiveDialogTitle
                      className="mb-2"
                      render={<Typography variant="heading3" as="h2" />}
                    >
                      Delete document
                    </ResponsiveDialogTitle>
                    <Typography
                      variant="bodySmall"
                      textColorLight="grey-600"
                      textColorDark="grey-400"
                    >
                      “Meeting notes” will be deleted for everyone.
                    </Typography>
                  </ResponsiveDialogContentInner>
                </ResponsiveDialogContent>
              </ResponsiveDialog>
            </div>
          </DrawerContentInner>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
