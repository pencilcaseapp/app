import classNames from 'classnames';
import type { FC } from 'react';
import type { DocumentLinkAccess } from '~/constants/document';
import { Icon } from '~/ui/icon/icon';
import { Select } from '~/ui/select/select';
import { Switch } from '~/ui/switch/switch';
import { Typography } from '~/ui/typography/typography';

const SWITCH_ID = 'document-sharing';

const LINK_ACCESS_ITEMS: { value: DocumentLinkAccess; label: string }[] = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];

export interface ShareLinkAccessProps {
  isShared: boolean;
  onSharedChange: (shared: boolean) => void;
  linkAccess: DocumentLinkAccess;
  onLinkAccessChange: (linkAccess: DocumentLinkAccess) => void;
  /** Somebody besides the owner can open the document while it is private. */
  hasInvitedPeople?: boolean;
}

/*
 * The switch that decides whether the link lets anyone in, with the globe
 * or the lock telling the state at a glance, and below it the chooser for
 * what the link allows once it is on.
 */
export const ShareLinkAccess: FC<ShareLinkAccessProps> = ({
  isShared,
  onSharedChange,
  linkAccess,
  onLinkAccessChange,
  hasInvitedPeople,
}) => {
  const privateHint = hasInvitedPeople
    ? 'Right now only invited people can open it'
    : 'Right now only you can open it';

  return (
    <div>
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
            {isShared ? 'No sign-in needed to open it' : privateHint}
          </Typography>
        </label>

        <Switch
          id={SWITCH_ID}
          aria-label="Anyone with the link"
          checked={isShared}
          onCheckedChange={onSharedChange}
        />
      </div>

      {isShared && (
        <div className="flex items-center gap-3 pt-3">
          {/* Lines the copy up with the row above, which the glyph indents. */}
          <span className="size-9 shrink-0" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Typography variant="bodySmall" fontWeight="medium" as="span">
              Link access
            </Typography>
            <Typography
              variant="bodyTiny"
              as="span"
              textColorLight="grey-600"
              textColorDark="grey-400"
            >
              What anyone with the link can do
            </Typography>
          </div>
          <Select
            aria-label="Link access"
            items={LINK_ACCESS_ITEMS}
            value={linkAccess}
            onValueChange={onLinkAccessChange}
            variant="solid"
            /*
             * Pulls the trigger's own padding out so the chevron lines up
             * with the switch above. The panel's scroll area insets its
             * content by the same 4px to keep focus rings out of the
             * overflow, and taking more than that back scrolls the panel
             * sideways.
             */
            className="-mr-1"
          />
        </div>
      )}
    </div>
  );
};
