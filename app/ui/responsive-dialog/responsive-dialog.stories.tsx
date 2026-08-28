import type { Meta, StoryObj } from '@storybook/react-vite';
import { Drawer } from '@base-ui/react/drawer';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from './responsive-dialog';
import { ResponsiveDialogContent } from './responsive-dialog-content';
import { Sheet } from '../drawer/drawer';
import { DrawerContent } from '../drawer/drawer-content';
import { Button } from '../button/button';
import { Typography } from '../typography/typography';

/**
 * `ResponsiveDialog` renders the bottom sheet drawer below Tailwind's `sm`
 * breakpoint and the centered dialog on every larger viewport — resize the
 * preview across 640px to switch between the two. Compose it with
 * `ResponsiveDialogContent` and the `ResponsiveDialogTrigger`, `Close`,
 * `Title` and `Description` parts, which all follow the active variant.
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
        <ResponsiveDialogContent
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
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  ),
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
      <Sheet>
        <Drawer.Trigger
          render={<Button colorLight="primary">Open sidebar</Button>}
        />
        <DrawerContent>
          <div className="flex flex-col items-start gap-4">
            <Drawer.Title render={<Typography variant="heading3" as="h2" />}>
              Documents
            </Drawer.Title>
            <ResponsiveDialog {...args}>
              <ResponsiveDialogTrigger
                render={(
                  <Button colorLight="secondary">
                    Delete “Meeting notes”
                  </Button>
                )}
              />
              <ResponsiveDialogContent
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
                  “Meeting notes” will be deleted for everyone.
                </Typography>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
          </div>
        </DrawerContent>
      </Sheet>
    </div>
  ),
};
