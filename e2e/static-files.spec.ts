import { expect, test } from './fixtures';

test.describe('static files', () => {
  test('serves the Apple Pay domain association', async ({ request }) => {
    const response = await request.get(
      '/.well-known/apple-developer-merchantid-domain-association',
    );

    expect(response.status()).toBe(200);
  });

  test('answers a file it does not have without rendering a page',
    async ({ request }) => {
      // Apple clients probe the icon variants a page did not declare.
      const response = await request.get('/apple-touch-icon-precomposed.png');

      expect(response.status()).toBe(404);
      expect(await response.text()).toBe('');
    });

  test('still renders the error page for an unknown page',
    async ({ request }) => {
      const response = await request.get('/no-such-page');

      expect(response.status()).toBe(404);
      await expect(response.text()).resolves.toContain('Error 404');
    });
});
