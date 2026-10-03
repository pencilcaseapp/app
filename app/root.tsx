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
  useRouteLoaderData,
} from 'react-router';
import type { Route } from './+types/root';
import classNames from 'classnames';
import { commitCsrfToken } from './utils/csrf';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { sessionCookieHeaderContext } from './contexts/user-session';
import { sessionMiddleware } from './middleware/auth';
import { Typography } from './ui/typography/typography';
import { PageTitle } from './components/page-title/page-title';
import { ToastProvider } from './ui/toast/toast-provider';
import { useToast } from './hooks/use-toast';
import { isNativeAppRequest } from './utils/native-app';

import './app.css';
import fontsHref from './fonts.css?url';

const VIEWPORT = 'width=device-width, initial-scale=1, maximum-scale=1';

export const middleware = [sessionMiddleware];

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest' },
  // A link of their own rather than part of app.css: Vite injects app.css
  // again once the page has hydrated in development, which registers the
  // fonts a second time and flashes the fallback while they reload.
  { rel: 'stylesheet', href: fontsHref },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const matches = useMatches() as UIMatch<unknown, { bodyClassName: string }>[];
  const routeBodyClassNames = matches
    .filter(match => match.handle?.bodyClassName)
    .map(match => match.handle?.bodyClassName);
  const isNativeApp = useRouteLoaderData<typeof loader>('root')?.isNativeApp;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {/* Only the native apps draw under the status bar; `--safe-area-top`
            stays zero everywhere else. */}
        <meta
          name="viewport"
          content={isNativeApp
            ? `${VIEWPORT}, viewport-fit=cover`
            : VIEWPORT}
        />
        {/* The title bar of the installed app: pca-white and pca-grey-900,
            the page background, as hex because not every browser reads
            oklch here. */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#101010" />
        <Meta />
        <Links />
      </head>
      <body className={classNames(...routeBodyClassNames)}>
        <ToastProvider>
          {children}
        </ToastProvider>
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

  return data({ token, isNativeApp: isNativeAppRequest(request) }, {
    headers: headers.has('set-cookie')
      ? headers
      : undefined,
  });
}

export default function App({ loaderData }: Route.ComponentProps) {
  useToast();

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
