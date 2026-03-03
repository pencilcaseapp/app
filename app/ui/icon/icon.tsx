import classNames from 'classnames';
import type { IconName } from './icons';
import { icons } from './icons';
import { useId, type SVGAttributes } from 'react';

export type IconProps = {
  icon: IconName;
  className?: string;
  title?: string;
} & SVGAttributes<SVGElement>
;

export const Icon: React.FC<IconProps> = ({
  icon,
  className,
  title,
  ...rest
}) => {
  const titleId = useId();

  return (
    <svg
      className={classNames(className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="transparent"
      focusable="false"
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={!title}
      {...rest}
    >
      {title && <title id={titleId}>{title}</title>}
      {icons[icon]}
    </svg>
  );
};
