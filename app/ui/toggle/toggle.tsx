import type { PropsWithChildren } from 'react';
import classNames from 'classnames';

export interface ToggleProps extends PropsWithChildren {
  isActive: boolean;
  onClick?: () => void;
}

export const Toggle: React.FC<ToggleProps> = ({
  isActive,
  onClick,
  children,
}) => {
  const buttonClasses = classNames('py px-2 border border-gray-400 rounded-xs', {
    'bg-gray-200': isActive,
  });

  return (
    <button className={buttonClasses} onClick={onClick}>
      {children}
    </button>
  );
};
