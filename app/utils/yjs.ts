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
