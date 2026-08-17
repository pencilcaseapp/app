import { Section } from 'react-email';
import { Typography } from '../typography/typography';

type OneTimeCodeProps = {
  code: string;
};

export const OneTimeCode: React.FC<OneTimeCodeProps> = ({ code }) => {
  return (
    <Section className="bg-pca-grey-100 py-2 mb-3">
      <Typography variant="heading3" fontWeight="bold" textAlign="center">
        {code}
      </Typography>
    </Section>
  );
};
