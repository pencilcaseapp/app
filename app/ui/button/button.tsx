import classNames from 'classnames';

export interface ButtonProps extends React.PropsWithChildren {
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, className }) => {
  const classes = classNames('bg-blue-500', 'text-white px-4 py-2', className);

  return <button className={classes}>{children}</button>;
};
