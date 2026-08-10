# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run docker:up      # start dev (:5433) and test (:5434) Postgres containers
npm run dev            # dev server on http://localhost:3000 (runs migrations on boot)
npm run test           # vitest (watch mode); requires the test Postgres on :5434
npm run typecheck      # react-router typegen && tsc
npm run lint           # eslint
npm run storybook      # Storybook on :6006
npm run build          # react-router build + esbuild bundle of server.ts -> server.js
```

Run a single test file or test name:

```bash
npx vitest run app/repos/document.test.ts -t 'creates an empty document'
```

Generate a migration after editing `app/db/schema.ts` (drizzle-kit is not wired to an npm script):

```bash
npx drizzle-kit generate
```

Migrations live in `drizzle/` and are applied automatically at server start
(`app/db/migrate.ts`) and before the test suite (`test/global-setup.ts`, which
drops and recreates the whole test schema first).

CI (`.github/workflows/ci.yml`) runs lint, test, typecheck, build, and
build-storybook. Pushing to `main` deploys to Clever Cloud via
`.github/workflows/cd.yml`.

## Architecture

React Router 7 (framework mode, SSR) on a custom Express server, Postgres via
Drizzle ORM, real-time collaborative editing with Lexical + Yjs + Hocuspocus.

**Server entry — `server.ts`.** One `node:http` server hosts both the React
Router request handler and the WebSocket upgrade. In prod it serves the built
client and attaches `createLiveServer`; in dev it runs Vite in middleware mode
and lazily `ssrLoadModule`s `app/live/index.ts` on upgrade so the live server
hot-reloads too. Not run through Vite's own dev server — start it with
`npm run dev`, not `vite`.

**Config — `app/config/`.** `getConfig()` switches on `process.env.ENV`
(`development` | `test` | `prod`, defaulting to test) and returns a fully typed
`Config`. DB URLs, secrets, ports, and cookie flags all come from here; do not
read `process.env` directly outside `app/config/`. Dev and test point at the two
different Docker Postgres ports.

**Collaboration — `app/live/index.ts`.** A Hocuspocus server behind a `crossws`
adapter. Its `Database` extension is the persistence bridge: `fetch` loads
`documents.content` (a `bytea` Yjs update) or seeds a fresh doc via
`createInitialDocumentContent()`, and `store` writes the Yjs state back along
with a title extracted from the Y.Doc (`extractTitleFromYDoc`). The document
title is therefore derived from the first heading of the editor content, not
edited directly — client side the same extraction runs through
`useExtractDocumentTitle` and the `DocumentTitleProvider` context so the sidebar
and `<title>` stay live. `app/utils/headless.ts` uses a headless Lexical editor
to produce valid Yjs updates on the server.

**Auth.** Passwordless magic code. `app/services/auth.ts` owns the flow
(argon2-hashed OTP → cookie session with a sha256-hashed token stored in
`sessions`); `app/repos/` holds the raw queries. Two React Router middlewares in
`app/middleware/auth.ts`: `sessionMiddleware` (registered globally in
`app/root.tsx`) populates `optionalUserSessionContext` and, when a session was
refreshed, a `set-cookie` header context that `root.tsx`'s loader commits;
`authMiddleware` is opted into per route and redirects to `/signin?returnUrl=…`,
setting the non-optional `userSessionContext`. Loaders read the user from
`context.get(...)`, never by re-parsing the request.

**Layering.** `app/routes/` and `app/layouts/` (loaders/actions) → `app/services/`
(business logic) → `app/repos/` (Drizzle queries, one module per table) →
`app/db/`. Repos validate UUIDs before querying and return `undefined`/`[]`
rather than throwing.

**Forms.** TanStack Form via `useAppForm` (`app/hooks/use-app-form.ts`), which
wires the field/form component registry (`ControlledTextField`, `Checkbox`,
`OneTimePasswordField`, `SubmitButton`) and merges server `actionData` back into
client state. Actions call `validateForm(request, zodSchema)` from
`app/utils/form.ts` — it enforces CSRF (throwing 403), runs the Zod schema
server-side, and derives `FormDataInfo` coercion hints from the schema shape.
Return `form.formState` on failure, or `returnFormError(...)` for
service-level errors. The same Zod schema is reused as the client `onBlur`
validator.

**UI.** `app/ui/` is the design system (presentational, has Storybook stories,
no data access); `app/components/` is app-specific composition. Tailwind v4 with
theme tokens defined in `@theme` in `app/app.css` — always use the `pca-*`
tokens (`bg-pca-grey-900`, `text-pca-white`, …), never raw Tailwind palette
colors. Components take explicit `colorLight`/`colorDark`, `textColorLight`/
`textColorDark` props and emit both light and `dark:` classes rather than
relying on a runtime theme. Polymorphism goes through the `as` prop and
`PolymorphicComponentPropWithRef`.

## Conventions

- `~/*` maps to `app/*`, `~/test/*` maps to `test/*`.
- Files and directories are kebab-case; a component lives in its own directory
  alongside its `.test.tsx`, `.stories.tsx`, and `__snapshots__/`.
- ESLint uses `@stylistic` customize (semicolons, single quotes, comma dangle)
  plus a hard **80-column max-len**. Run `npm run lint` before finishing.
- Route types come from `./+types/<route>`; run `npm run typecheck` (which runs
  `react-router typegen` first) after adding or renaming routes in
  `app/routes.ts`.
- Prefer `href('/doc/:id', { id })` over hand-written paths; search param keys
  live in `app/constants/search-params.ts` and shared copy in
  `app/constants/common-copies.ts`.

## Tests

Vitest with `happy-dom` and globals enabled. CSRF validation is stubbed globally
in `test/setup.ts`.

- Repo/service tests hit the **real** test database. Build rows with the
  factories in `test/data-factories/` (faker-backed, they insert), not by hand.
- Route tests use `renderRoute(path, { params, context, searchParams })` from
  `app/utils/testing.tsx`, which resolves the module from `app/routes.ts`, wraps
  it in `createRoutesStub` plus the CSRF/document-title/sidebar providers, and
  strips middleware. Inject the session by setting `userSessionContext` on a
  `RouterContextProvider` and `vi.mock` the repos the route imports.
- Plain objects for non-DB assertions live in `test/fixtures/`.
- Many UI tests are snapshot-based; update with `npx vitest run -u`.
