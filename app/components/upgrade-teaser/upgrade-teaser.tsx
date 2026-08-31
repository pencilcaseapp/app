import classNames from 'classnames';
import { Form, href, useNavigation } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { Button } from '~/ui/button/button';
import { PricingTable } from '~/ui/pricing-table/pricing-table';
import { Typography } from '~/ui/typography/typography';

export const PRO_FEATURES = [
  'Unlimited docs',
  'Access control for collaboration',
  'Hosted in the EU',
  'Support small tech',
  'Support development',
];

export interface UpgradeTeaserProps {
  headline: React.ReactNode;
  description: React.ReactNode;
  className?: string;
}

export const UpgradeTeaser: React.FC<UpgradeTeaserProps> = ({
  headline,
  description,
  className,
}) => {
  const navigation = useNavigation();

  return (
    <div className={classNames('flex w-full flex-col', className)}>
      <Typography
        variant="heading2"
        textAlign="center"
        textColorLight="black"
        textColorDark="white"
      >
        {headline}
      </Typography>
      <Typography
        variant="bodySmall"
        textAlign="center"
        textColorLight="grey-900"
        textColorDark="grey-100"
        className="mt-3"
      >
        {description}
      </Typography>
      <PricingTable
        plan="pencil case pro"
        amount="25 €"
        period="/ year"
        features={PRO_FEATURES}
        className="mt-6"
        actionArea={(
          <Form method="post" action={href('/upgrade')}>
            <AuthenticityTokenInput />
            <Button
              type="submit"
              colorLight="primary"
              isLoading={navigation.state !== 'idle'}
              className="w-full"
            >
              Upgrade to Pro
            </Button>
          </Form>
        )}
        finePrint="Secure checkout by Creem."
      />
    </div>
  );
};
