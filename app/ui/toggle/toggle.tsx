import classNames from 'classnames';
import { Button, type ButtonProps } from '../button/button';

export interface ToggleProps extends ButtonProps<'button'> {
  isActive: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  isActive,
  ...props
}) => {
  const buttonClasses = classNames(
    { 'bg-pca-grey-900! text-pca-white! dark:text-pca-grey-900! dark:bg-pca-white!': isActive },
    props.className,
  );

  return (
    <Button color="secondary" className={buttonClasses} aria-pressed={isActive} {...props} />
  );
};
