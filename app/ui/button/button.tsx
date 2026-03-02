import classNames from 'classnames';

export interface ButtonProps extends React.PropsWithChildren {
  className?: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  onClick,
}) => {
  const classes = classNames('bg-transparent border border-gray-400 px-2 py rounded', className);

  return <button className={classes} onClick={onClick}>{children}</button>;
};
