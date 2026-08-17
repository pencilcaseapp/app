import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import { Layout } from './layout';

describe('Layout', () => {
  it('renders the shell around its children', async () => {
    const html = await render(
      <Layout preview="Preview text">
        <p>Body</p>
      </Layout>,
      { pretty: true },
    );

    expect(html).toMatchSnapshot();
  });

  it('opts out of the automatic dark mode inversion', async () => {
    const html = await render(
      <Layout preview="Preview text"><p>Body</p></Layout>,
    );

    expect(html).toContain('name="color-scheme" content="light"');
    expect(html).toContain('name="supported-color-schemes" content="light"');
  });
});
