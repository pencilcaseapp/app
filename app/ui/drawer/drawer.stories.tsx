/* eslint-disable @eslint-react/rules-of-hooks */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { Drawer } from './drawer';
import { DrawerContent } from './drawer-content';
import { DrawerContentInner } from './drawer-content-inner';
import { Button } from '../button/button';
import { Typography } from '../typography/typography';

/**
 * The `Drawer` is a thin wrapper around Base UI's `Drawer.Root` and is
 * composed together with `DrawerContent` (which renders the portal,
 * backdrop, viewport and popup) and `DrawerContentInner` (the content
 * structure inside the popup). The trigger, close, title and
 * description parts are used directly from `@base-ui/react/drawer`.
 *
 * By default the drawer slides up from the bottom of the viewport and
 * can be dismissed by swiping, clicking the backdrop or pressing
 * `Escape`.
 */
const meta: Meta<typeof Drawer> = {
  title: 'Overlay/Drawer',
  component: Drawer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    modal: {
      control: 'boolean',
      description: 'Whether the drawer traps focus and locks page scroll.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

/**
 * A basic bottom sheet with a trigger, a title, a description and a
 * close button. This is the recommended composition for most use cases.
 */
export const Default: Story = {
  render: args => (
    <div className="flex min-h-dvh items-center justify-center">
      <Drawer {...args}>
        <BaseDrawer.Trigger
          render={<Button colorLight="primary">Open drawer</Button>}
        />
        <DrawerContent>
          <DrawerContentInner>
            <BaseDrawer.Title
              render={<Typography variant="heading2" as="h2" />}
            >
              Delete document
            </BaseDrawer.Title>
            <BaseDrawer.Description
              render={(
                <Typography
                  variant="bodySmall"
                  as="p"
                  className="text-pca-grey-600 dark:text-pca-grey-400"
                />
              )}
            >
              This action cannot be undone.
            </BaseDrawer.Description>
          </DrawerContentInner>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};

/**
 * A fully controlled drawer. The open state is owned by the parent via
 * the `open` / `onOpenChange` props, which is useful when the drawer is
 * opened programmatically (for example after a mutation completes).
 */
export const Controlled: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Button colorLight="primary" onClick={() => setOpen(true)}>
          Open drawer
        </Button>
        <Drawer {...args} open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerContentInner>
              <BaseDrawer.Title
                render={<Typography variant="heading2" as="h2" />}
              >
                Settings
              </BaseDrawer.Title>
              <BaseDrawer.Description
                render={(
                  <Typography
                    variant="bodySmall"
                    as="p"
                    className="text-pca-grey-600 dark:text-pca-grey-400"
                  />
                )}
              >
                This drawer is fully controlled by the parent component.
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                sed diam nonumy eirmod tempor invidunt ut labore et dolore
                magna aliquyam erat, sed diam voluptua. At vero eos et
                accusam
              </BaseDrawer.Description>
              <BaseDrawer.Close render={<Button colorLight="primary">Close</Button>} />
            </DrawerContentInner>
          </DrawerContent>
        </Drawer>
      </div>
    );
  },
};

export const WithTopAndFooterAreas: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Button colorLight="primary" onClick={() => setOpen(true)}>
          Open drawer
        </Button>
        <Drawer {...args} open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerContentInner
              topArea={(
                <div className="flex justify-center items-center h-12">
                  <Typography variant="bodySmall" fontWeight="semibold" as="h2" className="">
                    Top area content
                  </Typography>
                </div>
              )}
              footerArea={(
                <div className="flex justify-between items-center">
                  <BaseDrawer.Close render={<Button colorLight="secondary" className="mr-2">Cancel</Button>} />
                  <Button>Save</Button>
                </div>
              )}
            >
              <div className="h-200 bg-ws-grey-100">
                Content area
              </div>
            </DrawerContentInner>
          </DrawerContent>
        </Drawer>
      </div>
    );
  },
};

export const FullHeight: Story = {
  render: args => (
    <div className="flex min-h-dvh items-center justify-center">
      <Drawer {...args}>
        <BaseDrawer.Trigger
          render={<Button colorLight="primary">Open drawer</Button>}
        />
        <DrawerContent isFullHeight>
          <DrawerContentInner>
            <BaseDrawer.Title
              render={<Typography variant="heading2" as="h2" />}
            >
              Delete document
            </BaseDrawer.Title>
            <BaseDrawer.Description
              render={(
                <Typography
                  variant="bodySmall"
                  as="p"
                  className="text-pca-grey-600 dark:text-pca-grey-400"
                />
              )}
            >
              This action cannot be undone.
            </BaseDrawer.Description>
          </DrawerContentInner>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
