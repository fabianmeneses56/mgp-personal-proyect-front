# MGP Tracker

Aplicación Expo (React Native) para llevar el control de categorías, ejercicios e histórico de pesos de entrenamiento, con navegación basada en archivos (Expo Router). El backend ("mgp") es una API separada consumida vía axios; este repositorio no contiene código de backend.

## Stack

- [Expo](https://expo.dev) / React Native
- [Expo Router](https://docs.expo.dev/router/introduction) (navegación basada en archivos)
- [React Query](https://tanstack.com/query/latest) para el manejo de datos remotos
- [Zustand](https://github.com/pmndrs/zustand) para estado global (autenticación)
- Axios para el consumo de la API
- `expo-secure-store` para persistencia segura del token de autenticación
- `expo-image-picker` para adjuntar imagen a un ejercicio
- `react-native-gifted-charts` para la gráfica de progreso de pesos
- Jest (`jest-expo`) para tests unitarios/integración y Maestro para E2E

## Estructura del proyecto

- **`app/`** — rutas de Expo Router. Las pantallas importan la lógica de negocio y solo la adaptan para mostrarla.
  - `app/auth/` — ruta de login (fuera del grupo autenticado; no hay registro, ver "Inconsistencias conocidas" en `CLAUDE.md`).
  - `app/(mgp-app)/` — grupo autenticado, protegido según el estado de `useAuthStore`: home, detalle de categoría/ejercicio, alta de categoría/ejercicio, entrada de peso (`weight-entry`), progreso de pesos (`exercise-progress`) y actividad reciente (`activity`).
- **`core/`** — lógica de dominio por feature (`auth`, `categories`, `exercises`, `weight-history`, `activity`): acciones que llaman a la API, interfaces de dominio y el cliente axios compartido (`core/api/mgpApi.ts`).
- **`presentation/`** — hooks (React Query), stores (Zustand) y componentes de UI por feature, más primitivas de diseño compartidas (`presentation/theme`: `Themed*`, colores claro/oscuro vía `useThemeColors`) y componentes de estado transversales (`presentation/common/components`: `EmptyState`, `ErrorState`, `AddNewButton`).
- **`helpers/adapters/secure-storage.adapter.ts`** — adaptador sobre `expo-secure-store` para persistir el token de autenticación.
- **`specs/`** — specs de features y decisiones técnicas (histórico de pesos, gráfica de progreso, tests E2E con Maestro, release a TestFlight, estados de error/vacío centralizados, etc.).

## Requisitos previos

- Node.js
- npm
- Expo CLI (se ejecuta vía `npx`/`npm run`)
- Un simulador iOS/Android o la app [Expo Go](https://expo.dev/go)

## Configuración

Las variables de entorno se leen desde archivos `.env` (ninguno versionado) usando el prefijo `EXPO_PUBLIC_*`. Cada uno tiene su plantilla `.example` versionada:

```bash
cp .env.example .env
cp .env.development.example .env.development
cp .env.production.example .env.production
```

| Archivo            | Contenido                                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| `.env`             | Compartido entre todos los modos (`E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`)    |
| `.env.development` | `EXPO_PUBLIC_STAGE=dev` + `EXPO_PUBLIC_API_URL_IOS` / `_ANDROID` (IP local) |
| `.env.production`  | `EXPO_PUBLIC_STAGE=prod` + `EXPO_PUBLIC_API_URL` (API desplegada)           |

`core/api/mgpApi.ts` elige la URL con `resolveApiUrl`: si `EXPO_PUBLIC_STAGE === "prod"` usa `EXPO_PUBLIC_API_URL`, y si no, la variante iOS o Android según `Platform.OS`.

Expo resuelve los archivos según `NODE_ENV`, de mayor a menor prioridad:

```
.env.${NODE_ENV}.local -> .env.local -> .env.${NODE_ENV} -> .env
```

`NODE_ENV` lo pone el propio Expo CLI: `development` en `expo start` y builds debug, `production` en `expo export`, builds Release y EAS Build. Las variables ya presentes en el entorno del shell tienen prioridad sobre cualquier archivo — es lo que aprovecha `npm run start:prod-api` para levantar un bundle de desarrollo apuntando a la API de producción.

> Las variables `EXPO_PUBLIC_*` se inyectan en el bundle al compilar: tras cambiar de entorno hay que reiniciar Metro (`npx expo start --clear`).

## Instalación

```bash
npm install
```

## Comandos

```bash
npm run start           # levanta el servidor de desarrollo de Expo
npm run start:prod-api  # igual, pero apuntando a la API de .env.production
npm run ios             # expo run:ios
npm run ios:prod-api    # expo run:ios apuntando a la API de .env.production
npm run android         # expo run:android
npm run web             # expo start --web
npm run lint            # expo lint (eslint-config-expo flat config)
npm run typecheck       # tsc --noEmit
npm run test            # jest (preset jest-expo), corre la suite completa una vez
npm run test:watch      # jest --watch
npm run test:coverage   # jest --coverage
npm run test:e2e        # suite E2E con Maestro contra el simulador de iOS
npm run reset-project   # mueve app/ a app-example/ y crea un app/ en blanco (no ejecutar salvo que se indique)
```

## Tests

Los tests unitarios/integración viven en carpetas `__tests__/` junto al código que cubren (p. ej. `core/auth/actions/__tests__/auth-actions.test.ts`), más un `test-utils/` raíz con fixtures compartidos y el wrapper de React Query para tests. Los mocks globales (`expo-secure-store`, `expo-router`, `Alert.alert`) están en `jest.setup.ts`.

### E2E (Maestro)

Los flujos viven en `.maestro/` como YAML declarativo, un archivo por flujo de usuario. Maestro CLI se instala a nivel de sistema, no como dependencia de npm:

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
maestro --version
```

`npm run test:e2e` lee `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` desde `.env` e invoca Maestro. Requiere la app instalada en el simulador de iOS (`npm run ios`), Metro corriendo y el backend de desarrollo (`.env.development`) levantado. Es exclusivo de simulador iOS, local, y no corre en CI — ver `specs/12-tests-e2e-maestro.md`.

## Release (iOS / TestFlight)

Los builds de producción para iOS y la publicación a TestFlight corren en EAS Workflows, disparados al pushear un tag de versión (`vX.Y.Z`) sobre `main`, tras subir `expo.version` en `app.json`. Ver `specs/14-cd-release-testflight.md` y la sección "Release" de `CLAUDE.md` para el detalle del flujo y los prerrequisitos (variables de entorno en EAS, Apple Developer Program, App Store Connect).
