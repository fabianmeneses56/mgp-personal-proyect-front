# Spec 05 — Manejo de sesión expirada

- **Estado:** Implemented
- **Dependencias:**
  - Backend spec `03-extender-expiracion-jwt.md` — el JWT pasa de expirar en `2h` a `30d`
- **Fecha:** 2026-07-11

**Objetivo:** Detectar cuando el token de sesión ya no es válido (por expiración o por invalidación en el backend) y cerrar la sesión automáticamente con redirect silencioso a login, tanto al recibir un 401 de cualquier petición como al volver la app a primer plano.

---

## Alcance

### Incluye

- Interceptor de **respuesta** en `core/api/mgpApi.ts`: ante cualquier `401` cuya `config.url` no incluya `/auth/login`, dispara logout de sesión (limpieza de token + `status: "unauthenticated"` en el store) y deja que el `<Redirect>` ya existente en `(mgp-app)/_layout.tsx` lleve al usuario a `/auth/login`.
- El logout se dispara con `useAuthStore.getState().logout()`, importado de forma dinámica (`await import(...)`) dentro del handler del interceptor para evitar el ciclo de imports `mgpApi.ts` → `useAuthStore.ts` → `auth-actions.ts` → `mgpApi.ts`.
- `AppState` listener agregado en `(mgp-app)/_layout.tsx`: cuando la app pasa a `active` y el `status` actual del store es `"authenticated"`, se vuelve a llamar `checkStatus()` (sin umbral de tiempo mínimo en background). Como `authCheckStatus()` ya traga el error y devuelve `null` en caso de 401, esto revalida la sesión al reabrir la app y, si el token venció, la deja en `"unauthenticated"` sin ningún cambio adicional de código en `auth-actions.ts`.
- El listener se limpia (`subscription.remove()`) en el cleanup del `useEffect` correspondiente.

### No incluye

- Refresh tokens ni ningún mecanismo de renovación automática del JWT (descartado en la fase de preguntas — se opta por extender la expiración en el backend en su lugar).
- Ningún `Alert` o mensaje visible al usuario cuando la sesión expira — el redirect es silencioso (decisión ya tomada).
- Cambios en `authLogin` ni en el flujo de login/registro.
- Reintentar automáticamente la petición original que devolvió 401 tras un login exitoso (el usuario simplemente vuelve a intentar la acción después de loguearse de nuevo).
- Cambios al backend (van en la spec `03-extender-expiracion-jwt.md` del repo `mgp-personal-proyect`).

---

## Modelo de datos

Esta spec no introduce estructuras de datos nuevas. Reutiliza:

- El store `useAuthStore` (`status`, `token`, `user`, `logout()`, `checkStatus()`) ya existente en `presentation/auth/store/useAuthStore.ts`.
- La action `authCheckStatus()` ya existente en `core/auth/actions/auth-actions.ts`, cuyo comportamiento actual (capturar el error y devolver `null`) ya es el que necesita el flujo de revalidación al volver de background — no requiere modificación.

---

## Plan de implementación

1. **Modificar `core/api/mgpApi.ts`**: agregar `mgpApi.interceptors.response.use(...)`.
   - En el handler de error: si `axios.isAxiosError(error)`, `error.response?.status === 401`, y `!error.config?.url?.includes("/auth/login")`, hacer `const { useAuthStore } = await import("@/presentation/auth/store/useAuthStore"); useAuthStore.getState().logout();`.
   - Siempre re-lanzar el error (`return Promise.reject(error)`) para que las pantallas que ya manejan errores de sus mutaciones (`Alert.alert`) sigan funcionando igual mientras el redirect ocurre en paralelo.

2. **Modificar `app/(mgp-app)/_layout.tsx`**: importar `AppState` de `react-native` y agregar un segundo `useEffect` que suscribe un listener `AppState.addEventListener("change", ...)`.
   - En el callback: si `nextAppState === "active"` y `useAuthStore.getState().status === "authenticated"`, llamar `checkStatus()`.
   - Cleanup: `subscription.remove()` al desmontar.

3. **Verificación manual**:
   - Loguearse normalmente → la app funciona igual que hoy (sin regresión).
   - Forzar un 401 (ej. borrar/corromper el token guardado en SecureStore manualmente o esperar a que el backend lo invalide) y disparar cualquier petición (ej. abrir una categoría) → la sesión se cierra sola y aparece la pantalla de login, sin `Alert` visible.
   - Con sesión activa, mandar la app a background y volver a foreground → se dispara `checkStatus()`; si el token seguía siendo válido no pasa nada visible; si ya no es válido, redirige a login.
   - Intentar loguear con credenciales incorrectas → sigue mostrando el error de credenciales normal (no se dispara el logout automático, porque `/auth/login` está excluido del interceptor).

---

## Criterios de aceptación

- [ ] Cualquier respuesta `401` de una petición cuya URL no sea `/auth/login` dispara `useAuthStore.getState().logout()`.
- [ ] Tras ese logout automático, el usuario ve la pantalla `/auth/login` sin necesidad de cerrar la app ni de tocar el botón de logout manual.
- [ ] No se muestra ningún `Alert` ni mensaje adicional al usuario cuando la sesión expira — el redirect es silencioso.
- [ ] Un `401` en `/auth/login` (credenciales incorrectas) **no** dispara el logout automático ni el redirect — el flujo de login existente sigue mostrando su propio manejo de error sin cambios.
- [ ] Al volver la app de background a `active` con `status === "authenticated"`, se llama `checkStatus()` automáticamente, sin importar cuánto tiempo estuvo en background.
- [ ] Si `checkStatus()` detecta que el token ya no es válido, el store pasa a `status: "unauthenticated"` y la pantalla redirige a login, sin que el usuario haya interactuado con ninguna pantalla todavía.
- [ ] Si el token sigue siendo válido al volver de background, no hay ningún cambio visible (no hay flicker ni redirect innecesario).
- [ ] El listener de `AppState` se remueve correctamente al desmontar `(mgp-app)/_layout.tsx` (no genera warnings de memory leak ni llamadas duplicadas tras remounts).
- [ ] El login normal y el logout manual (botón existente) siguen funcionando exactamente igual que antes de esta spec.

---

## Decisiones tomadas y descartadas

- **Extender expiración del JWT en vez de refresh tokens** — se descartó implementar un mecanismo de refresh token porque es un esfuerzo bastante mayor (nueva entidad/endpoint en el backend, rotación, storage adicional en el device) para una app personal de uso esporádico; extender a `30d` cubre el caso real reportado ("un día o más") con mucho margen.

- **Import dinámico de `useAuthStore` dentro del interceptor** en vez de importarlo estáticamente al inicio de `mgpApi.ts` — se descartó el import estático porque genera un ciclo de módulos (`mgpApi.ts` → `useAuthStore.ts` → `auth-actions.ts` → `mgpApi.ts`) que puede resolver en `undefined` según el orden de evaluación de Metro; el import dinámico difiere la resolución hasta que el interceptor efectivamente se dispara, momento en el que ambos módulos ya están completamente cargados.

- **Redirect silencioso, sin `Alert`** — decisión explícita del usuario; se descartó mostrar un mensaje de "tu sesión expiró" porque agrega un paso extra sin beneficio claro para una app de un solo usuario.

- **`AppState` listener sin umbral de tiempo mínimo** — se descartó exigir que la app haya estado en background más de X minutos antes de revalidar, porque agrega complejidad de estado (guardar timestamp de cuándo pasó a background) sin beneficio real: la llamada a `/auth/check-status` es barata y no tiene efectos secundarios visibles si el token sigue siendo válido.

- **No reintentar automáticamente la petición original tras el 401** — se descartó por alcance: implementar un retry-after-relogin requeriría interceptar y encolar la petición fallida, mucho más complejo que lo que pide el problema reportado; el usuario simplemente repite la acción después de loguearse de nuevo.

- **`authCheckStatus()` no se modifica** — su comportamiento actual de tragar el error y devolver `null` ya produce el efecto deseado (`status: "unauthenticated"`) cuando se lo llama con un token vencido; no hace falta tocarlo para que el `AppState` listener funcione.

---

## Riesgos identificados

- **Import dinámico como workaround de ciclo de módulos** — si en el futuro se refactoriza `useAuthStore.ts` o `auth-actions.ts` y el ciclo desaparece, se podría volver a un import estático; por ahora, si alguien no conoce la razón del `await import(...)`, podría "simplificarlo" y reintroducir el bug de módulo circular en tiempo de carga. Vale la pena dejar el comentario explicando el porqué en el código.

- **Falsos positivos por errores de red** — el interceptor solo debe reaccionar a `error.response?.status === 401` (respuesta real del servidor), no a errores de timeout/sin conexión (que no traen `error.response`). Si la condición se escribe mal (ej. `!error.response` en vez de chequear el status), un usuario sin internet podría ser deslogueado por error.
