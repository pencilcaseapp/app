import { Heading } from 'react-email';
import type React from 'react';
import { colors, fontFamily, text } from '../../theme';

type EmailHeadingProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export const EmailHeading: React.FC<EmailHeadingProps> = ({
  children,
  style,
}) => {
  return (
    <Heading as="h1" style={{ ...headingStyle, ...style }}>
      {children}
    </Heading>
  );
};

const headingStyle: React.CSSProperties = {
  ...text.heading2,
  margin: '0 0 12px',
  color: colors.grey900,
  fontFamily,
  textAlign: 'center',
};
