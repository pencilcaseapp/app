import classNames from 'classnames';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';
import type { TypographyProps } from '../typography/typography';
import { Typography } from '../typography/typography';

export interface ListItemProps {
  children: React.ReactNode;
  icon?: IconName;
  /** `small` is the compact list, `medium` the full size icon. */
  iconSize?: 'small' | 'medium';
  iconColorLight?: TypographyProps['textColorLight'];
  iconColorDark?: TypographyProps['textColorDark'];
  textColorLight?: TypographyProps['textColorLight'];
  textColorDark?: TypographyProps['textColorDark'];
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  icon = 'check',
  iconSize = 'small',
  iconColorLight = 'grey-900',
  iconColorDark = 'white',
  textColorLight = 'grey-900',
  textColorDark = 'white',
  className,
}) => {
  return (
    <li
      className={classNames([
        'flex items-center',
        iconSize === 'small' ? 'gap-2.5' : 'gap-3',
        className,
      ])}
    >
      <Typography
        as="span"
        textColorLight={iconColorLight}
        textColorDark={iconColorDark}
        className="flex shrink-0"
      >
        <Icon
          icon={icon}
          className={iconSize === 'small' ? 'h-4.5 w-4.5' : 'h-6 w-6'}
        />
      </Typography>
      <Typography
        as="span"
        variant="bodySmall"
        fontWeight="medium"
        textColorLight={textColorLight}
        textColorDark={textColorDark}
      >
        {children}
      </Typography>
    </li>
  );
};
