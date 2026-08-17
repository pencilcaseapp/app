/**
 * Email design tokens.
 *
 * Mail clients strip `<style>` blocks and class names, so everything an email
 * renders has to end up in a `style` attribute. That rules out the Tailwind
 * `pca-*` tokens from `app/app.css`, and the values below mirror them by hand —
 * keep the two in sync.
 */

export const colors = {
  white: '#FFFFFF',
  grey100: '#F8F8F8',
  grey900: '#101010',
} as const;

/**
 * Inter is not installed on the recipient's machine, so the stack falls
 * straight through to the system UI font that mail clients render best.
 */
export const fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, '
  + '"Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const text = {
  heading2: {
    fontSize: '24px',
    lineHeight: '29px',
    fontWeight: 700,
  },
  heading3: {
    fontSize: '18px',
    lineHeight: '22px',
    fontWeight: 700,
  },
  bodySmall: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 400,
  },
  bodySmallSemibold: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 600,
  },
} as const;

/** The content column the designs lay every email out on. */
export const contentWidth = '296px';

/**
 * Images in an email are fetched by the recipient's mail client, so they always
 * have to point at production — a localhost URL would never resolve, not even
 * for an email triggered locally.
 */
export const assetsUrl = 'https://pencilcase.app';
