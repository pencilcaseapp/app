import { DOCUMENT_FOLDERS, type DocumentFolder } from '~/constants/document';
import { SearchParamNavigation } from '~/constants/search-params';

export function isDocumentFolder(value: unknown): value is DocumentFolder {
  return DOCUMENT_FOLDERS.some(folder => folder === value);
}

/** The folder a URL names, if it names one the navigation has. */
export function getFolderSearchParam(
  url: string | URL,
): DocumentFolder | undefined {
  const folder = new URL(url).searchParams.get(SearchParamNavigation.Folder);

  return isDocumentFolder(folder) ? folder : undefined;
}
