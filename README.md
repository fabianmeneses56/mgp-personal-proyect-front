# MGP — Personal Project (Front)

Aplicación Expo (React Native) para llevar el control de categorías y ejercicios de entrenamiento, con navegación basada en archivos (Expo Router). El backend ("mgp") es una API separada consumida vía axios; este repositorio no contiene código de backend.

## Stack

- [Expo](https://expo.dev) / React Native
- [Expo Router](https://docs.expo.dev/router/introduction) (navegación basada en archivos)
- [React Query](https://tanstack.com/query/latest) para el manejo de datos remotos
- [Zustand](https://github.com/pmndrs/zustand) para estado global (autenticación)
- Axios para el consumo de la API
- `expo-secure-store` para persistencia segura del token de autenticación

## Estructura del proyecto

- **`app/`** — rutas de Expo Router. Las pantallas importan la lógica de negocio y solo la adaptan para mostrarla.
  - `app/auth/` — rutas de login/registro (fuera del grupo autenticado).
  - `app/(mgp-app)/` — grupo autenticado, protegido según el estado de `useAuthStore`.
- **`core/`** — lógica de dominio por feature (`auth`, `categories`, `exercises`): acciones que llaman a la API, interfaces de dominio y el cliente axios compartido (`core/api/mgpApi.ts`).
- **`presentation/`** — hooks (React Query), stores (Zustand) y componentes de UI reutilizables (`Themed*`, temas claro/oscuro).
- **`helpers/adapters/secure-storage.adapter.ts`** — adaptador sobre `expo-secure-store` para persistir el token de autenticación.

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

| Archivo            | Contenido                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `.env`             | Compartido entre todos los modos (`E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`)     |
| `.env.development` | `EXPO_PUBLIC_STAGE=dev` + `EXPO_PUBLIC_API_URL_IOS` / `_ANDROID` (IP local)  |
| `.env.production`  | `EXPO_PUBLIC_STAGE=prod` + `EXPO_PUBLIC_API_URL` (API desplegada)            |

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
npm run lint            # expo lint
npm run reset-project   # mueve app/ a app-example/ y crea un app/ en blanco (no ejecutar salvo que se indique)
```

Actualmente el proyecto no tiene un test runner configurado.
