import { Separator as RadixSeparator } from '@radix-ui/react-separator';
import type { SeparatorProps as RadixSeparatorProps } from '@radix-ui/react-separator';
import classNames from 'classnames';

export type SeparatorProps = {
  className?: string;
} & RadixSeparatorProps;

export const Separator: React.FC<SeparatorProps> = ({
  className,
  orientation = 'horizontal',
  decorative = false,
  ...props
}) => {
  return (
    <RadixSeparator
      orientation={orientation}
      decorative={decorative}
      className={classNames(
        'bg-pca-grey-300/30 dark:bg-pca-grey-700/30 shrink-0',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className,
      )}
      {...props}
    />
  );
};
