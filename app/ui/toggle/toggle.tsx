import classNames from 'classnames';
import { Button, type ButtonProps } from '../button/button';

export type ToggleProps = {
  isActive: boolean;
  className?: string;
} & ButtonProps<'button'>;

export const Toggle: React.FC<ToggleProps> = ({
  isActive,
  className,
  ...props
}) => {
  const buttonClasses = classNames(
    { 'bg-pca-grey-900! text-pca-white! dark:text-pca-grey-900! dark:bg-pca-white!': isActive },
    className,
  );

  return (
    <Button colorLight="secondary" className={buttonClasses} aria-pressed={isActive} {...props} />
  );
};
