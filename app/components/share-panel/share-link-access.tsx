import classNames from 'classnames';
import type { FC } from 'react';
import { Icon } from '~/ui/icon/icon';
import { Switch } from '~/ui/switch/switch';
import { Typography } from '~/ui/typography/typography';

const SWITCH_ID = 'document-sharing';

export interface ShareLinkAccessProps {
  isShared: boolean;
  onSharedChange: (shared: boolean) => void;
}

/*
 * The switch that decides whether the link lets anyone in, with the globe
 * or the lock telling the state at a glance.
 */
export const ShareLinkAccess: FC<ShareLinkAccessProps> = ({
  isShared,
  onSharedChange,
}) => {
  return (
    <div className="flex items-center gap-3">
      <span
        className={classNames(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          'transition-colors duration-150 motion-reduce:transition-none',
          isShared
            ? 'bg-pca-green-100 text-pca-green-900'
            : 'bg-pca-grey-200 text-pca-grey-700 dark:bg-pca-grey-800 dark:text-pca-grey-300',
        )}
      >
        <Icon icon={isShared ? 'globe' : 'lock'} className="size-5" />
      </span>

      {/*
        * The switch is named by `aria-label`, because the element
        * `htmlFor` targets is the hidden input rather than the
        * `role="switch"` element. The label is still what makes the copy
        * toggle the switch.
        */}
      <label
        htmlFor={SWITCH_ID}
        className="flex min-w-0 flex-1 cursor-pointer flex-col"
      >
        <Typography variant="bodySmall" fontWeight="medium" as="span">
          Anyone with the link
        </Typography>
        <Typography
          variant="bodyTiny"
          as="span"
          textColorLight="grey-600"
          textColorDark="grey-400"
        >
          {isShared
            ? 'No sign-in needed to open it'
            : 'Right now only you can open it'}
        </Typography>
      </label>

      <Switch
        id={SWITCH_ID}
        aria-label="Anyone with the link"
        checked={isShared}
        onCheckedChange={onSharedChange}
      />
    </div>
  );
};
