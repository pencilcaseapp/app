import { expect, test } from 'vitest';
import { renderRoute } from '~/utils/testing';

test('GET /home renders link to new doc', async () => {
  const { findByText } = await renderRoute('/home');

  expect(await findByText('New doc')).toBeInTheDocument();
});
