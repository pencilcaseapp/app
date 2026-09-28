// @vitest-environment node

import { expect, it } from 'vitest';
import { signBunnyUrl } from './bunny-token';

// Expected URLs come from Bunny's reference implementation
// (BunnyWay/BunnyCDN.TokenAuthentication, nodejs/token.js).
it('signs the path and the expiry like Bunny does', () => {
  expect(signBunnyUrl(
    new URL('https://token-tester.b-cdn.net/300kb.jpg'),
    'SecurityKey',
    1598024587,
  )).toBe(
    'https://token-tester.b-cdn.net/300kb.jpg'
    + '?token=HS256-o10JRWlsAItyAsdKS6jJKjabHN4FrFsplDHPV1idcX4'
    + '&expires=1598024587',
  );
});

it('signs a nested path', () => {
  expect(signBunnyUrl(
    new URL(
      'https://pencil-case.b-cdn.net/documents/'
      + 'a1e0b1c3-0000-4000-8000-000000000000/'
      + 'b3f1c2d4-0000-4000-8000-000000000000.webp',
    ),
    'SecurityKey',
    1598024587,
  )).toBe(
    'https://pencil-case.b-cdn.net/documents/'
    + 'a1e0b1c3-0000-4000-8000-000000000000/'
    + 'b3f1c2d4-0000-4000-8000-000000000000.webp'
    + '?token=HS256-3Dx59CNd4T52LBTvAHJXsXGngAyXiYb5ALB-FZiZqfo'
    + '&expires=1598024587',
  );
});
