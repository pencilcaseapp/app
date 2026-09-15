import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react';

type DocumentTitle = string | null;

const DEFAULT_DOCUMENT_TITLE = 'Untitled';

type ActiveDocument = {
  id: string;
  title: DocumentTitle;
};

type DocumentTitleContextValue = {
  document: ActiveDocument | null;
  setDocument: Dispatch<SetStateAction<ActiveDocument | null>>;
};

export const DocumentTitleContext = createContext<
  DocumentTitleContextValue | null
>(null);

function useDocumentTitleContext() {
  const context = use(DocumentTitleContext);

  if (!context) {
    throw new Error('useDocumentTitle must be used within a DocumentTitleProvider');
  }

  return context;
}

/**
 * The title of the document the route is showing: the one the editor
 * reports through `setTitle`, and `initialTitle` until then. The initial
 * title is only applied when the route opens another document, so a
 * revalidation cannot put the stored title back over the live one.
 */
export function useDocumentTitle(
  documentId: string,
  initialTitle: DocumentTitle,
) {
  const { document, setDocument } = useDocumentTitleContext();

  useEffect(() => {
    setDocument(current => current?.id === documentId
      ? current
      : { id: documentId, title: initialTitle });
  }, [setDocument, documentId, initialTitle]);

  const setTitle = useCallback((title: DocumentTitle) => {
    setDocument({ id: documentId, title });
  }, [setDocument, documentId]);

  const title = (document?.id === documentId ? document.title : null)
    ?? initialTitle
    ?? DEFAULT_DOCUMENT_TITLE;

  return useMemo(
    () => [title, setTitle] as const,
    [title, setTitle],
  );
}

/**
 * The open document and its title as the route reports it, for the parts of
 * the layout outside the document route. `null` before any route reported.
 */
export function useActiveDocumentTitle() {
  const { document } = useDocumentTitleContext();

  return useMemo(
    () => document && {
      id: document.id,
      title: document.title ?? DEFAULT_DOCUMENT_TITLE,
    },
    [document],
  );
}

export const DocumentTitleProvider: React.FC<PropsWithChildren>
  = ({ children }) => {
    const [document, setDocument] = useState<ActiveDocument | null>(null);
    const value = useMemo(() => ({ document, setDocument }), [document]);

    return (
      <DocumentTitleContext value={value}>
        {children}
      </DocumentTitleContext>
    );
  };
