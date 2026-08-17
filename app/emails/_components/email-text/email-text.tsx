import { Text } from 'react-email';
import type React from 'react';
import { colors, fontFamily, text } from '../../theme';

type EmailTextProps = {
  children: React.ReactNode;
  /** Renders the semibold variant, used for labels above a value. */
  emphasis?: boolean;
  style?: React.CSSProperties;
};

export const EmailText: React.FC<EmailTextProps> = ({
  children,
  emphasis = false,
  style,
}) => {
  return (
    <Text
      style={{
        ...textStyle,
        ...(emphasis ? text.bodySmallSemibold : text.bodySmall),
        ...style,
      }}
    >
      {children}
    </Text>
  );
};

const textStyle: React.CSSProperties = {
  margin: '0 0 12px',
  color: colors.grey900,
  fontFamily,
  textAlign: 'center',
};
