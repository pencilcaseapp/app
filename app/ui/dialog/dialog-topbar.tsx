import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { Button } from '../button/button';
import { Typography } from '../typography/typography';

export type DialogTopbarProps = {
  title: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  closeLabel?: string;
  hasBorder?: boolean;
  className?: string;
};

const iconButtonClasses = 'w-8! h-8! lg:w-8! lg:h-8! shrink-0';

export const DialogTopbar: FC<DialogTopbarProps> = ({
  title,
  onBack,
  backLabel = 'Back',
  closeLabel = 'Close',
  hasBorder = false,
  className,
}) => {
  return (
    <div
      className={classNames(
        'flex items-center gap-2 p-4',
        hasBorder && 'border-b border-pca-grey-200 dark:border-pca-grey-800',
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

      <BaseDialog.Title
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
      </BaseDialog.Title>

      <BaseDialog.Close
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
