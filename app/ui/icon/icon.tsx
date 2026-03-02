import classNames from 'classnames';
import type { IconName } from './icons';
import { icons } from './icons';
import type { SVGAttributes, PropsWithChildren } from 'react';

export type IconProps = {
  icon: IconName;
  className?: string;
} & SVGAttributes<SVGElement>
& PropsWithChildren;

export const Icon: React.FC<IconProps> = ({
  icon,
  children,
  className,
  ...rest
}) => {
  return (
    <svg
      className={classNames(className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="transparent"
      focusable="false"
      {...rest}
    >
      {children}
      {icons[icon]}
    </svg>
  );
};
