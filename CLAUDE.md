# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An Expo (React Native) app for tracking workout categories and exercises, using Expo Router for navigation. The backend is a separate API ("mgp") consumed via axios; there is no backend code in this repo.

## Commands

```bash
npm install          # install dependencies
npm run start         # expo start (dev server, opens Expo Go/simulators)
npm run ios           # expo start --ios
npm run android       # expo start --android
npm run web           # expo start --web
npm run lint          # expo lint (eslint-config-expo flat config)
npm run reset-project # moves starter app/ to app-example/ and creates a blank app/ (do not run unless asked)
```

There is no test runner configured in this project.

## Environment

Config is read from `.env` via `EXPO_PUBLIC_*` vars (see `core/api/mgpApi.ts`):
- `EXPO_PUBLIC_STAGE` — `"dev"` or `"prod"`
- `EXPO_PUBLIC_API_URL` — used when `STAGE === "prod"`
- `EXPO_PUBLIC_API_URL_IOS` / `EXPO_PUBLIC_API_URL_ANDROID` — used in dev, selected by `Platform.OS`

## Architecture

The codebase follows a layered structure that cuts across `core/`, `presentation/`, and `app/`:

- **`app/`** — Expo Router file-based routes only. Screens here import everything else; they should not contain API or business logic beyond data shaping for display.
  - `app/_layout.tsx` — root layout: sets up `QueryClientProvider` (React Query) and navigation `ThemeProvider`.
  - `app/auth/` — login/register routes, outside the authenticated group.
  - `app/(mgp-app)/` — authenticated route group. `_layout.tsx` here (`CheckAuthenticationLayout`) gates the whole group on `useAuthStore().status`: shows a spinner while `"checking"`, redirects to `/auth/login` when `"unauthenticated"`, otherwise renders the `Stack` for `(home)/index`, `category/[id]`, `exercise/[id]`.
- **`core/`** — domain logic, organized by feature (`auth`, `categories`, `exercises`), each with:
  - `actions/` — plain async functions that call the API directly via `mgpApi` and either return data or throw/return null on failure (inconsistent today — `auth-actions.ts` swallows errors and returns `null`, `category`/`exercise` actions throw `Error`). Check the existing action's error convention before adding a sibling.
  - `interface*/` — TypeScript interfaces for the domain shape (e.g. `Category`, `Exercise`, `User`).
  - `core/api/mgpApi.ts` — single shared axios instance. A request interceptor attaches `Authorization: Bearer <token>` from `SecureStorageAdapter` for every request except `/auth/login`.
- **`presentation/`** — feature-aligned hooks, stores, and components that the `app/` screens consume.
  - `presentation/<feature>/hooks/` — React Query wrappers around `core/<feature>/actions` (e.g. `useCategories` = `useQuery`, `useCategory` = `useMutation` that creates/updates a category and invalidates the `["categories"]` query key on success).
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
