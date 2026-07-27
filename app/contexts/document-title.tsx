import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react';

type DocumentTitle = string | null;

const DEFAULT_DOCUMENT_TITLE = 'Untitled';

type DocumentTitleContextValue = {
  title: DocumentTitle;
  setTitle: Dispatch<SetStateAction<DocumentTitle>>;
};

export const DocumentTitleContext = createContext<
  DocumentTitleContextValue | null
>(null);

export function useDocumentTitle(initialTitle?: DocumentTitle) {
  const context = use(DocumentTitleContext);

  if (!context) {
    throw new Error('useDocumentTitle must be used within a DocumentTitleProvider');
  }

  const setTitle = context.setTitle;

  useEffect(() => {
    if (initialTitle === undefined) {
      return;
    }

    setTitle(initialTitle);
  }, [setTitle, initialTitle]);

  const title = context.title
    ?? initialTitle
    ?? DEFAULT_DOCUMENT_TITLE;

  return useMemo(
    () => [title, setTitle] as const,
    [title, setTitle],
  );
}

export const DocumentTitleProvider: React.FC<PropsWithChildren>
  = ({ children }) => {
    const [title, setTitle] = useState<DocumentTitle>(null);
    const value = useMemo(() => ({ title, setTitle }), [title]);

    return (
      <DocumentTitleContext value={value}>
        {children}
      </DocumentTitleContext>
    );
  };
