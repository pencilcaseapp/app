import classNames from 'classnames';
import { Button, type ButtonProps } from '../button/button';

export interface ToggleProps extends ButtonProps {
  isActive: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  isActive,
  ...props
}) => {
  const buttonClasses = classNames({
    '!bg-gray-200 dark:!bg-gray-600': isActive,
  });

  return (
    <Button className={buttonClasses} aria-pressed={isActive} {...props} />
  );
};
