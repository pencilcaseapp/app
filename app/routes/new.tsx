import { href, redirect } from 'react-router';
import { createDocument } from '~/repos/document';

export async function loader() {
  const document = await createDocument();
  return redirect(href('/doc/:id', { id: document.id }));
}
