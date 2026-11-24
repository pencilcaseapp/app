import {
  redirect,
  type DataStrategyResult,
  type MiddlewareFunction,
} from 'react-router';
import { SearchParamNavigation } from '~/constants/search-params';
import { getFolderSearchParam } from '~/utils/document-folder';

/**
 * Each tab keeps its folder in its URL, so it lists the same one after a
 * reload whatever another tab picked since. A link inside the editor
 * names no folder, so a navigation that leaves it out takes along the
 * one the tab is on. Only page loads: a redirect would cut a submission
 * short.
 */
export const keepFolderMiddleware: MiddlewareFunction<
  Record<string, DataStrategyResult>
> = ({ request }) => {
  const url = new URL(request.url);
  const folder = getFolderSearchParam(window.location.href);

  if (
    request.method !== 'GET'
    || !folder
    || url.searchParams.has(SearchParamNavigation.Folder)
  ) {
    return;
  }

  url.searchParams.set(SearchParamNavigation.Folder, folder);
  throw redirect(`${url.pathname}${url.search}`);
};
