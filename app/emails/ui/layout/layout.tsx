import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  pixelBasedPreset,
} from 'react-email';
import { theme } from '../../theme';
import { Logo } from '../logo/logo';

type LayoutProps = {
  preview: string;
  children: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({ preview, children }) => {
  return (
    <Tailwind theme={theme} config={pixelBasedPreset}>
      <Html lang="en">
        <Head>
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
        </Head>
        <Preview>{preview}</Preview>
        <Body className="bg-pca-white font-inter m-0 py-6 px-[18px]">
          <Container className="w-full max-w-[296px] mx-auto pb-[86px]">
            <Section className="p-8 text-center">
              <Logo />
            </Section>
            {children}
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};
