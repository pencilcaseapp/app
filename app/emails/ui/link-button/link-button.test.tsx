import { describe, expect, it } from 'vitest';
import { renderEmail } from '../../testing';
import { LinkButton } from './link-button';

const href = 'https://pencilcase.app/upgrade';

describe('LinkButton', () => {
  it('links to the given url', async () => {
    const html = await renderEmail(
      <LinkButton href={href}>Get PRO</LinkButton>,
    );

    expect(html).toContain(`href="${href}"`);
  });

  it('wears the primary button colors', async () => {
    const html = await renderEmail(
      <LinkButton href={href}>Get PRO</LinkButton>,
    );

    expect(html).toContain('background-color:rgb(16,16,16)');
  });

  it('matches the rendered markup', async () => {
    expect(await renderEmail(
      <LinkButton href={href}>Get PRO</LinkButton>,
    )).toMatchSnapshot();
  });
});
