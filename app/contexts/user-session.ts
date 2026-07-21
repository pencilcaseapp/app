import { createContext } from 'react-router';
import type { User } from '~/repos/user';

// eslint-disable-next-line @eslint-react/naming-convention-context-name
export const userSessionContext = createContext<User>();

// eslint-disable-next-line @eslint-react/naming-convention-context-name
export const optionalUserSessionContext = createContext<User | null>();

// eslint-disable-next-line @eslint-react/naming-convention-context-name
export const sessionCookieHeaderContext = createContext<string | null>();
