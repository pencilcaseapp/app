import { createContext } from 'react-router';
import type { User } from '~/repos/user';

// eslint-disable-next-line @eslint-react/naming-convention-context-name
export const requiredUserSessionContext = createContext<User>();

// eslint-disable-next-line @eslint-react/naming-convention-context-name
export const optionalUserSessionContext = createContext<User | null>(null);
