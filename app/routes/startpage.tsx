import { href, redirect, type MiddlewareFunction } from 'react-router';
import { authMiddleware } from '~/middleware/auth';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export function loader() {
  return redirect(href('/home'));
}
