import { data } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { openAsset } from '~/services/asset';
import type { Route } from './+types/doc-asset';

/**
 * Hands a file of a document to whoever may open the document: a redirect
 * to a signed URL on the CDN, or the file itself where there is no CDN
 * (dev and test). The bucket stays private, so this is the only way to it
 * and unsharing a document takes its files along within minutes. Browsers
 * may keep the answer for a while, shared caches may not.
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const [error, asset] = await openAsset(
    params.id,
    params.assetId,
    user ?? undefined,
  );

  if (error !== null) {
    throw data('Not Found', { status: 404 });
  }

  if ('url' in asset) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': asset.url,
        'Cache-Control': `private, max-age=${asset.maxAge}`,
      },
    });
  }

  return new Response(asset.body, {
    headers: {
      'Content-Type': asset.contentType,
      'Content-Length': String(asset.byteSize),
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'default-src \'none\'; sandbox',
    },
  });
}
