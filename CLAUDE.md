# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An Expo (React Native) app for tracking workout categories and exercises, using Expo Router for navigation. The backend is a separate API ("mgp") consumed via axios; there is no backend code in this repo.

## Commands

```bash
npm install            # install dependencies
npm run start          # expo start (dev server, opens Expo Go/simulators)
npm run start:prod-api # same, but forcing the API URLs from .env.production
npm run ios            # expo run:ios
npm run ios:prod-api   # expo run:ios, forcing the API URLs from .env.production
npm run android        # expo run:android
npm run web            # expo start --web
npm run lint           # expo lint (eslint-config-expo flat config)
npm run reset-project  # moves starter app/ to app-example/ and creates a blank app/ (do not run unless asked)
npm test                # jest (jest-expo preset) — runs the full suite once
npm run test:watch      # jest --watch
npm run test:coverage   # jest --coverage
npm run test:e2e        # Maestro E2E suite against the iOS simulator (see "E2E tests" below)
```

Tests live in `__tests__/` folders next to the code they cover (e.g.
`core/auth/actions/__tests__/auth-actions.test.ts`), plus a root `test-utils/`
for shared fixtures (`test-utils/fixtures.ts`) and the React Query test wrapper
(`test-utils/query-wrapper.tsx`). `core/*/actions` tests mock the shared axios
instance with `jest.mock("@/core/api/mgpApi", () => ({ mgpApi: { get: jest.fn(), ... } }))`
and assert against the mocked method; `core/api/__tests__/mgpApi.test.ts` is the
one exception, using `axios-mock-adapter` against the real instance to exercise
its request/response interceptors. Global mocks (`expo-secure-store`,
`expo-router`, `Alert.alert`) live in `jest.setup.ts`.

## E2E tests (Maestro)

Flows live in `.maestro/` as declarative YAML, one file per user flow
(`01-login-fallido.yaml` … `09-logout.yaml`, plus the shared subflow
`.maestro/shared/_ensure-logged-out.yaml`). Maestro CLI is a machine-level
install, not an npm dependency:

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
maestro --version   # verify the install; add ~/.maestro/bin to PATH if needed
```

`npm run test:e2e` runs `scripts/e2e-with-env.js`, which reads
`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` from `.env` (Maestro itself does not
read `.env` files) and invokes `maestro test .maestro/ -e EMAIL=... -e
PASSWORD=...`. It exits early with a clear error if those vars are missing.
Pass a specific flow or folder as an argument to run a subset, e.g. `node
scripts/e2e-with-env.js .maestro/03-crear-categoria.yaml`.

Preconditions (not automated by the script):

- The app is installed on the iOS simulator (`npm run ios`).
- Metro is running.
- The LAN development backend (the one `.env.development` points at) is up.
- `.env` has `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` for a disposable test
  account on that backend.

Every flow launches with `clearState: true` and is independent — no flow
relies on state left by another, and each can be run alone. Flows that
create data generate a unique per-run suffix (`E2E Cat ${suffix}`, `E2E Ex
${suffix}`) since the test account's data is never cleaned up between runs.
iOS's keychain can survive `clearState`, which would leave the app already
authenticated; `shared/_ensure-logged-out.yaml` guards against that by
logging out first if the home screen is visible on launch.

E2E is iOS-simulator-only, local-only (no CI), and out of scope for Jest —
see `specs/12-tests-e2e-maestro.md` for the full rationale.

## Environment

Config is read from `.env*` files via `EXPO_PUBLIC_*` vars (see `core/api/mgpApi.ts` +
`core/api/resolveApiUrl.ts`). None of them are versioned; each has a committed
`.example` template (`cp .env.development.example .env.development`, etc.).

- `.env` — shared across modes: `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`
- `.env.development` — `EXPO_PUBLIC_STAGE=dev` plus `EXPO_PUBLIC_API_URL_IOS` /
  `EXPO_PUBLIC_API_URL_ANDROID` (LAN IP, selected by `Platform.OS`)
- `.env.production` — `EXPO_PUBLIC_STAGE=prod` plus `EXPO_PUBLIC_API_URL` (deployed API)

Expo resolves these by `NODE_ENV`, highest priority first:
`.env.${NODE_ENV}.local` → `.env.local` → `.env.${NODE_ENV}` → `.env`. Expo CLI sets
`NODE_ENV` itself: `development` for `expo start`/debug builds, `production` for
`expo export`, Release builds and EAS Build.

Vars already present in the shell environment always win over the files. That is what
`scripts/start-with-env.js` (behind `npm run start:prod-api` / `npm run ios:prod-api`)
relies on to run a *development* bundle against the production API without flipping
`NODE_ENV`. Since `EXPO_PUBLIC_*` values are inlined at bundle time, restart Metro
(`npx expo start --clear`) after switching environments.

EAS Build only uploads git-tracked files, so `.env.production` will not reach the
builder — those values must be set as EAS Environment Variables when `eas.json` is added.

## Architecture

The codebase follows a layered structure that cuts across `core/`, `presentation/`, and `app/`:

- **`app/`** — Expo Router file-based routes only. Screens here import everything else; they should not contain API or business logic beyond data shaping for display.
  - `app/_layout.tsx` — root layout: sets up `QueryClientProvider` (React Query) and navigation `ThemeProvider`.
  - `app/auth/` — login/register routes, outside the authenticated group.
  - `app/(mgp-app)/` — authenticated route group. `_layout.tsx` here (`CheckAuthenticationLayout`) gates the whole group on `useAuthStore().status`: shows a spinner while `"checking"`, redirects to `/auth/login` when `"unauthenticated"`, otherwise renders the `Stack` for `(home)/index`, `category/[id]`, `exercise/[id]`.
- **`core/`** — domain logic, organized by feature (`auth`, `categories`, `exercises`, `activity`), each with:
  - `actions/` — plain async functions that call the API directly via `mgpApi` and either return data or throw/return null on failure (inconsistent today — `auth-actions.ts` swallows errors and returns `null`, `category`/`exercise` actions throw `Error`). Check the existing action's error convention before adding a sibling.
  - `interface*/` — TypeScript interfaces for the domain shape (e.g. `Category`, `Exercise`, `User`).
  - `core/api/mgpApi.ts` — single shared axios instance. A request interceptor attaches `Authorization: Bearer <token>` from `SecureStorageAdapter` for every request except `/auth/login`.
- **`presentation/`** — feature-aligned hooks, stores, and components that the `app/` screens consume.
  - `presentation/<feature>/hooks/` — React Query wrappers around `core/<feature>/actions` (e.g. `useCategories` = `useQuery`, `useCategory` = `useMutation` that creates/updates a category and invalidates the `["categories"]` query key on success).
  - `presentation/activity/` — `useActivity` (`useQuery` on `["activity"]`, wraps `core/activity/actions/get-activity.action.ts`), `utils/group-activity-by-day.ts` (groups items into "Hoy"/"Ayer"/date sections by local day), and the `ActivityRow`/`ActivityHeaderButton` components consumed by `app/(mgp-app)/activity.tsx`.
  - `presentation/auth/store/useAuthStore.ts` — Zustand store holding `status` (`"checking" | "authenticated" | "unauthenticated"`), `user`, `token`. `checkStatus()` calls `authCheckStatus()` against `/auth/check-status` on app mount; `login()` and `logout()` go through `changeStatus()`, which is also responsible for persisting/clearing the token via `SecureStorageAdapter`.
  - `presentation/theme/` — design primitives shared across the app: `Themed*` components (`ThemedText`, `ThemedView`, `ThemedButton`, `ThemedTextInput`), `use-theme-color`/`use-color-scheme` hooks that read from `constants/theme.ts` (`Colors.light` / `Colors.dark`), and platform-specific files (e.g. `use-color-scheme.web.ts`).
- **`helpers/adapters/secure-storage.adapter.ts`** — `SecureStorageAdapter` wraps `expo-secure-store` with an in-memory cache layer; this is the only place auth tokens are persisted/read.

### Data flow pattern

`app/` screen → `presentation/<feature>/hooks` (React Query) → `core/<feature>/actions` (axios call via `mgpApi`) → backend. Mutations invalidate the relevant React Query key (commonly `["categories"]`) rather than manually patching cache, except where screens optimistically append to local state (see `category/[id].tsx`'s `exerciseMutation.onSuccess`).

### Path aliases

`@/*` maps to the repo root (configured in `tsconfig.json`), e.g. `@/core/api/mgpApi`, `@/presentation/theme/components/themed-text`.

### Known inconsistencies to be aware of

- `core/categories/actions/create-update-category.action.ts` has a TODO/no-op branch for updating an existing category (`category.id && category.id !== "new"` just logs `"pending"` and falls through to create) — update is not actually implemented yet.
- Auth register flow has a `// TODO: Tarea: Hacer el register` in `core/auth/actions/auth-actions.ts`; `app/auth/register/index.tsx` exists as a route but the action layer isn't wired up.

### agent-device

use agent-device only for app/device automation tasks.
Before planning device work, run `agent-device --version` and read `agent-device help workflow`.
For exploratory QA, read `agent-device help dogfood`.
For logs, network, audio, traces, or runtime failures, read `agent-device help debugging`.
For React Native component trees, props/state/hooks, slow renders, or rerenders, read `agent-device help react-devtools`.
For React Native JavaScript heap growth, heap snapshots, or retained-object leaks, read `agent-device help cdp`.
For React Native apps, overlays, Metro/Fast Refresh blockers, and routing to React DevTools or debugging evidence, read `agent-device help react-native`.

Use the CLI in the integrated terminal.
If `agent-device` is not on PATH but the user installed it globally in another shell, resolve the absolute binary path instead of using `npx -y agent-device@latest`.
Prefer `open -> snapshot -i -> act -> re-snapshot -> verify -> close` where supported; otherwise follow target-specific help.
Keep mutating commands against one session serial.
