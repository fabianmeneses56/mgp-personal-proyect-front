# Spec 11 — Alertas centralizadas en `alert.service`

- **Estado:** Approved
- **Dependencias:**
  - Spec `09-errores-login-diferenciados.md` (Approved) — está en curso ahora mismo
    (hay cambios sin commitear en `app/auth/login/index.tsx` y
    `presentation/auth/hooks/useLogin.ts`). Esta spec se implementa **después**, y
    migra el Alert del login tal como quede tras la 09. Si la 09 aún no se ha
    mergeado al implementar esta, se migra el estado actual y la 09 usará el
    servicio nuevo.
  - Ninguna otra spec es requisito.
- **Fecha:** 2026-08-08

**Objetivo:** Crear `helpers/alerts/alert.service.ts` con `showAlert` y
`showConfirm` como único punto de entrada al `Alert.alert` nativo, y migrar todas
las llamadas directas existentes (~30, en `app/`, `presentation/` y `helpers/`) a
ese servicio.

---

## Alcance

### Incluye

- Nuevo `helpers/alerts/alert.service.ts`, único módulo que importa `Alert` de
  `react-native`, con tres funciones:
  - `showAlert(title, message)` — informativo, botón "OK".
  - `showConfirm({ title, message, confirmText, onConfirm, onCancel?, destructive? })`
    — botones "Cancelar" + acción. `onCancel` es opcional (lo necesita el
    swipeable del historial de pesos).
  - `showOptions(title, message, buttons)` — lista tipada de botones para los
    casos que no son ni informativo ni confirmación (hoy solo uno: "Registro de
    peso" con Editar/Eliminar). Es la vía de escape que mantiene el punto único
    de entrada.
- Migración **mecánica** de las ~30 llamadas directas a `Alert.alert` — mismos
  textos, mismos botones, mismo comportamiento — en:
  - `app/(mgp-app)/weight-entry.tsx` (1)
  - `app/(mgp-app)/category/[id].tsx` (4: 2 informativos, 2 confirmaciones)
  - `app/(mgp-app)/new-exercise.tsx` (4)
  - `app/(mgp-app)/new-category.tsx` (3)
  - `app/(mgp-app)/exercise/[id].tsx` (1 confirmación)
  - `presentation/auth/hooks/useLogin.ts` (1)
  - `presentation/exercises/components/AnimatedHistoryRowComponent.tsx`
    (2: 1 confirmación con `onCancel`, 1 `showOptions`)
  - `presentation/exercises/hooks/useExerciseActions.ts` (3)
  - `presentation/exercises/hooks/usePickExerciseImage.ts` (3)
  - `presentation/exercises/hooks/useDeleteExercise.ts` (1)
  - `presentation/categories/hooks/useCategory.ts` (1)
  - `presentation/weight-history/hooks/useWeightHistoryManager.ts` (3)
  - `helpers/adapters/secure-storage.adapter.ts` (3)

### No incluye (para specs futuras)

- Regla de ESLint que prohíba importar `Alert` fuera del servicio — decidido
  explícitamente que no.
- Componente visual propio (modal temático con modo claro/oscuro) — el servicio
  nativo deja la puerta abierta; si algún día entra, va en su propia spec y solo
  cambia el interior de `alert.service.ts`.
- Cambios en los tests: `jest.setup.ts` sigue mockeando `Alert.alert` y los tests
  existentes siguen asertando sobre él sin modificarse.
- Cambios de copy: ningún texto de título, mensaje o botón cambia en esta spec.
- Toasts, snackbars o cualquier otro patrón de notificación.
- Cambios en el backend.

---

## Modelo de datos

Esta feature no introduce datos persistidos ni cambios de backend. Lo único nuevo
es el contrato del servicio en `helpers/alerts/alert.service.ts`:

```ts
import { Alert, AlertButton } from "react-native";

/** Alert informativo: título + mensaje + botón "OK". */
export function showAlert(title: string, message?: string): void;

interface ConfirmOptions {
  title: string;
  message?: string;
  /** Texto del botón de acción. Por defecto "Aceptar". */
  confirmText?: string;
  onConfirm: () => void;
  /** Se ejecuta al tocar "Cancelar" (p. ej. cerrar un swipeable). */
  onCancel?: () => void;
  /** Aplica style: "destructive" al botón de acción. Por defecto false. */
  destructive?: boolean;
}

/** Confirmación de dos botones: "Cancelar" + acción. */
export function showConfirm(options: ConfirmOptions): void;

/** Vía de escape: lista de botones arbitraria, misma forma que AlertButton. */
export function showOptions(
  title: string,
  message: string | undefined,
  buttons: AlertButton[],
): void;
```

Convenciones:

- El texto del botón de cancelar de `showConfirm` es siempre `"Cancelar"`, con
  `style: "cancel"`; no es configurable.
- `showOptions` reutiliza el tipo `AlertButton` de `react-native` en vez de
  definir uno propio: el servicio es un wrapper, no una abstracción nueva.
- Las tres funciones son síncronas y `void`, igual que `Alert.alert`; los
  resultados fluyen por callbacks.
- Ningún archivo fuera de `helpers/alerts/alert.service.ts` importa `Alert` de
  `react-native` (la excepción es `jest.setup.ts`, que sigue mockeándolo).

---

## Plan de implementación

Cada paso deja el proyecto compilando y con `npm test` en verde: como el servicio
termina llamando al `Alert.alert` nativo y `jest.setup.ts` lo sigue mockeando,
los tests existentes pasan sin cambios durante toda la migración.

1. **Crear el servicio.** `helpers/alerts/alert.service.ts` con `showAlert`,
   `showConfirm` y `showOptions` según el modelo de datos. Nada lo usa todavía;
   el proyecto compila igual.

2. **Migrar `helpers/`.** En `secure-storage.adapter.ts`, reemplazar las 3
   llamadas `Alert.alert("Error", ...)` por `showAlert("Error", ...)` y quitar el
   import de `Alert`.
   Verificación: `npm test` en verde (los tests del adapter asertan sobre el mock
   de `Alert.alert`, que el servicio sigue invocando).

3. **Migrar los hooks de `presentation/`.** `useLogin.ts`,
   `useExerciseActions.ts`, `usePickExerciseImage.ts`, `useDeleteExercise.ts`,
   `useCategory.ts` y `useWeightHistoryManager.ts`: todas las llamadas son
   informativas → `showAlert`. Quitar el import de `Alert` en cada archivo.
   Verificación: `npm test` en verde.

4. **Migrar `AnimatedHistoryRowComponent.tsx`.** Los dos casos con botones:
   - "Eliminar registro" → `showConfirm({ ..., destructive: true, onCancel: () =>
swipeableRefs.current.get(entryId)?.close() })`.
   - "Registro de peso" (Editar/Eliminar) → `showOptions(...)` con los mismos dos
     botones.

     `refactor: migrate presentation and helpers alerts to alert service`.

5. **Migrar las pantallas de `app/(mgp-app)/`.** `weight-entry.tsx`,
   `new-category.tsx`, `new-exercise.tsx` (informativos → `showAlert`);
   `category/[id].tsx` y `exercise/[id].tsx` (informativos → `showAlert`,
   confirmaciones de borrado → `showConfirm` con `destructive: true` y el
   `confirmText` dinámico "Eliminando..." / "Eliminar" que ya tienen).
   Verificación: `npx tsc --noEmit`, `npm run lint` y `npm test` en verde, y
   `grep -rn "Alert.alert" app presentation helpers` devuelve solo
   `helpers/alerts/alert.service.ts`.

6. **Verificación manual en iOS** de los tres tipos de alert en vivo:
   - Un informativo: crear una categoría con nombre vacío → "Campo requerido".
   - Una confirmación destructiva: eliminar un ejercicio → "Cancelar" no borra,
     "Eliminar" borra.
   - El `showOptions`: tocar una entrada del historial de pesos → "Editar" abre
     la edición, "Eliminar" pide confirmación y borra.

---

## Criterios de aceptación

- [ ] `grep -rn "Alert.alert" app presentation helpers core` devuelve una única
      coincidencia: `helpers/alerts/alert.service.ts`.
- [ ] Ningún archivo fuera del servicio importa `Alert` de `react-native`
      (verificable con `grep`; `jest.setup.ts` es la única excepción permitida).
- [ ] Ningún texto de título, mensaje o botón cambió respecto a `main` (la
      migración es mecánica).
- [ ] En iOS, crear una categoría con nombre vacío muestra "Campo requerido" con
      botón "OK".
- [ ] En iOS, eliminar una categoría muestra la confirmación con "Cancelar" y
      "Eliminar" (destructive): "Cancelar" no borra nada; "Eliminar" borra y
      muestra "Categoria eliminada".
- [ ] En iOS, deslizar una entrada del historial de pesos y tocar "Cancelar" en
      "Eliminar registro" cierra el swipeable sin borrar (el `onCancel`
      funciona).
- [ ] En iOS, tocar una entrada del historial muestra "Registro de peso" con
      botones "Editar" y "Eliminar", y cada uno dispara su acción como antes.
- [ ] El login con credenciales incorrectas sigue mostrando su alert de error
      como antes de esta spec.
- [ ] `npm test` está en verde **sin modificar ningún archivo de test ni
      `jest.setup.ts`**.
- [ ] `npx tsc --noEmit` pasa.
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] El `git diff` toca únicamente: `helpers/alerts/alert.service.ts` (nuevo) y
      los 13 archivos listados en el alcance.

---

## Decisiones

- **Sí:** wrapper centralizado sobre el `Alert.alert` nativo. El objetivo es un
  punto único de entrada, no cambiar el look de los diálogos.
- **No:** componente visual propio (modal temático) montado en `app/_layout.tsx`.
  Es más código, más riesgo visual, y puede añadirse después cambiando solo el
  interior de `alert.service.ts` sin tocar a los llamadores.
- **Sí:** módulo plano con funciones exportadas. El wrapper no tiene estado que
  almacenar.
- **No:** store de Zustand. Se consideró como preparación para un futuro
  componente visual, pero un store que no almacena nada es infraestructura
  muerta; se descartó al elegir el wrapper nativo.
- **Sí:** vive en `helpers/alerts/alert.service.ts`.
  `secure-storage.adapter.ts` (en `helpers/`) necesita importarlo, y que
  `helpers/` importe de `presentation/` invertiría las capas del proyecto.
- **Sí:** API semántica de dos funciones (`showAlert` / `showConfirm`) en vez de
  una sola función que reciba el array de botones. Estandariza los dos patrones
  que dominan el código (informativo y confirmación destructiva) y hace cada
  llamada más corta que hoy.
- **Sí:** tercera función `showOptions` con `AlertButton[]` como vía de escape.
  Surgió al revisar el código: el alert "Registro de peso" (Editar/Eliminar) no
  es informativo ni confirmación. Sin vía de escape, ese caso forzaría a romper
  el punto único.
- **Sí:** `onCancel` opcional en `showConfirm`. El swipeable del historial
  necesita cerrarse al cancelar.
- **Sí:** el botón de cancelar es siempre `"Cancelar"` y no configurable. Es
  idéntico en todas las confirmaciones actuales; hacerlo configurable invita a
  divergir sin motivo.
- **No:** regla de ESLint (`no-restricted-imports`) que prohíba importar `Alert`
  fuera del servicio. Decisión explícita del usuario; el punto único se mantiene
  por convención y por el criterio de aceptación del `grep`.
- **Sí:** los tests siguen mockeando y asertando `Alert.alert` vía
  `jest.setup.ts`. Como el servicio termina llamando al nativo, el mock global
  intercepta todo y la migración no toca ni un test.
- **No:** que los tests mockeen el servicio nuevo. Habría que reescribir
  aserciones existentes sin ganar cobertura.
- **Sí:** migrar las ~30 llamadas en esta misma spec. Convivir con dos sistemas
  de alerts invita a que el viejo nunca muera.
- **No:** migración piloto (solo una pantalla) con el resto en otra spec.
- **Sí:** migración mecánica sin cambios de copy. Cambiar textos a la vez que se
  refactoriza haría imposible distinguir regresiones de cambios intencionales.
- **Sí:** implementar después de la spec 09, que está en curso y toca el alert
  del login.

---

## Riesgos

| Riesgo                                                                                                                                                                                                      | Mitigación                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los tests existentes asertan la forma exacta de la llamada (`expect(Alert.alert).toHaveBeenCalledWith(titulo, mensaje)`). Si `showAlert` añadiera un array de botones explícito, esas aserciones fallarían. | `showAlert` llama `Alert.alert(title, message)` **sin** tercer argumento, igual que hoy — el "OK" lo pone el nativo. El criterio "npm test en verde sin modificar tests" detecta cualquier desviación.                  |
| La spec 09 está en curso y toca justo el alert del login (`useLogin.ts` / `app/auth/login/index.tsx`); migrar en paralelo genera conflictos o migra código que va a cambiar.                                | Esta spec se implementa después de mergear la 09 (está en sus dependencias). Si la 09 se abandonara, se migra el estado que exista en `main`.                                                                           |
| Sin regla de ESLint, nada impide que una pantalla futura vuelva a llamar `Alert.alert` directo y el punto único se erosione.                                                                                | Riesgo aceptado a propósito (decisión explícita). El `grep` del criterio de aceptación da una forma barata de re-auditarlo cuando se quiera; si se erosiona en la práctica, la regla de ESLint entra en su propia spec. |
| En `category/[id].tsx` y `exercise/[id].tsx` el texto del botón es dinámico (`isPending ? "Eliminando..." : "Eliminar"`). Una migración descuidada podría fijarlo en "Eliminar".                            | El plan (paso 5) lo nombra explícitamente: `confirmText` recibe la misma expresión dinámica que hoy.                                                                                                                    |

---

## Lo que **no** entra en esta spec

- Componente visual propio de alerts (modal temático con modo claro/oscuro).
- Regla de ESLint que prohíba importar `Alert` fuera del servicio.
- Cambios de copy en títulos, mensajes o botones.
- Cambios en tests o en `jest.setup.ts`.
- Toasts, snackbars u otros patrones de notificación.
- Cambios en el backend.

Cada una de esas, si entra, va en su propia spec.
