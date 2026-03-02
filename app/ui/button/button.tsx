import classNames from 'classnames';
import type { ComponentProps } from 'react';

export type ButtonProps = ComponentProps<'button'>;

export const Button: React.FC<ButtonProps> = ({
  className,
  ...props
}) => {
  const classes = classNames('bg-transparent border border-gray-400 px-2 py rounded', className);

  return (
    <button className={classes} {...props} />
  );
};
