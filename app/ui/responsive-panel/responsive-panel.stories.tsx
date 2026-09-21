import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResponsivePanel, ResponsivePanelTrigger } from './responsive-panel';
import { ResponsivePanelContent } from './responsive-panel-content';
import { Button } from '../button/button';
import { Switch } from '../switch/switch';
import { Typography } from '../typography/typography';

/**
 * `ResponsivePanel` hangs a panel off its trigger: the bottom sheet drawer
 * below Tailwind's `sm` breakpoint and a dropdown menu anchored to the
 * trigger on every larger viewport — resize the preview across 640px to
 * switch between the two. Both variants keep the title above and the
 * footer below the content, so only the content in between scrolls once
 * the panel runs out of height.
 */
const meta: Meta<typeof ResponsivePanel> = {
  title: 'Overlay/ResponsivePanel',
  component: ResponsivePanel,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ResponsivePanel>;

const panelWidth = 'w-95 max-w-[calc(100vw-1.5rem)]';

/**
 * A trigger, a title and a footer pinned below the content.
 */
export const Default: Story = {
  render: args => (
    <div className="flex min-h-dvh justify-end p-3">
      <ResponsivePanel {...args}>
        <ResponsivePanelTrigger>
          <Button type="button" icon="share" colorLight="glass">Share</Button>
        </ResponsivePanelTrigger>
        <ResponsivePanelContent
          title="Share document"
          className={panelWidth}
          maxHeight="calc(100dvh - 56px)"
          reservedFooterHeight={64}
          footerArea={(
            <Button type="button" icon="link" className="w-full">
              Copy link
            </Button>
          )}
        >
          <div className="flex items-center gap-3">
            <Typography variant="bodySmall" as="span" className="flex-1">
              Anyone with the link
            </Typography>
            <Switch id="story-sharing" aria-label="Anyone with the link" />
          </div>
        </ResponsivePanelContent>
      </ResponsivePanel>
    </div>
  ),
};

/**
 * With more content than the panel can show, the area between the title
 * and the footer scrolls while both stay put.
 */
export const Scrolling: Story = {
  render: args => (
    <div className="flex min-h-dvh justify-end p-3">
      <ResponsivePanel {...args}>
        <ResponsivePanelTrigger>
          <Button type="button" icon="share" colorLight="glass">Share</Button>
        </ResponsivePanelTrigger>
        <ResponsivePanelContent
          title="Share document"
          className={panelWidth}
          maxHeight="calc(100dvh - 56px)"
          reservedFooterHeight={64}
          footerArea={(
            <Button type="button" icon="link" className="w-full">
              Copy link
            </Button>
          )}
        >
          {Array.from({ length: 20 }, (_, index) => (
            <Typography key={index} variant="bodySmall" as="p">
              {`Row ${index + 1}`}
            </Typography>
          ))}
        </ResponsivePanelContent>
      </ResponsivePanel>
    </div>
  ),
};
