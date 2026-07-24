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

Las variables de entorno se leen desde un archivo `.env` (no versionado) usando el prefijo `EXPO_PUBLIC_*`:

- `EXPO_PUBLIC_STAGE` — `"dev"` o `"prod"`
- `EXPO_PUBLIC_API_URL` — URL de la API usada cuando `STAGE === "prod"`
- `EXPO_PUBLIC_API_URL_IOS` / `EXPO_PUBLIC_API_URL_ANDROID` — URLs usadas en desarrollo, seleccionadas según la plataforma

## Instalación

```bash
npm install
```

## Comandos

```bash
npm run start          # levanta el servidor de desarrollo de Expo
npm run ios            # expo start --ios
npm run android        # expo start --android
npm run web             # expo start --web
npm run lint            # expo lint
npm run reset-project   # mueve app/ a app-example/ y crea un app/ en blanco (no ejecutar salvo que se indique)
```

Actualmente el proyecto no tiene un test runner configurado.
