# Spec 08 — Infraestructura de tests y primera batería

- **Estado:** Approved
- **Dependencias:**
  - Ninguna spec previa la bloquea. Cubre el código introducido por las specs 01–07
    (auth, categorías, ejercicios, histórico de pesos) tal como está hoy.
  - Spec `09` (paralela): corrige los bugs que esta spec deja documentados en tests.
- **Fecha:** 2026-08-05

**Objetivo:** Montar Jest (`jest-expo`) + React Native Testing Library en el proyecto
y escribir una primera batería de tests unitarios y de integración sobre `core/`,
`helpers/` y `presentation/`, documentando el comportamiento actual sin modificarlo.

---

## Alcance

### Incluye

**Infraestructura**

- Instalar dev dependencies de testing en las versiones que resuelvan para
  RN 0.86 / React 19.2: `jest`, `jest-expo`, `@testing-library/react-native`,
  `@types/jest` y `axios-mock-adapter` (este último solo para los interceptors).
- `jest.config.js` en la raíz: preset `jest-expo`, `moduleNameMapper` para el
  alias `@/*`, `setupFilesAfterEnv` apuntando a `jest.setup.ts` y el
  `transformIgnorePatterns` que `jest-expo` exige para los módulos de Expo/RN.
- `jest.setup.ts` con los mocks globales: `expo-secure-store`, `expo-router`
  (`router.back` / `router.navigate`) y `Alert.alert` de React Native.
- Scripts en `package.json`: `test`, `test:watch`, `test:coverage`.
- Ajuste de `eslint.config.js` para reconocer los globals de Jest en los
  archivos de test (hoy `describe` / `expect` darían `no-undef`).

**Batería de tests** (archivos en `__tests__/` dentro de cada carpeta, `describe`/`it` en inglés)

- Funciones puras: `core/api/resolveApiUrl.ts`, y `toKg` / `toDisplayWeight` de
  `core/weight-history/interfaces/weight-history.interface.ts`.
- Acciones con el módulo `@/core/api/mgpApi` mockeado vía `jest.mock`:
  `auth-actions`, `get-categories-by-user`, `create-update-category`,
  `delete-category`, `create-exercise` (incluido el armado del `FormData` y la
  imagen condicional), `get/create/update/delete-weight-history`,
  `delete-exercise`, `update-exercise-image`.
- Interceptors de `core/api/mgpApi.ts` con `axios-mock-adapter` sobre la
  instancia real: header `Authorization: Bearer` presente/ausente y
  401 → `logout` (spec 05).
- `helpers/adapters/secure-storage.adapter.ts`: cache, fallos de SecureStore.
- `presentation/auth/store/useAuthStore.ts`: login OK, login fallido, logout.
- Hooks con React Query (`QueryClientProvider` de test, `retry: false`):
  `useWeightHistoryManager`, `useCategory`, `useExerciseActions`.

### No incluye

- Tests E2E automatizados (Maestro, Detox o `agent-device`) — spec propia si entra.
- Tests de las pantallas de `app/` (rutas de Expo Router).
- Tests de componentes visuales de `presentation/` (`WeightHistory`,
  `WeightProgressChart`, `Themed*`) — se prueba la lógica, no el render.
- Los hooks `useCategories` (wrapper trivial de `useQuery` sin lógica propia),
  `useDeleteExercise` (su flujo de borrado ya queda cubierto vía
  `useExerciseActions`) y `usePickExerciseImage` (depende de
  `expo-image-picker`, que exigiría sumar otro mock global a `jest.setup.ts`;
  su rama "sin imagen" ya se ejercita en el test de `changeImage` de
  `useExerciseActions`). Omitidos a propósito; si alguno gana lógica propia,
  entra en una spec futura.
- Snapshot testing.
- Integración con CI / GitHub Actions — decidido: por ahora solo local.
- Umbral mínimo de cobertura en `jest.config.js`.
- Corregir los bugs que los tests documenten — eso es la spec 09.
- Tests contra el backend real; todas las llamadas HTTP están mockeadas.

---

## Modelo de datos

Esta spec no introduce estructuras de datos de dominio nuevas ni toca el backend.
Reutiliza los modelos de las specs 01–07. Sí define dos utilidades compartidas de
test, en una carpeta `test-utils/` en la raíz (fuera del bundle de la app):

**1. `test-utils/query-wrapper.tsx`** — wrapper de React Query para probar hooks
con `renderHook`, con reintentos desactivados para que los tests de error no
esperen backoff:

```tsx
// createQueryWrapper(): ({ children }) => JSX
// QueryClient nuevo por test, con defaultOptions:
//   queries:   { retry: false, gcTime: 0 }
//   mutations: { retry: false }
```

**2. `test-utils/fixtures.ts`** — objetos de dominio de ejemplo, tipados con las
interfaces reales para que un cambio de modelo rompa el fixture en compilación:

```ts
// authResponse: AuthResponse   — respuesta de /auth/login
// category:     Category
// weightHistoryApiEntries: WeightHistoryApiEntry[]
//   — 3 entradas en unidades mixtas (kg y lb) y en orden cronológico
//     desordenado a proposito, para ejercitar el select de useWeightHistoryManager
```

Convenciones:

- Los fixtures se exportan como funciones factory (`buildCategory(overrides?)`)
  y no como constantes compartidas, para que ningún test mute el objeto de otro.
- Las fechas de los fixtures son ISO fijas y literales, nunca `new Date()`, para
  que los tests de ordenamiento sean deterministas.

---

## Plan de implementación

Cada paso deja el proyecto con `npm test` y `npm run lint` en verde, y es
commiteable por sí solo.

1. **Infraestructura mínima.** Instalar `jest`, `jest-expo`,
   `@testing-library/react-native`, `@types/jest` y `axios-mock-adapter` como
   devDependencies (`npx expo install jest-expo jest @types/jest -- --save-dev`
   donde aplique — el `--` pasa el flag al package manager — para respetar SDK 57).
   Crear `jest.config.js` (preset `jest-expo`, `moduleNameMapper` del alias `@/*`,
   `setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"]`, `transformIgnorePatterns`
   de jest-expo) y `jest.setup.ts` con los mocks globales de `expo-secure-store`,
   `expo-router` y `Alert.alert`. Añadir los scripts `test`, `test:watch`,
   `test:coverage`. Ajustar `eslint.config.js` para los globals de Jest.
   Verificación: un test trivial de `resolveApiUrl` pasa con `npm test` y
   `npm run lint` no reporta errores nuevos.
   Commit: `chore: set up jest and react native testing library`.

2. **Funciones puras.** `core/api/__tests__/resolveApiUrl.test.ts` (stage prod vs
   dev, selección iOS/Android por plataforma, y el caso de URL ausente) y
   `core/weight-history/interfaces/__tests__/weight-history.interface.test.ts`
   (`toKg` redondeando a 2 decimales, `toDisplayWeight` en kg, lb y g).
   Commit: `test: cover pure helpers for api url and weight conversion`.

3. **Fixtures + primera acción.** Crear `test-utils/fixtures.ts` con las factories
   (`buildAuthResponse`, `buildCategory`, `buildWeightHistoryApiEntries`) y
   `core/auth/actions/__tests__/auth-actions.test.ts`: `authLogin` pasa el email a
   minúsculas antes del POST, separa `token` de `user` en la respuesta, y devuelve
   `null` cuando el request falla; `authCheckStatus` igual contra
   `/auth/check-status`. Este paso fija el patrón de `jest.mock("@/core/api/mgpApi")`
   que los siguientes reutilizan.
   Commit: `test: cover auth actions`.

4. **Resto de acciones.** Un archivo de test por acción, mismo patrón del paso 3:
   `get-categories-by-user`, `create-update-category` (incluido su branch no-op de
   update, documentado tal como está hoy), `delete-category`, `create-exercise`
   (el `FormData` lleva `name`/`weight`/`weightUnit`/`category`, adjunta `image`
   solo si viene en el payload, y propaga el `message` del response en el error),
   `get/create/update/delete-weight-history`, `delete-exercise` y
   `update-exercise-image`. Cada uno cubre el caso feliz (URL, método y payload
   correctos) y el de error (la acción lanza `Error`).
   Commit: `test: cover category, exercise and weight history actions`.

5. **Interceptors de `mgpApi`.** `core/api/__tests__/mgpApi.test.ts` con
   `axios-mock-adapter` sobre la instancia real (sin `jest.mock` del módulo):
   una petición normal lleva `Authorization: Bearer <token>`, una a `/auth/login`
   no lo lleva, sin token en storage tampoco lo lleva, y un 401 fuera de
   `/auth/login` dispara `logout()` en el store mientras un 401 en `/auth/login`
   no lo dispara.
   Commit: `test: cover mgpApi request and response interceptors`.

6. **`SecureStorageAdapter`.** `helpers/adapters/__tests__/secure-storage.adapter.test.ts`:
   `getItem` con valor en cache no llama a `SecureStore`, `getItem` sin cache lee y
   cachea, `setItem` que falla revierte la entrada de cache y muestra `Alert`,
   `deleteItem` limpia cache y storage. La cache es estática: cada test limpia su
   clave para no filtrar estado al siguiente.
   Commit: `test: cover secure storage adapter cache behavior`.

7. **`useAuthStore`.** `presentation/auth/store/__tests__/useAuthStore.test.ts` con
   `auth-actions` mockeado: login exitoso deja `status: "authenticated"` con user y
   token y persiste el token; login fallido (acción devuelve `null`) deja
   `unauthenticated` y borra el token; `logout` limpia estado y storage;
   `checkStatus` resuelve a `authenticated` o `unauthenticated` según la respuesta.
   Cada test resetea el store a su estado inicial. Ojo: `changeStatus` persiste el
   token con `void SecureStorageAdapter.setItem(...)` sin `await`, así que la
   aserción sobre la persistencia va con `waitFor`, no directa tras el `await`
   del `login`.
   Commit: `test: cover auth store status transitions`.

8. **Wrapper de React Query + `useWeightHistoryManager`.** Crear
   `test-utils/query-wrapper.tsx` y
   `presentation/weight-history/hooks/__tests__/useWeightHistoryManager.test.tsx`:
   el `select` normaliza a kg y ordena de más reciente a más antiguo,
   `latestWeightEntry` es la entrada más reciente, `saveEntry` sin `entryId` llama a
   `createWeightHistory` y con `entryId` a `updateWeightHistory`, un error de
   mutación dispara `Alert.alert`, y un `onSuccess` invalida
   `["weight-history", exerciseId]`.
   Commit: `test: cover weight history manager hook`.

9. **Hooks restantes.** `useCategory` (la mutación invalida `["categories"]` y
   muestra el Alert de éxito) y `useExerciseActions` (`remove` invalida
   `["categories"]`, llama a `router.back()` y alerta; `changeImage` no muta si el
   picker no devuelve imagen; un error de mutación alerta).
   Commit: `test: cover category and exercise action hooks`.

10. **Cierre.** Correr `npm run test:coverage` y revisar que las rutas del alcance
    estén cubiertas. Actualizar `CLAUDE.md`: la línea "There is no test runner
    configured in this project" ya no es cierta — reemplazarla por los comandos
    `npm test` / `npm run test:watch` / `npm run test:coverage` y una nota de
    dónde viven los tests y el patrón de mock de `mgpApi`.
    Commit: `docs: document testing setup in CLAUDE.md`.

---

## Criterios de aceptación

- [ ] `npm test` corre la suite completa y termina en verde, sin tests marcados
      como `skip` ni `todo`.
- [ ] `npm run test:watch` y `npm run test:coverage` existen en `package.json` y
      funcionan.
- [ ] `npm run lint` pasa sin errores nuevos, incluidos los archivos de test
      (nada de `describe`/`expect` marcados como `no-undef`).
- [ ] `npx tsc --noEmit` pasa: los archivos de test y los fixtures compilan contra
      las interfaces reales del dominio.
- [ ] Ningún test hace una petición HTTP real: la suite pasa igual con el backend
      apagado y sin `.env` presente.
- [ ] Existe un archivo de test por cada unidad listada en el alcance: 2 de
      funciones puras, 11 de acciones, 1 de interceptors, 1 del adapter, 1 del
      store y 3 de hooks.
- [ ] El test de `create-update-category` documenta el comportamiento actual: con
      un `id` distinto de `"new"` la acción **crea** en vez de actualizar.
- [ ] El test de `auth-actions` documenta que `authLogin` devuelve `null` ante un
      error del API, en vez de lanzar.
- [ ] El test de interceptors verifica los cuatro casos: header presente en una
      ruta normal, ausente en `/auth/login`, ausente sin token en storage, y
      401 fuera de `/auth/login` disparando `logout()`.
- [ ] El test de `useWeightHistoryManager` verifica que 3 entradas en unidades
      mixtas y desordenadas salen del `select` en kg y ordenadas de más reciente a
      más antigua.
- [ ] La suite es determinista: 10 corridas seguidas de `npm test` dan el mismo
      resultado, y `npm test -- --randomize` (orden aleatorio) también pasa.
- [ ] Ningún archivo de `app/`, `core/`, `presentation/` o `helpers/` cambió su
      comportamiento: el `git diff` acumulado, fuera de los archivos de test,
      `test-utils/`, `jest.config.js`, `jest.setup.ts`, `eslint.config.js`,
      `package.json` y `CLAUDE.md`, está vacío.
- [ ] `CLAUDE.md` ya no dice que no hay test runner configurado.

---

## Decisiones

- **Sí:** `jest-expo` como preset. Es el preset oficial de Expo; trae el
  `transformIgnorePatterns` que los módulos de Expo/RN necesitan y los mocks
  nativos base. Cualquier otra configuración implica pelearse a mano con la
  transformación de `node_modules`.
- **No:** Vitest. Más rápido, pero el ecosistema de React Native asume Jest y
  `jest-expo` no tiene equivalente; el ahorro de segundos no paga la configuración
  manual del entorno nativo.
- **Sí:** unitarios y de integración en esta spec, E2E en otra. Los unitarios
  corren en cualquier máquina en segundos y no dependen de simulador ni backend;
  los E2E requieren decisiones propias (herramienta, datos de prueba, entorno) que
  merecen su propia fase de preguntas.
- **Sí:** `jest.mock("@/core/api/mgpApi")` como estrategia de mock por defecto.
  Todas las acciones pasan por esa única instancia de axios, así que un solo mock
  cubre toda la capa `core/*/actions` sin servidor de por medio.
- **No:** `msw`. Es el mock más fiel, pero su setup en React Native es
  notablemente más pesado y aquí no hay nada que ganar: no probamos serialización
  HTTP, probamos qué URL y qué payload arma cada acción.
- **Sí:** `axios-mock-adapter` como excepción, solo para `mgpApi.test.ts`. Los
  interceptors son el único código que el mock del módulo hace invisible, y ahí
  vive lógica crítica: el `Authorization: Bearer` de toda la app y el 401 → logout
  de la spec 05. Un archivo de test con otra herramienta es más barato que dejar
  eso sin cubrir.
- **Sí:** tests colocados en `__tests__/` dentro de cada carpeta. El test viaja
  con el código que prueba y encaja con la organización por feature de `core/` y
  `presentation/`.
- **No:** carpeta `tests/` espejo en la raíz. Duplica el árbol y obliga a mantener
  dos estructuras en sincronía cada vez que algo se mueve.
- **Sí:** los tests documentan el comportamiento **actual**, bugs incluidos. Si la
  spec arreglara mientras testea, no habría forma de saber si un test rojo es un
  bug nuevo o una expectativa que aún no se cumplía. Las correcciones van en la
  spec 09, que arranca con la red de seguridad ya puesta.
- **No:** marcar los bugs conocidos con `test.todo` o `it.skip`. Un test saltado se
  vuelve invisible; un test que afirma el comportamiento actual es documentación
  ejecutable y falla de inmediato cuando la spec 09 lo corrija, que es justo la
  señal que se quiere.
- **Sí:** fixtures como factories con overrides (`buildCategory({ name: "X" })`).
  Las constantes compartidas se mutan entre tests y producen fallos que dependen
  del orden de ejecución.
- **Sí:** `QueryClient` nuevo por test, con `retry: false` y `gcTime: 0`. Un
  cliente compartido filtra cache entre tests, y con reintentos activos cada test
  de error espera el backoff de React Query.
- **No:** umbral de cobertura en `jest.config.js` por ahora. Con la suite recién
  nacida, un porcentaje mínimo solo empuja a escribir tests que suben la métrica;
  se puede añadir más adelante, cuando haya una línea base real.
- **No:** CI en GitHub Actions en esta spec. Decisión explícita: por ahora solo
  local. Cuando entre, es un `.yml` de pocas líneas sobre esta misma base.
- **No:** tests de las pantallas de `app/`. Son rutas de Expo Router con mucha UI y
  poca lógica propia; la lógica que importa ya vive en los hooks, que sí se
  prueban. Testear pantallas es caro de mantener y frágil ante cambios de layout.
- **No:** snapshot testing. Los snapshots de un árbol de React Native rompen ante
  cualquier cambio cosmético y casi nunca detectan un bug real.
- **Sí:** `describe`/`it` en inglés, aunque las specs y los mensajes de UI estén en
  español. Es la convención del ecosistema y hace que los nombres se lean
  naturales con `it("returns null when the request fails")`.

---

## Riesgos

| Riesgo                                                                                                                                                                                                                                    | Mitigación                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jest-expo` y `@testing-library/react-native` en versiones no alineadas con RN 0.86 / React 19.2 (RNTL 13 exige `react-test-renderer` 19) — es el punto donde más setups se atascan                                                       | Instalar con `npx expo install ... -- --save-dev` para que Expo resuelva la versión compatible con SDK 57; el paso 1 del plan termina con un test trivial en verde justamente para detectar esto antes de escribir 19 archivos de test. |
| La cache de `SecureStorageAdapter` es `static`: persiste entre tests del mismo archivo y contamina el siguiente                                                                                                                           | El paso 6 limpia la clave usada en cada test; el criterio de `--randomize` en los criterios de aceptación es el que verifica que no quedó estado filtrado.                                                                              |
| El import dinámico de `useAuthStore` dentro del interceptor de 401 (`await import(...)`, puesto ahí para romper un ciclo de dependencias) puede resolver después de que el test terminó, dando un falso verde                             | En `mgpApi.test.ts` esperar el efecto con `waitFor` sobre el estado del store, nunca aserción directa tras el `await` del request.                                                                                                      |
| Tests que dependen de la fecha actual (orden del histórico, formateo) se vuelven flaky al cambiar de día o de zona horaria                                                                                                                | Fechas ISO fijas y literales en los fixtures, nunca `new Date()` — ya está fijado en el modelo de datos.                                                                                                                                |
| Un `EXPO_PUBLIC_*` ausente en el entorno de test hace fallar el import de `mgpApi.ts`, que evalúa `resolveApiUrl` a nivel de módulo                                                                                                       | El test de `resolveApiUrl` prueba la función pura con parámetros explícitos, no el módulo; y el criterio "la suite pasa sin `.env`" obliga a que esto quede resuelto (valor por defecto en `jest.setup.ts` si hiciera falta).           |
| `changeStatus` del store persiste el token con `void SecureStorageAdapter.setItem(...)` sin `await`: una aserción directa tras `await login(...)` puede correr antes de que el mock de SecureStore reciba la llamada, dando un test flaky | En el paso 7, la aserción sobre persistencia del token usa `waitFor`; misma técnica que ya exige el riesgo del import dinámico del 401.                                                                                                 |

---

## Qué **no** está en esta spec

- Tests E2E automatizados (Maestro, Detox o `agent-device`).
- Tests de las pantallas de `app/` y de los componentes visuales de `presentation/`.
- Snapshot testing.
- CI en GitHub Actions y umbral mínimo de cobertura.
- Corregir los bugs que estos tests dejan documentados — eso es la spec 09.

Cada una de esas, si algún día entra, va en su propia spec.
