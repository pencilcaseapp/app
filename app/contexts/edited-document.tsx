import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

type EditedDocumentContextValue = {
  editedDocumentId: string | null;
  reportDocumentEdit: (documentId: string) => void;
};

export const EditedDocumentContext = createContext<
  EditedDocumentContextValue | null
>(null);

export function useEditedDocument() {
  const context = use(EditedDocumentContext);

  if (!context) {
    throw new Error('useEditedDocument must be used within an EditedDocumentProvider');
  }

  return context;
}

/**
 * Tracks the document the user has edited last, so that the sidebar can pull
 * it to the top of the navigation.
 */
export const EditedDocumentProvider: React.FC<PropsWithChildren>
  = ({ children }) => {
    const [editedDocumentId, setEditedDocumentId] = useState<string | null>(
      null,
    );

    const reportDocumentEdit = useCallback((documentId: string) => {
      setEditedDocumentId(documentId);
    }, []);

    const value = useMemo(
      () => ({ editedDocumentId, reportDocumentEdit }),
      [editedDocumentId, reportDocumentEdit],
    );

    return (
      <EditedDocumentContext value={value}>
        {children}
      </EditedDocumentContext>
    );
  };
