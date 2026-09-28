import { createHmac } from 'node:crypto';

/**
 * Signs a URL of a Bunny pull zone with token authentication on, so it
 * loads until `expires` (unix seconds) and not after. Only the path and
 * the expiry are signed, the way Bunny's reference implementation does it
 * for a URL without query parameters.
 */
export function signBunnyUrl(url: URL, tokenKey: string, expires: number) {
  const digest = createHmac('sha256', tokenKey)
    .update(url.pathname)
    .update(String(expires))
    .digest('base64url');
  const signed = new URL(url);
  signed.search = `?token=HS256-${digest}&expires=${expires}`;

  return signed.toString();
}
