import { href, redirect } from 'react-router';
import { v7 as uuid } from 'uuid';

export function loader() {
  const docId = uuid();
  return redirect(href('/doc/:id', { id: docId }));
}
