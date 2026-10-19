import {
  createContext,
  use,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';

type LeavingDocumentContextValue = {
  setLeavingDocument: (documentId: string | null) => void;
  isLeavingDocument: (documentId: string) => boolean;
};

export const LeavingDocumentContext = createContext<
  LeavingDocumentContextValue | null
>(null);

export function useLeavingDocument() {
  const context = use(LeavingDocumentContext);

  if (!context) {
    throw new Error('useLeavingDocument must be used within a LeavingDocumentProvider');
  }

  return context;
}

/**
 * Tracks the document the sidebar is deleting or leaving, so the doc route
 * can ignore the connection the server closes for it on the way out. A ref
 * rather than state: the close arrives before React has rendered the
 * pending delete.
 */
export const LeavingDocumentProvider: React.FC<PropsWithChildren>
  = ({ children }) => {
    const leavingDocumentIdRef = useRef<string | null>(null);

    const value = useMemo(() => ({
      setLeavingDocument: (documentId: string | null) => {
        leavingDocumentIdRef.current = documentId;
      },
      isLeavingDocument: (documentId: string) =>
        leavingDocumentIdRef.current === documentId,
    }), []);

    return (
      <LeavingDocumentContext value={value}>
        {children}
      </LeavingDocumentContext>
    );
  };
