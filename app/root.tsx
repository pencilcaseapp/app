import {
  isRouteErrorResponse,
  Outlet,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useMatches,
  type UIMatch,
  data,
} from 'react-router';
import type { Route } from './+types/root';
import classNames from 'classnames';
import { csrf } from './utils/csrf';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';

import './app.css';
import { Typography } from './ui/typography/typography';

export function Layout({ children }: { children: React.ReactNode }) {
  const matches = useMatches() as UIMatch<unknown, { bodyClassName: string }>[];
  const routeBodyClassNames = matches
    .filter(match => match.handle?.bodyClassName)
    .map(match => match.handle?.bodyClassName);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={classNames(...routeBodyClassNames)}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const [token, cookieHeader] = await csrf.commitToken(request, 64);
  return data({ token }, {
    headers: cookieHeader
      ? {
          'set-cookie': cookieHeader,
        }
      : undefined,
  });
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <AuthenticityTokenProvider token={loaderData.token}>
      <Outlet />
    </AuthenticityTokenProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';

  if (isRouteErrorResponse(error)) {
    message = `Error ${error.status}`;
    details = error.statusText || details;
  }
  else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <Typography variant="heading1" textColorLight="black" textColorDark="white" className="mb-4 text-center">
        {message}
      </Typography>
      <Typography variant="body" textColorLight="grey-900" textColorDark="grey-300" className="text-center">
        {details}
      </Typography>
    </main>
  );
}
