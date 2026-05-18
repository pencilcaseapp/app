import * as RadixTooltip from '@radix-ui/react-tooltip';
import { type FC } from 'react';
import { Typography } from '../typography/typography';
import classNames from 'classnames';

export interface TooltipProps {
  children: React.ReactNode;
  tooltip: React.ReactNode;
  align?: RadixTooltip.TooltipContentProps['align'];
  side?: RadixTooltip.TooltipContentProps['side'];
}

export const Tooltip: FC<TooltipProps> = ({
  children,
  tooltip,
  side = 'bottom',
  align = 'center',
}) => {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={4}
            collisionPadding={16}
            className={classNames([
              'rounded-lg flex max-w-(--radix-tooltip-content-available-width) sm:max-w-sm bg-pca-grey-800 text-pca-white p-2 shadow-primary will-change-transform outline-hidden z-60',
              'data-[state=closed]:data-[side=top]:animate-slideUpAndFadeOut data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFadeIn',
              'data-[state=closed]:data-[side=bottom]:animate-slideDownAndFadeOut data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFadeIn',
              'data-[state=closed]:data-[side=right]:animate-slideLeftAndFadeOut data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFadeIn',
              'data-[state=closed]:data-[side=left]:animate-slideRightAndFadeOut data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFadeIn',
            ])}
          >
            <Typography variant="bodyTiny" className="text-pca-white!" as="span">
              {tooltip}
            </Typography>
            <RadixTooltip.Arrow className="fill-pca-grey-800 -my-px" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};
