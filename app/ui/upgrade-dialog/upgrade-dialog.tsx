import type { FC, ReactNode } from 'react';
import type { DialogSize } from '../dialog/dialog-content';
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogTrigger,
} from '../responsive-dialog/responsive-dialog';
import type {
  ResponsiveDialogProps,
  ResponsiveDialogTriggerProps,
} from '../responsive-dialog/responsive-dialog';
import {
  ResponsiveDialogContent,
} from '../responsive-dialog/responsive-dialog-content';
import {
  ResponsiveDialogTopbar,
} from '../responsive-dialog/responsive-dialog-topbar';
import { Typography } from '../typography/typography';

export type UpgradeDialogProps = {
  /** The topbar title, which also labels the dialog. */
  title?: string;
  headline: string;
  description?: string;
  /** The pricing area, e.g. a `PlanComparison` or a `PricingTable`. */
  pricingArea: ReactNode;
  /** Rendered as the dialog trigger, e.g. an upgrade `Button`. */
  trigger?: ResponsiveDialogTriggerProps['render'];
  /** Dialog only. */
  size?: DialogSize;
  closeLabel?: string;
} & Omit<ResponsiveDialogProps, 'children'>;

/*
 * The upgrade prompt: a `ResponsiveDialog` with the topbar of the
 * settings dialog, a headline, an optional description and a slot for
 * the pricing content — e.g. a `PlanComparison` of the free and pro
 * plans. Open it through the `trigger` or control it via
 * `open`/`onOpenChange`.
 */
export const UpgradeDialog: FC<UpgradeDialogProps> = ({
  title = 'Upgrade to Pro',
  headline,
  description,
  pricingArea,
  trigger,
  size = 'large',
  closeLabel = 'Close',
  ...rest
}) => {
  return (
    <ResponsiveDialog {...rest}>
      {trigger && <ResponsiveDialogTrigger render={trigger} />}
      <ResponsiveDialogContent
        size={size}
        topArea={(
          <ResponsiveDialogTopbar title={title} closeLabel={closeLabel} />
        )}
      >
        <div className="p-2 sm:p-6">
          <Typography variant="heading2" as="h2" textAlign="center">
            {headline}
          </Typography>
          {description && (
            <ResponsiveDialogDescription
              render={(
                <Typography
                  variant="bodySmall"
                  as="p"
                  textAlign="center"
                  textColorLight="grey-600"
                  textColorDark="grey-400"
                  className="mt-2"
                />
              )}
            >
              {description}
            </ResponsiveDialogDescription>
          )}
          <div className="mt-8">{pricingArea}</div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
