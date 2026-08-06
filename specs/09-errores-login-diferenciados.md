# Spec 09 — Errores de login diferenciados

- **Estado:** Approved
- **Dependencias:**
  - Spec `08-infraestructura-tests.md` — se implementa **después**. Los tests de
    `auth-actions` y `useAuthStore` que la 08 deja escritos documentan el
    comportamiento que esta spec cambia, así que se actualizan en el mismo commit
    del fix.
  - Spec `05-manejo-sesion-expirada.md` — el flujo de sesión expirada
    (`authCheckStatus` + interceptor 401) no se toca; esta spec solo cubre el login
    explícito.
- **Fecha:** 2026-08-05

**Objetivo:** Hacer que `authLogin` distinga credenciales inválidas de un fallo de
red o de servidor, y que la pantalla de login muestre un mensaje distinto para cada
caso en vez del actual "Usuario o contraseña no son correctos" para todo.

---

## Alcance

### Incluye

- Un tipo de resultado para el login en `core/auth/interface/`: unión discriminada
  con el caso de éxito (`user` + `token`) y el de fallo con una razón tipada
  (`"invalid-credentials" | "network" | "unknown"`).
- `authLogin` en `core/auth/actions/auth-actions.ts` deja de devolver `null` ante un
  error: clasifica con `isAxiosError` y devuelve el resultado tipado. Se elimina el
  `console.log(error)` del catch.
- `useAuthStore.login` deja de devolver `boolean` y devuelve la unión
  `{ ok: true } | { ok: false; reason }`, propagando la razón sin reinterpretarla.
  El fallo sigue pasando por `changeStatus(undefined, undefined)` para dejar el
  estado en `unauthenticated` y limpiar el token.
- `app/auth/login/index.tsx` mapea cada razón a su mensaje y muestra el Alert
  correspondiente. Los tres mensajes quedan en un `Record` a nivel de módulo, no
  incrustados en el handler.
- Actualización de los tests que la spec 08 dejó escritos para el comportamiento
  viejo: `core/auth/actions/__tests__/auth-actions.test.ts` y
  `presentation/auth/store/__tests__/useAuthStore.test.ts`, más los casos nuevos
  de cada razón de fallo.

### No incluye

- `authCheckStatus`: sigue devolviendo `null` ante cualquier fallo. Ahí el `null`
  es semánticamente correcto ("no hay sesión válida") y el 401 es el flujo normal
  de sesión expirada de la spec 05.
- El interceptor de respuesta de `mgpApi` y el logout automático por 401.
- La pantalla de registro (`app/auth/register/index.tsx`) y el
  `// TODO: Tarea: Hacer el register` — queda pendiente sin spec, por decisión
  explícita.
- El no-op de update en `create-update-category.action.ts` — queda pendiente sin
  spec, por decisión explícita.
- Unificar la convención de errores del resto de acciones (`categories`,
  `exercises`, `weight-history` lanzan `Error`); esta spec solo cambia `authLogin`.
- Reintentos automáticos, backoff o detección de conectividad con
  `@react-native-community/netinfo`: "network" se infiere de la ausencia de
  `error.response`, nada más.
- Cambios de UI más allá del texto del Alert (nada de banners, estados inline ni
  rediseño del formulario de login).
- Cambios en el backend.

---

## Modelo de datos

No hay cambios de backend ni de datos persistidos. Se introducen dos tipos nuevos
en `core/auth/interface/login-result.ts`:

```ts
export type LoginFailureReason =
  | "invalid-credentials" // el backend respondió 400 o 401
  | "network" // axios no obtuvo respuesta (sin red, DNS, timeout, server caído)
  | "unknown"; // hubo respuesta, pero no es un fallo de credenciales (5xx y demás)

// Lo que devuelve authLogin: en éxito arrastra los datos de sesión.
export type AuthLoginResult =
  | { ok: true; user: User; token: string }
  | { ok: false; reason: LoginFailureReason };

// Lo que devuelve useAuthStore.login: la pantalla no necesita user ni token,
// ya quedaron en el store.
export type LoginResult =
  | { ok: true }
  | { ok: false; reason: LoginFailureReason };
```

Y un mapa de mensajes a nivel de módulo en `app/auth/login/index.tsx`:

```ts
const LOGIN_ERROR_MESSAGES: Record<LoginFailureReason, string> = {
  "invalid-credentials": "Usuario o contraseña no son correctos",
  network: "No pudimos conectar. Revisa tu conexión e intenta de nuevo.",
  unknown: "Algo salió mal. Intenta de nuevo en un momento.",
};
```

Convenciones:

- La clasificación del error ocurre **una sola vez**, en `authLogin`. Ni el store
  ni la pantalla vuelven a mirar el error de axios.
- `LOGIN_ERROR_MESSAGES` es un `Record` sobre `LoginFailureReason`: agregar una
  razón nueva sin su mensaje es un error de compilación, no un texto vacío en
  runtime.

---

## Plan de implementación

Los tres primeros pasos van juntos en un solo commit: el cambio de firma de
`authLogin` rompe la compilación de `useAuthStore` y de la pantalla de login, así
que partirlos dejaría el proyecto sin compilar entre commits.

1. **Tipos.** Crear `core/auth/interface/login-result.ts` con `LoginFailureReason`,
   `AuthLoginResult` y `LoginResult`. Nada los usa todavía; el proyecto compila
   igual.

2. **`authLogin`.** En `core/auth/actions/auth-actions.ts`:
   - Firma `Promise<AuthLoginResult>`.
   - Éxito: `{ ok: true, ...returnUserToken(data) }`.
   - Catch: clasificar con `isAxiosError` — sin `error.response` → `"network"`;
     status 400 o 401 → `"invalid-credentials"`; cualquier otro → `"unknown"`.
     Un error que no sea de axios también cae en `"unknown"`.
   - Eliminar el `console.log(error)`.
   - `authCheckStatus` y `returnUserToken` no se tocan.

3. **Store y pantalla.**
   - `useAuthStore.login` pasa a `Promise<LoginResult>`: si el resultado es
     `ok: false`, llama a `changeStatus(undefined, undefined)` (deja
     `unauthenticated` y borra el token) y devuelve `{ ok: false, reason }`; si es
     `ok: true`, llama a `changeStatus(token, user)` y devuelve `{ ok: true }`.
     `AuthState` refleja la firma nueva.
   - `app/auth/login/index.tsx`: añadir `LOGIN_ERROR_MESSAGES` a nivel de módulo;
     en `onLogin`, con `result.ok` navegar a `/` y si no, `Alert.alert("Error",
LOGIN_ERROR_MESSAGES[result.reason])`.
   - Verificación: `npx tsc --noEmit` pasa y `npm run lint` no reporta errores
     nuevos.
     Commit (pasos 1–3): `fix: distinguish invalid credentials from network errors on login`.

4. **Tests.** Actualizar los que la spec 08 dejó escritos para el comportamiento
   viejo y añadir los casos nuevos:
   - `core/auth/actions/__tests__/auth-actions.test.ts`: el caso "returns null when
     the request fails" se reemplaza por tres — 401 → `invalid-credentials`,
     error sin `response` → `network`, 500 → `unknown` — más el de éxito con
     `ok: true`. Los tests de `authCheckStatus` quedan intactos, y eso es
     deliberado.
   - `presentation/auth/store/__tests__/useAuthStore.test.ts`: login exitoso
     devuelve `{ ok: true }` y deja `status: "authenticated"`; login fallido
     devuelve la razón y deja `unauthenticated` con el token borrado.
     Verificación: `npm test` en verde.
     Commit: `test: cover login failure reasons`.

5. **Verificación manual en iOS** (dev build), los tres caminos:
   - Credenciales incorrectas contra el backend levantado → "Usuario o contraseña
     no son correctos".
   - Backend apagado (o URL de API inalcanzable) → "No pudimos conectar. Revisa tu
     conexión e intenta de nuevo.".
   - Credenciales correctas → entra a la app como siempre.
     El tercer caso es el que importa: es la regresión que este cambio podría
     introducir.

---

## Criterios de aceptación

- [ ] Con el backend levantado y credenciales incorrectas, el login muestra
      "Usuario o contraseña no son correctos".
- [ ] Con el backend apagado o inalcanzable, el login muestra "No pudimos conectar.
      Revisa tu conexión e intenta de nuevo." — no el mensaje de credenciales.
- [ ] Con credenciales correctas, el login entra a la app exactamente igual que
      antes de esta spec (sin pasos ni pantallas nuevas).
- [ ] Tras un login fallido de cualquier tipo, `useAuthStore` queda en
      `status: "unauthenticated"`, sin `user` ni `token`, y el token fue borrado
      de `SecureStorageAdapter`.
- [ ] `authLogin` ya no devuelve `null` en ningún camino, y su catch ya no tiene
      `console.log`.
- [ ] La clasificación del error ocurre solo en `authLogin`: ni `useAuthStore` ni
      `app/auth/login/index.tsx` importan nada de `axios`.
- [ ] `authCheckStatus` no cambió: sigue devolviendo `null` ante cualquier fallo, y
      sus tests de la spec 08 pasan sin modificarse.
- [ ] El interceptor de 401 de `mgpApi` y el logout automático siguen funcionando:
      los tests de `mgpApi.test.ts` de la spec 08 pasan sin modificarse.
- [ ] `npm test` está en verde y no queda ningún test que afirme el comportamiento
      viejo (`authLogin` devolviendo `null`).
- [ ] La suite cubre las tres razones de fallo: 401 → `invalid-credentials`, error
      sin `response` → `network`, 500 → `unknown`.
- [ ] `npx tsc --noEmit` pasa, y añadir una razón a `LoginFailureReason` sin su
      entrada en `LOGIN_ERROR_MESSAGES` produce error de compilación (verificable
      a mano una vez).
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] El `git diff` de esta spec toca únicamente: `login-result.ts` (nuevo),
      `auth-actions.ts`, `useAuthStore.ts`, `app/auth/login/index.tsx` y los dos
      archivos de test correspondientes.

---

## Decisiones

- **Sí:** unión discriminada como valor de retorno (`{ ok: true } | { ok: false;
reason }`). Un login con credenciales malas no es una excepción: es un resultado
  esperado del flujo. Modelarlo como valor obliga a la pantalla a considerar el
  caso de fallo para compilar.
- **No:** que `authLogin` lance `Error` como el resto de las acciones. Sería
  consistente con `categories` / `exercises` / `weight-history`, pero obligaría a
  la UI a distinguir el motivo leyendo el mensaje del error (comparar strings) o a
  crear una jerarquía de clases de error para un solo caso de uso. La
  inconsistencia de convención se acepta a cambio de eso, y queda anotada aquí.
- **No:** guardar el error en el store (`lastError`) y que la pantalla lo lea. Es
  estado global que hay que limpiar entre intentos; olvidar limpiarlo muestra el
  error del intento anterior. El valor de retorno no tiene ciclo de vida.
- **No:** dejar que el error de axios llegue hasta la pantalla y clasificarlo ahí.
  Metería detalles de transporte HTTP en la capa de UI, que es justo lo que la
  separación `core/` ↔ `app/` de este proyecto evita.
- **Sí:** clasificar con `isAxiosError` dentro de `authLogin`, una sola vez. Es la
  única capa que ya conoce axios.
- **Sí:** 400 y 401 cuentan como `invalid-credentials`. El backend responde 401,
  pero un 400 por payload rechazado en el endpoint de login también es, desde el
  usuario, "esos datos no sirven".
- **Sí:** "network" se infiere de la ausencia de `error.response`. Cubre sin red,
  DNS caído, timeout y servidor apagado con una sola condición y sin dependencias
  nuevas.
- **No:** `@react-native-community/netinfo` para detectar conectividad real. Una
  dependencia nativa más, permisos en Android y un estado que puede mentir
  igual (WiFi conectado sin salida a internet), para afinar un mensaje de error.
- **Sí:** 5xx cae en `unknown` con un mensaje genérico. Distinguir "el servidor
  falló" de "algo raro pasó" no cambia lo que el usuario puede hacer: reintentar.
- **No:** tocar `authCheckStatus`. Su `null` significa "no hay sesión válida", que
  es correcto, y su 401 es el flujo de sesión expirada de la spec 05. Cambiarlo por
  simetría rompería un comportamiento que ya funciona.
- **Sí:** `LOGIN_ERROR_MESSAGES` como `Record<LoginFailureReason, string>` en la
  pantalla. Una razón nueva sin mensaje no compila; con un `switch` y `default`
  pasaría silenciosa con el texto genérico.
- **Sí:** los textos de error viven en `app/`, no en `core/`. `core/` devuelve la
  razón; la copia es decisión de presentación.
- **Sí:** implementar después de la spec 08, actualizando sus tests en el mismo
  commit. Los tests que documentaban `authLogin` devolviendo `null` deben ponerse
  rojos con este cambio: esa es la señal de que el comportamiento cambió a
  propósito y no por accidente.
- **Sí:** los pasos 1–3 del plan en un único commit. El cambio de firma rompe
  `useAuthStore` y la pantalla de login; commitear por separado dejaría el
  proyecto sin compilar en medio del historial.

---

## Riesgos

| Riesgo                                                                                                                                                                                                                                                                              | Mitigación                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regresión en el camino feliz: `login` cambia de `boolean` a objeto, y `if (result)` sobre un objeto es **siempre verdadero** — un fallo de login entraría a la app con el estado en `unauthenticated`, y el layout `(mgp-app)` rebotaría al usuario a `/auth/login` sin explicación | TypeScript atrapa el cambio de tipo en `app/auth/login/index.tsx`, que es el único llamador (verificado: `login` solo se usa ahí). El criterio de aceptación del login exitoso y la verificación manual del paso 5 lo confirman en vivo. |
| El backend responde a credenciales malas con un status distinto de 400/401 (p. ej. 403 o un 200 con cuerpo de error) y el usuario ve "Algo salió mal" en vez del mensaje de credenciales                                                                                            | El paso 5 del plan prueba credenciales incorrectas contra el backend real; si el status no es el esperado, se ajusta la clasificación en `authLogin` (un solo lugar).                                                                    |
| Alguien "arregla por simetría" `authCheckStatus`, que tiene la misma forma y sí debe seguir devolviendo `null`                                                                                                                                                                      | Está en "No incluye", en las decisiones y en los criterios de aceptación ("sus tests pasan sin modificarse"). Tres avisos en el mismo documento.                                                                                         |
| Los tests de la spec 08 se actualizan "para que pasen" sin verificar que el comportamiento nuevo es el correcto                                                                                                                                                                     | El paso 4 del plan enumera exactamente qué casos reemplazan al viejo (`401`, sin `response`, `500`), en vez de dejar "actualizar los tests".                                                                                             |

---

## Qué **no** está en esta spec

- `authCheckStatus` y el flujo de sesión expirada de la spec 05.
- El interceptor de 401 de `mgpApi`.
- La pantalla de registro y el `// TODO: Tarea: Hacer el register` — pendiente sin
  spec, por decisión explícita.
- El no-op de update en `create-update-category.action.ts` — pendiente sin spec,
  por decisión explícita.
- Unificar la convención de errores del resto de las acciones.
- Detección real de conectividad y reintentos automáticos.
- Cualquier cambio de UI del login más allá del texto del Alert.

Cada una de esas, si algún día entra, va en su propia spec.
