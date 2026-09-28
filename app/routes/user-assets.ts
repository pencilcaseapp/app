import { data } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { findAsset, readAsset } from '~/services/asset';
import type { Route } from './+types/user-assets';

/**
 * Serves a file of a document out of the bucket to whoever may open the
 * document. The bucket itself stays private, so this is the only way to
 * it and unsharing a document takes its files along. Browsers may keep a
 * copy for a while, shared caches may not. A file never changes, so its
 * id is its ETag and a browser whose copy has expired gets a 304 instead
 * of the whole file again, once access has been checked.
 */
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const [error, asset] = await findAsset(params.assetId, user ?? undefined);

  if (error !== null) {
    throw data('Not Found', { status: 404 });
  }

  const etag = `"${asset.id}"`;
  const cacheHeaders = {
    'ETag': etag,
    'Cache-Control': 'private, max-age=3600',
  };

  if (matchesEtag(request.headers.get('If-None-Match'), etag)) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }

  const body = await readAsset(asset);

  if (!body) {
    throw data('Not Found', { status: 404 });
  }

  return new Response(body, {
    headers: {
      ...cacheHeaders,
      'Content-Type': asset.contentType,
      'Content-Length': String(body.byteLength),
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'default-src \'none\'; sandbox',
    },
  });
}

function matchesEtag(ifNoneMatch: string | null, etag: string) {
  return ifNoneMatch?.split(',').some(tag =>
    tag.trim().replace(/^W\//, '') === etag,
  ) ?? false;
}
