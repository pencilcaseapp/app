import { describe, expect, it } from 'vitest';
import { renderEmail } from '../../testing';
import { OneTimeCode } from './one-time-code';

describe('OneTimeCode', () => {
  it('renders the code on its plate', async () => {
    expect(await renderEmail(<OneTimeCode code="396921" />))
      .toMatchSnapshot();
  });

  it('keeps the digits a single unbroken run', async () => {
    const html = await renderEmail(<OneTimeCode code="396921" />);

    expect(html).toMatch(/>\s*396921\s*</);
  });
});
