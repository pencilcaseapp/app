import { describe, expect, it } from 'vitest';
import { renderEmail } from '../../testing';
import { Logo } from './logo';

describe('Logo', () => {
  it('renders the lockup at its designed size', async () => {
    expect(await renderEmail(<Logo />)).toMatchSnapshot();
  });

  it('links the image at an absolute production URL', async () => {
    const html = await renderEmail(<Logo />);

    expect(html).toContain('src="https://pencilcase.app/emails/');
  });
});
