import type { PropsWithChildren } from 'react';
import classNames from 'classnames';
import { Button } from '../button/button';

export interface ToggleProps extends PropsWithChildren {
  isActive: boolean;
  onClick?: () => void;
}

export const Toggle: React.FC<ToggleProps> = ({
  isActive,
  onClick,
  children,
}) => {
  const buttonClasses = classNames({
    '!bg-gray-200': isActive,
  });

  return (
    <Button className={buttonClasses} onClick={onClick}>
      {children}
    </Button>
  );
};
