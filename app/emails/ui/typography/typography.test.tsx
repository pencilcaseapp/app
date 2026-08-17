import { describe, expect, it } from 'vitest';
import { renderEmail } from '../../testing';
import { Typography } from './typography';

describe('Typography', () => {
  describe('variant to HTML element mapping', () => {
    it.for([
      ['title', 'h1'],
      ['heading1', 'h1'],
      ['heading2', 'h2'],
      ['heading3', 'h3'],
      ['body', 'p'],
      ['bodySmall', 'p'],
      ['bodyTiny', 'p'],
    ] as const)('renders %s as %s', async ([variant, element]) => {
      const html = await renderEmail(
        <Typography variant={variant}>Text</Typography>,
      );

      expect(html).toContain(`<${element}`);
    });

    it('defaults to body (p) when no variant is provided', async () => {
      const html = await renderEmail(<Typography>Text</Typography>);

      expect(html).toContain('<p');
    });

    it('overrides the default variant element', async () => {
      const html = await renderEmail(
        <Typography variant="heading2" as="h1">Text</Typography>,
      );

      expect(html).toContain('<h1');
    });
  });

  describe('inlined styles', () => {
    it.for([
      'title',
      'heading1',
      'heading2',
      'heading3',
      'body',
      'bodySmall',
      'bodyTiny',
    ] as const)('inlines the %s variant', async (variant) => {
      expect(
        await renderEmail(<Typography variant={variant}>Text</Typography>),
      ).toMatchSnapshot();
    });

    it('inlines an overridden weight, colour and alignment', async () => {
      expect(
        await renderEmail(
          <Typography
            variant="bodySmall"
            fontWeight="semibold"
            textColor="grey-500"
            textAlign="center"
          >
            Text
          </Typography>,
        ),
      ).toMatchSnapshot();
    });

    it('inlines the base colours without the pca prefix', async () => {
      expect(
        await renderEmail(<Typography textColor="white">Text</Typography>),
      ).toMatchSnapshot();
    });
  });
});
