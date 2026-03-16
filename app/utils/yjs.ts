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

    const text = getTextFromXmlText(delta.insert);
    return text.length > 70 ? `${text.slice(0, 70)} …` : text;
  }

  return null;
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
