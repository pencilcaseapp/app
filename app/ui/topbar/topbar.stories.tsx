/* eslint-disable @eslint-react/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Topbar } from './topbar';
import { Toggle } from '../toggle/toggle';
import { Button } from '../button/button';
import { useState } from 'react';
import classNames from 'classnames';
import { useWindowScroll } from 'react-use';

/**
 * Topbar component is a fixed header that contains three
 * sections: left, center and right. The left and right sections
 * are used for actions, while the center section is used for the toolbar.
 * The center section is horizontally scrollable if the content exceeds
 * the available space. The component also calculates the width of the
 * left and right sections to ensure that the center section is always
 * centered and does not overlap with the left and right sections.
 */
const meta: Meta<typeof Topbar> = {
  title: 'Editor/Topbar',
  component: Topbar,
  parameters: {
    layout: 'fullscreen',
  },

};

export default meta;
type Story = StoryObj<typeof Topbar>;

export const BasicExample: Story = {
  render: args => (
    <>
      <Topbar {...args} />
      <div className="h-1000" />
    </>
  ),
  args: {
    left: (<Button colorLight="secondary" icon="sidebar" />),
    center: (
      <>
        {/* TODO: replace it with Toolbar UI + ToggleGroup UI */}
        <div className="flex gap-4 md:gap-2">
          <Toggle isActive icon="h1" className="h-8!" />
          <Toggle isActive={false} icon="h2" className="h-8!" />
          <Toggle isActive={false} icon="h3" className="h-8!" />
        </div>

        <hr className="h-8 w-px self-center border-0 bg-pca-grey-300 dark:bg-pca-grey-700 shrink-0" />

        <div className="flex gap-4 md:gap-2">
          <Toggle isActive={false} icon="bold" className="h-8!" />
          <Toggle isActive={false} icon="italic" className="h-8!" />
          <Toggle isActive={false} icon="underline" className="h-8!" />
        </div>

        <hr className="h-8 w-px self-center border-0 bg-pca-grey-300 dark:bg-pca-grey-700 shrink-0" />

        <div className="flex gap-4 md:gap-2">
          <Toggle isActive={false} icon="listUl" className="h-8!" />
          <Toggle isActive={false} icon="listOl" className="h-8!" />
          <Toggle isActive={false} icon="listCheck" className="h-8!" />
        </div>
      </>
    ),
    right: (
      <Button icon="share" colorLight="primary">
        Share
      </Button>
    ),
  },
};

export const SwapAreasExample: Story = {
  render: () => {
    const [isSwapped, setIsSwapped] = useState(false);
    const { y } = useWindowScroll();
    const isScrolling = y > 65;

    return (
      <>
        <Topbar
          left={
            !isSwapped ? (<Button colorLight="secondary" className="text-pca-grey-400! dark:text-pca-grey-600!" icon="close" />) : (<Button colorLight="secondary" icon="sidebar" />)

          }
          center={
            !isSwapped
              ? (
                  <div className={classNames('flex gap-2 origin-center transition-all ring-pca-grey-200 bg-pca-white/85 dark:bg-pca-grey-900/80 rounded-2xl px-1.5 py-1.5 mx-1',
                    isScrolling && 'lg:shadow-xs lg:ring-1 lg:dark:ring-pca-grey-700 lg:backdrop-blur-md',
                  )}
                  >
                    <div className="flex gap-4 md:gap-2">
                      <Toggle className="h-8!" isActive={true} icon="h1" iconTitle="headline 1" />
                      <Toggle className="h-8!" isActive={false} icon="h2" iconTitle="headline 2" />
                      <Toggle className="h-8!" isActive={false} icon="h3" iconTitle="headline 3" />
                    </div>
                    <div className="flex gap-4 md:gap-2">
                      <Toggle className="h-8!" isActive={false} icon="bold" iconTitle="bold" />
                      <Toggle className="h-8!" isActive={false} icon="italic" iconTitle="italic" />
                      <Toggle className="h-8!" isActive={false} icon="underline" iconTitle="underline" />
                    </div>
                    <div className="flex gap-4 md:gap-2">
                      <Toggle className="h-8!" disabled isActive={false} icon="listUl" iconTitle="unordered list" />
                      <Toggle className="h-8!" disabled isActive={false} icon="listOl" iconTitle="ordered list" />
                      <Toggle className="h-8!" disabled isActive={false} icon="listCheck" iconTitle="checklist" />
                    </div>
                  </div>
                )
              : undefined
          }
          right={isSwapped
            ? (
                <Button icon="share" colorLight="primary">
                  Share
                </Button>
              )
            : undefined}
        />

        <div className="flex items-center justify-center h-75">
          <Button onClick={() => setIsSwapped(!isSwapped)}>Swapsie</Button>
        </div>
        <div className="h-1000" />
      </>
    );
  },
};
