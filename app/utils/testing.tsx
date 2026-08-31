import { act, render } from '@testing-library/react';
import { createRoutesStub, RouterContextProvider, type Register } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { DocumentTitleProvider } from '~/contexts/document-title';
import { EditedDocumentProvider } from '~/contexts/edited-document';
import { SidebarProvider } from '~/ui/sidebar-context/sidebar-provider';
import { SocketClientProvider } from '~/contexts/socket-client';
import { ToastProvider } from '~/ui/toast/toast-provider';
import routes from '~/routes';

type HappyDOMWindow = typeof window & {
  happyDOM: { setViewport: (viewport: { width: number }) => void };
};

/** Resizes the happy-dom window so `useMedia` queries resolve. */
export function setViewportWidth(width: number) {
  (window as HappyDOMWindow).happyDOM.setViewport({ width });
}

type RouteEntry = (typeof routes)[number];

/** Flattens the route tree, joining each route's path with its parents'. */
function flattenRoutes(
  entries: RouteEntry[],
  parentPath = '',
  parents: { route: RouteEntry; fullPath: string }[] = [],
): { route: RouteEntry; fullPath: string; parents: typeof parents }[] {
  return entries.flatMap((route) => {
    const fullPath = [parentPath, route.path].filter(Boolean).join('/');
    const entry = { route, fullPath };

    return [
      { ...entry, parents },
      ...flattenRoutes(route.children ?? [], fullPath, [...parents, entry]),
    ];
  });
}

/**
 * Imports a route's module — and its children's, so index routes render
 * and sibling routes can be navigated to — into a route stub entry.
 * `rootPath` mounts the entry at an absolute path instead of its own.
 */
async function loadRouteTree(
  route: RouteEntry,
  rootPath?: string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const module = await import(`~/${route.file}`);

  return {
    ...module,
    ...(route.index === true && !rootPath
      ? { index: true }
      : { path: rootPath ?? route.path }),
    Component: module.default ?? (() => null),
    middleware: [],
    HydrateFallback: () => null,
    ErrorBoundary: () => null,
    children: route.children
      ? await Promise.all(route.children.map(child => loadRouteTree(child)))
      : undefined,
  };
}

export async function renderRoute<P extends keyof Register['pages']>(
  path: P,
  options?: Register['pages'][P] & {
    searchParams?: Record<string, string>;
    context?: RouterContextProvider;
    /**
     * Mounts this ancestor route and everything below it instead of
     * the route alone, so the route renders below the ancestors'
     * outlets and their loaders run. Everything above stays
     * unmounted; it only contributes URL segments.
     */
    parentRoute?: keyof Register['pages'];
  },
) {
  const match = flattenRoutes(routes).find(({ route, fullPath }) =>
    path === '/' ? route.index === true : `/${fullPath}` === path,
  );
  if (!match) {
    throw new Error(`No route found for ${path}`);
  }

  let replacedPath: string = path;
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      replacedPath = replacedPath.replace(`:${key}`, value);
    }
  }

  // The mounted tree: the target route, or the ancestor named by
  // `parentRoute`, with all routes below it.
  const mountRoot = options?.parentRoute
    ? match.parents.find(
        ({ fullPath }) => `/${fullPath}` === options.parentRoute,
      )
    : match;
  if (!mountRoot) {
    throw new Error(`${String(options?.parentRoute)} is not above ${path}`);
  }

  const root = await loadRouteTree(
    mountRoot.route,
    `/${mountRoot.fullPath}`,
  );
  const Stub = createRoutesStub([root], options?.context);

  if (options?.searchParams) {
    const searchParams = new URLSearchParams(options.searchParams).toString();
    replacedPath = `${replacedPath}?${searchParams}`;
  }

  const result = render(
    <ToastProvider>
      <AuthenticityTokenProvider token="test-token">
        <DocumentTitleProvider>
          <EditedDocumentProvider>
            <SidebarProvider>
              <SocketClientProvider>
                <Stub initialEntries={[replacedPath]} />
              </SocketClientProvider>
            </SidebarProvider>
          </EditedDocumentProvider>
        </DocumentTitleProvider>
      </AuthenticityTokenProvider>
    </ToastProvider>,
  );

  await act(async () => {});

  return result;
}
