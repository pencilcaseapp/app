import { createContext } from 'react-router';
import type { User } from '~/repos/user';

// eslint-disable-next-line @eslint-react/naming-convention-context-name
export const userSessionContext = createContext<User>();
