import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from '@react-email/components';
import type React from 'react';
import { colors, contentWidth, fontFamily } from '../../theme';
import { EmailLogo } from '../email-logo/email-logo';

type EmailLayoutProps = {
  /** The one line mail clients show next to the subject in the inbox list. */
  preview: string;
  children: React.ReactNode;
};

/**
 * The shell every email shares: the logo, the centred content column, and the
 * light palette. The two `color-scheme` metas opt out of the automatic
 * inversion iOS and Apple Mail apply otherwise, which would recolour the design
 * to something nobody signed off on.
 */
export const EmailLayout: React.FC<EmailLayoutProps> = ({
  preview,
  children,
}) => {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={logoStyle}>
            <EmailLogo />
          </Section>
          {children}
        </Container>
      </Body>
    </Html>
  );
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: '24px 18px',
  backgroundColor: colors.white,
  color: colors.grey900,
  fontFamily,
};

const containerStyle: React.CSSProperties = {
  margin: '0 auto',
  // The designs reserve 86px below the content on every email.
  padding: '0 0 86px',
  width: '100%',
  maxWidth: contentWidth,
};

const logoStyle: React.CSSProperties = {
  padding: '32px',
  textAlign: 'center',
};
