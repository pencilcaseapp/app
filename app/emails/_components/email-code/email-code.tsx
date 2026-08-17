import { Section, Text } from '@react-email/components';
import type React from 'react';
import { colors, fontFamily, text } from '../../theme';

type EmailCodeProps = {
  code: string;
};

/**
 * The one-time code, on the grey plate the designs put it on.
 *
 * iOS only offers a code to the keyboard when it finds an unbroken run of
 * digits, so the code has to stay a single text node: no per-digit spans, no
 * spaces or dashes between the digits, and no link around it. Space the digits
 * out with `letter-spacing` if that is ever wanted, never with characters.
 */
export const EmailCode: React.FC<EmailCodeProps> = ({ code }) => {
  return (
    <Section style={plateStyle}>
      <Text style={codeStyle}>{code}</Text>
    </Section>
  );
};

const plateStyle: React.CSSProperties = {
  margin: '0 0 12px',
  padding: '8px 0',
  backgroundColor: colors.grey100,
};

const codeStyle: React.CSSProperties = {
  ...text.heading3,
  margin: 0,
  color: colors.grey900,
  fontFamily,
  textAlign: 'center',
};
