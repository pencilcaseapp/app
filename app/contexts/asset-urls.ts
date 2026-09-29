import { createContext } from 'react';

/**
 * The signed CDN URL of each of the document's images by its `src`, which
 * the server handed along with the preview: the editor then loads what the
 * preview already has instead of going through the redirect again.
 */
export const AssetUrlsContext = createContext<Record<string, string>>({});
