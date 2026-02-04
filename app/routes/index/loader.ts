import { href, redirect } from 'react-router';

export function loader() {
  return redirect(href('/doc/:id', { id: '123' }));
}
