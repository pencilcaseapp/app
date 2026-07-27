import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { extractTitleFromYDoc } from '~/utils/yjs';

export const useExtractDocumentTitle = (
  doc: Y.Doc,
  onTitleChange?: (title: string | null) => void,
) => {
  const [title, setTitle] = useState<string | null>(
    () => extractTitleFromYDoc(doc),
  );

  useEffect(() => {
    const handleTitleChange = () => {
      const newTitle = extractTitleFromYDoc(doc);
      if (newTitle !== title) {
        setTitle(newTitle);
        onTitleChange?.(newTitle);
      }
    };

    doc.on('update', handleTitleChange);

    return () => {
      doc.off('update', handleTitleChange);
    };
  }, [doc, title, onTitleChange]);

  return title;
};
