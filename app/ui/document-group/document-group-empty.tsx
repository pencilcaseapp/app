import type { FC, PropsWithChildren } from 'react';
import type { IconName } from '../icon/icons';
import { Icon } from '../icon/icon';
import { Typography } from '../typography/typography';

export type DocumentGroupEmptyProps = {
  icon?: IconName;
  actionArea?: React.ReactNode;
} & PropsWithChildren;

export const DocumentGroupEmpty: FC<DocumentGroupEmptyProps>
  = ({ icon, actionArea, children }) => (
    <div className="flex flex-col items-center gap-2 px-3 py-4 text-center">
      {icon && (
        <Icon
          icon={icon}
          className="text-pca-grey-400 dark:text-pca-grey-700 w-7 h-7"
        />
      )}
      <Typography
        variant="bodySmall"
        fontWeight="semibold"
        as="span"
        textColorLight="grey-400"
        textColorDark="grey-700"
      >
        {children}
      </Typography>
      {actionArea && <div className="mt-2">{actionArea}</div>}
    </div>
  );
