import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import classNames from 'classnames';
import type { FC, PropsWithChildren, ReactNode } from 'react';
import { Button } from '~/ui/button/button';
import { DrawerContent } from '~/ui/drawer/drawer-content';
import { DrawerContentInner } from '~/ui/drawer/drawer-content-inner';
import { DropdownMenuContent } from '~/ui/dropdown-menu/dropdown-menu-content';
import { DropdownMenuPortal } from '~/ui/dropdown-menu/dropdown-menu-portal';
import { Typography } from '~/ui/typography/typography';
import { useIsPanelDrawer } from './responsive-panel';

export type ResponsivePanelContentProps = {
  title: string;
  /** Pinned below the scrollable content in both variants. */
  footerArea?: ReactNode;
  /** Drawer only: the height the footer area reserves. */
  reservedFooterHeight?: number;
  /** Drawer only: the height the sheet may grow to. */
  maxHeight?: string;
  /** Dropdown only. */
  className?: string;
} & PropsWithChildren;

/*
 * The popup of the active `ResponsivePanel` variant, with the title above
 * the scrollable content and the footer pinned below it. Both variants cap
 * their own height — the drawer through `maxHeight`, the dropdown through
 * the height Radix leaves between the trigger and the viewport edge — so
 * only the content in between ever scrolls.
 */
export const ResponsivePanelContent: FC<ResponsivePanelContentProps> = ({
  children,
  title,
  footerArea,
  reservedFooterHeight,
  maxHeight,
  className,
}) => {
  const isDrawer = useIsPanelDrawer();

  if (isDrawer) {
    return (
      <DrawerContent
        maxHeight={maxHeight}
        /*
         * The panel opens from the page chrome, which renders inside the
         * sidebar's drawer root, so Base UI counts this drawer as nested
         * and leaves the backdrop to the drawer behind it. That one is
         * closed whenever the panel can be reached, so there is no
         * backdrop to inherit and this drawer draws its own.
         */
        drawerBackdropProps={{ forceRender: true }}
      >
        <DrawerContentInner
          topArea={<PanelTitle title={title} />}
          footerArea={footerArea}
          reservedFooterHeight={reservedFooterHeight}
        >
          <div className="flex flex-col gap-4">
            {children}
          </div>
        </DrawerContentInner>
      </DrawerContent>
    );
  }

  return (
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        collisionPadding={12}
        className={classNames(
          'max-h-(--radix-dropdown-menu-content-available-height) gap-0 p-3',
          className,
        )}
      >
        <PanelTitle title={title} />
        {/* The negative inset keeps focus rings inside the scroll area
            from being clipped by its own overflow. */}
        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-1">
          {children}
        </div>
        {footerArea && <div className="shrink-0 pt-3">{footerArea}</div>}
      </DropdownMenuContent>
    </DropdownMenuPortal>
  );
};

/*
 * The drawer needs a `Drawer.Title` for its accessible name and a close
 * button, since a sheet has no trigger to click a second time. The
 * dropdown is labelled by its trigger and closes on the next click
 * outside, so it only shows the heading.
 */
const PanelTitle: FC<{ title: string }> = ({ title }) => {
  const isDrawer = useIsPanelDrawer();

  if (!isDrawer) {
    return (
      <Typography
        variant="bodySmall"
        fontWeight="semibold"
        as="h2"
        className="shrink-0 px-1 pb-3"
      >
        {title}
      </Typography>
    );
  }

  return (
    <div className="flex h-12 items-center gap-2">
      <div aria-hidden className="w-8 shrink-0" />
      <BaseDrawer.Title
        render={(
          <Typography
            variant="bodySmall"
            fontWeight="semibold"
            as="h2"
            textAlign="center"
            className="min-w-0 flex-1 truncate"
          />
        )}
      >
        {title}
      </BaseDrawer.Title>
      <BaseDrawer.Close
        render={(
          <Button
            type="button"
            icon="close"
            iconTitle="Close"
            colorLight="transparent"
            className="h-8! w-8! shrink-0 lg:h-8! lg:w-8!"
          />
        )}
      />
    </div>
  );
};
