import classNames from 'classnames';
import { Button, Section } from 'react-email';

export interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * The email twin of the web app's primary button. Rendered through
 * react-email's Button so the padding survives the email clients.
 */
export const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  children,
  className,
}) => {
  return (
    <Section className={classNames('text-center', className)}>
      <Button
        href={href}
        className={classNames([
          'bg-pca-grey-900 text-pca-white',
          'font-inter text-body-small font-medium',
          'rounded-xl px-3 py-2 no-underline',
        ])}
      >
        {children}
      </Button>
    </Section>
  );
};
