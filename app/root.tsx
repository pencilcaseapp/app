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
import { commitCsrfToken } from './utils/csrf';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { sessionCookieHeaderContext } from './contexts/user-session';
import { sessionMiddleware } from './middleware/auth';
import { useFaviconColorScheme } from './hooks/use-favicon-color-scheme';
import { Typography } from './ui/typography/typography';
import { PageTitle } from './components/page-title/page-title';

import './app.css';

export const middleware = [sessionMiddleware];

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  useFaviconColorScheme();

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

export async function loader({ request, context }: Route.LoaderArgs) {
  const [token, csrfCookieHeader] = await commitCsrfToken(request);
  const sessionCookieHeader = context.get(sessionCookieHeaderContext);

  const headers = new Headers();
  if (csrfCookieHeader) {
    headers.append('set-cookie', csrfCookieHeader);
  }

  if (sessionCookieHeader) {
    headers.append('set-cookie', sessionCookieHeader);
  }

  return data({ token }, {
    headers: headers.has('set-cookie')
      ? headers
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
      <PageTitle>{message}</PageTitle>
      <Typography variant="heading1" textColorLight="black" textColorDark="white" className="mb-4 text-center">
        {message}
      </Typography>
      <Typography variant="body" textColorLight="grey-900" textColorDark="grey-300" className="text-center">
        {details}
      </Typography>
    </main>
  );
}
