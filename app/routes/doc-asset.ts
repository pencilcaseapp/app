import { data } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { openAsset } from '~/services/asset';
import type { Route } from './+types/doc-asset';

/**
 * Streams a file of a document out of the bucket to whoever may open the
 * document. The bucket itself stays private, so this is the only way to
 * it and unsharing a document takes its files along. Browsers may keep a
 * copy for a while, shared caches may not.
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
