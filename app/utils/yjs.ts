import * as Y from 'yjs';

export function getDocFromMap(id: string, yjsDocMap: Map<string, Y.Doc>) {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  }
  else {
    doc.load();
  }

  return doc;
};

export function extractTitleFromYDoc(ydoc: Y.Doc): string | null {
  const root = ydoc.get('root', Y.XmlText);

  for (const delta of root.toDelta()) {
    if (!(delta.insert instanceof Y.XmlText)) {
      continue;
    }

    const text = getTextFromXmlText(delta.insert).trim();
    if (text === '') {
      return null;
    }

    return text.length > 70 ? `${text.slice(0, 70).trimEnd()} …` : text;
  }

  return null;
}

/**
 * Whether nothing was written in the document: no text but whitespace and
 * no node that is not text, such as an image or a divider, which Lexical
 * keeps as an `XmlElement`.
 */
export function isYDocEmpty(ydoc: Y.Doc) {
  return !hasContent(ydoc.get('root', Y.XmlText));
}

/** `isYDocEmpty` for stored content; nothing stored yet is empty too. */
export function isContentEmpty(content: Uint8Array | null) {
  if (content === null) {
    return true;
  }

  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, content);
  const empty = isYDocEmpty(ydoc);
  ydoc.destroy();

  return empty;
}

function hasContent(xmlText: Y.XmlText): boolean {
  return xmlText.toDelta().some(({ insert }: { insert: unknown }) =>
    (typeof insert === 'string' && insert.trim() !== '')
    || insert instanceof Y.XmlElement
    || (insert instanceof Y.XmlText && hasContent(insert)));
}

export function getTextFromXmlText(xmlText: Y.XmlText): string {
  let text = '';

  for (const delta of xmlText.toDelta()) {
    if (typeof delta.insert === 'string') {
      text += delta.insert;
    }
    else if (delta.insert instanceof Y.XmlText) {
      text += getTextFromXmlText(delta.insert);
    }
  }

  return text;
}
