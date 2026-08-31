import type { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { Button } from '../button/button';
import { Typography } from '../typography/typography';
import {
  ResponsiveDialogClose,
  ResponsiveDialogTitle,
  useIsDrawer,
} from './responsive-dialog';

export type ResponsiveDialogTopbarProps = {
  title: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  closeLabel?: string;
  className?: string;
};

const iconButtonClasses = 'w-8! h-8! lg:w-8! lg:h-8! shrink-0';

/*
 * The responsive sibling of `DialogTopbar`: the same back/title/close row
 * built on the responsive title and close parts, so it follows the active
 * variant of a `ResponsiveDialog`. Without `onBack` a spacer fills the
 * back slot and keeps the title optically centred.
 */
export const ResponsiveDialogTopbar: FC<ResponsiveDialogTopbarProps> = ({
  title,
  onBack,
  backLabel = 'Back',
  closeLabel = 'Close',
  className,
}) => {
  // The drawer content already pads its top area horizontally, so only
  // the dialog brings its own inset.
  const isDrawer = useIsDrawer();

  return (
    <div
      className={classNames(
        'flex items-center gap-2',
        isDrawer ? 'pb-4' : 'p-4',
        className,
      )}
    >
      {onBack
        ? (
            <Button
              type="button"
              icon="chevronLeft"
              iconTitle={backLabel}
              colorLight="secondary"
              onClick={onBack}
              className={iconButtonClasses}
            />
          )
        : (
            <div aria-hidden className={iconButtonClasses} />
          )}

      <ResponsiveDialogTitle
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
      </ResponsiveDialogTitle>

      <ResponsiveDialogClose
        render={(
          <Button
            type="button"
            icon="close"
            iconTitle={closeLabel}
            colorLight="secondary"
            className={iconButtonClasses}
          />
        )}
      />
    </div>
  );
};
