import classNames from 'classnames';
import { Separator } from '../separator/separator';
import { useDropdownMenuVariant } from './dropdown-menu-variant-context';

export const DropdownMenuSeparator: React.FC = () => {
  const variant = useDropdownMenuVariant();

  return (
    <Separator
      className={classNames(
        'my-1',
        variant === 'solid'
        && 'bg-pca-grey-200! dark:bg-pca-grey-700!',
      )}
    />
  );
};
