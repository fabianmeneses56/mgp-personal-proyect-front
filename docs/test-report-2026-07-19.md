# Reporte de testing E2E — 19/07/2026

Test exploratorio manual ejecutado en simulador iPhone 16 Pro (Expo Go, backend dev en `192.168.1.2:3000`) vía agent-device MCP. Se cubrieron: Home, navegación de categorías, creación de categoría/ejercicio, detalle de ejercicio, registro de pesos, imagen, y borrados. Los datos de prueba (`TEST-*`) fueron creados y eliminados; el estado final quedó idéntico al inicial (rostroHoy 2 ejercicios, Tricep 0, Espalda 1).

## 1. Bugs confirmados en vivo

### B1. Se permiten categorías con nombre duplicado
- **Repro:** Home → `+` → crear "TEST-Categoria" dos veces → ambas se crean; el usuario ve dos tarjetas idénticas indistinguibles.
- **Dónde:** `app/(mgp-app)/new-category.tsx` (sin chequeo de duplicados) y backend (tampoco valida).
- **Esperado:** rechazar o advertir nombre duplicado (al menos case-insensitive en el front contra la lista ya cargada en cache de React Query).

### B2. Peso vacío/negativo en "Nuevo ejercicio" pasa el front y explota en el backend con error genérico
- **Repro:** Categoría → `+` → nombre válido, peso vacío (o `-10`) → "Guardar ejercicio" → Alert "Error al crear el ejercicio".
- **Causa front:** `app/(mgp-app)/new-exercise.tsx` valida con `Number.isNaN(Number(peso))`; `Number("") === 0` y `Number("-10") === -10` pasan. El backend rechaza, pero el usuario recibe un mensaje genérico sin saber qué corregir.
- **Esperado:** validar en el front vacío/`<= 0` con mensaje específico (como ya hace weight-entry: "Ingresa un peso numerico mayor a 0").

### B3. Coma decimal rechazada en "Nuevo ejercicio" pero aceptada en "Registrar peso" (inconsistencia)
- **Repro:** Nuevo ejercicio con peso `12,5` → "Ingresa un peso valido". El mismo valor en Registrar peso se normaliza a `12.5` y guarda bien.
- **Causa:** `new-exercise.tsx` no aplica el `replace(",", ".")` que sí aplica `weight-entry.tsx`.
- **Esperado:** normalizar coma→punto también en new-exercise (y unificar keyboardType: `numeric` vs `decimal-pad`).

### B4. Fotos HEIC rechazadas — la cámara del iPhone produce HEIC por defecto
- **Repro:** Detalle de ejercicio → "Cambiar imagen" → elegir foto del carrete del simulador → Alert "Formato no soportado. Selecciona una imagen en formato JPEG, PNG o WEBP."
- **Dónde:** `presentation/exercises/hooks/usePickExerciseImage.ts` (filtro MIME estricto jpeg/png/webp).
- **Impacto:** en un dispositivo real la mayoría de las fotos de cámara son HEIC → la feature de imagen es inutilizable para el caso más común.
- **Esperado:** pedir a expo-image-picker que transcodifique (`mediaTypes`/`quality` producen JPEG si se usa `allowsEditing`/compresión) o convertir HEIC antes de subir, en lugar de rechazar.

### B5. Editar/eliminar registros de peso solo es accesible por swipe (descubribilidad y accesibilidad)
- **Observado:** las filas del historial no exponen ninguna acción alternativa (ni long-press, ni botón, ni acciones de accesibilidad en el árbol AX — verificado por snapshot). VoiceOver no puede accionar Editar/Eliminar; los gestos sintéticos de automatización tampoco (ver §4).
- **Dónde:** `app/(mgp-app)/exercise/[id].tsx` (`SwipeRightActions`).
- **Esperado:** añadir `accessibilityActions` al swipeable y/o una acción visible (menú contextual en long-press o botón "..." en la fila).

### B6. Sin límite de longitud de nombres; la tarjeta crece sin truncar
- **Repro:** categoría de 76 caracteres → la tarjeta de Home crece a 4 líneas.
- **Esperado:** `maxLength` en inputs y `numberOfLines`/ellipsis en las tarjetas.

### Observaciones menores confirmadas
- El header del detalle de ejercicio muestra "Back" cuando se navega desde una categoría recién visitada (desde rostroHoy mostró "rostroHoy") — título de back inconsistente.
- El historial mezcla unidades (50 lb encima de 22.5 kg) sin conversión ni indicador de progresión; "Peso asignado" solo replica el último registro tal cual.
- Registrar peso cierra el modal sin alerta de confirmación (los otros flujos sí muestran alerta de éxito) — inconsistencia de feedback.

## 2. Bugs de código (no ejercitables por UI hoy)

- **Register es un stub:** `app/auth/register/index.tsx` solo renderiza texto; el link desde login lleva a una pantalla muerta. `core/auth/actions/auth-actions.ts` tiene `// TODO: Tarea: Hacer el register`.
- **Update de categoría es no-op:** `core/categories/actions/create-update-category.action.ts:12` — si `id !== "new"` solo hace `console.log("pending")` y cae a `createCategory` (crearía duplicado si se llegara a wirear una UI de edición).
- **Éxito optimista en weight-entry:** `app/(mgp-app)/weight-entry.tsx` dispara haptic de éxito y `router.back()` inmediatamente tras `mutate()`, antes de que el request resuelva; si el API falla, el usuario ya vio "éxito" y el Alert de error aparece con el modal cerrado. (No reproducible en vivo con red local rápida; confirmado por código.)
- **`authLogin` loguea el token completo** en consola (`auth-actions.ts`), más `console.log` residuales en `useCategory.ts` ("response"), `get-categories-by-user.action.ts` y `secure-storage.adapter.ts`.
- **Mensaje copy-paste:** categoría lanza "Error al actualizar el producto".
- **Root layout importa `use-color-scheme.web` en native** (`app/_layout.tsx:2`) — la variante web (con hidratación) se usa en iOS/Android; dark mode puede quedar clavado en light en el primer render.
- **Id sintético en navegación:** `category/[id].tsx` navega con `item.id ?? \`${name}-${index}\``; un ejercicio sin id consultaría `/exercises/{name-index}/weight-history` → 404 silencioso.
- **Lecturas fallidas se ven como estados vacíos:** con `retry: false` global, un fallo de `GET /categories/categoriesByUser` muestra "Aun no hay categorias" y un fallo de weight-history muestra "Sin registros", sin banner de error ni botón de reintento. Solo pull-to-refresh recupera.

## 3. Mejoras UX/robustez sugeridas

1. Validación de peso unificada en un helper compartido (vacío, `<= 0`, coma→punto, `maxLength`) usado por new-exercise y weight-entry.
2. Estado de error visible para queries (banner "No pudimos cargar tus datos — Reintentar") en Home y en historial.
3. Mensajes de error del backend propagados al Alert de creación de ejercicio (hoy siempre genérico).
4. Chequeo de duplicados al crear categoría (sobre el cache de `["categories"]`).
5. Acciones de fila accesibles (accessibilityActions / long-press) además del swipe.
6. Feedback consistente al guardar peso (hoy: silencioso) vs. crear categoría/ejercicio (alerta).
7. Truncado con ellipsis + `maxLength` en nombres.
8. Aceptar HEIC (transcodificar a JPEG al subir).
9. Quitar `console.log` de token y residuales; corregir "producto"→"categoria".
10. Corregir import de `use-color-scheme` en `app/_layout.tsx`.

## 4. Limitaciones del test

- **Swipe de filas de historial:** los gestos sintéticos de XCTest (swipe/pan del agent-device, incluso a 2.5 s) no activan el `ReanimatedSwipeable` de RNGH; el runner comprime la duración real del gesto a ~260 ms. Editar/eliminar registros de peso, single-open y las animaciones de borrado quedaron sin ejercitar en vivo (cubiertos por revisión de código). No es un bug de la app, pero refuerza B5.
- **Auth (logout/login/registro/expiración):** excluido por acuerdo para no perder la sesión activa.
- Los registros de peso de TEST-Ejercicio se eliminaron junto con el ejercicio (borrado en cascada verificado).

## 5. Estado final de datos

Verificado por screenshot: 3 categorías (rostroHoy 2 ejercicios, Tricep 0, Espalda 1), stats 3/3, sin datos `TEST-*` residuales, sesión autenticada intacta.

---

## Correcciones aplicadas (Fase B)

Loop ejecutado el 19/07/2026 con el agente `rn-feature-builder` (Sonnet 5, esfuerzo medio), un lote por invocación. Cada fix se verificó en vivo en el simulador (fast refresh de Expo). `npm run lint` final: 0 errores, 7 warnings preexistentes.

| # | Hallazgo | Estado | Archivos | Verificación |
|---|----------|--------|----------|--------------|
| B2 | Peso vacío/negativo pasaba el front | ✅ corregido | `app/(mgp-app)/new-exercise.tsx` | En vivo: vacío y `-5` ahora muestran Alert "Peso invalido" del front, sin llegar al backend |
| B3 | Coma decimal rechazada en new-exercise | ✅ corregido | `app/(mgp-app)/new-exercise.tsx` (normalización coma→punto + `decimal-pad`) | En vivo: `12,5` crea el ejercicio con 12.5 kg |
| B6 | Sin límite/truncado de nombres | ✅ corregido | `new-category.tsx`, `new-exercise.tsx` (`maxLength=40`), `(home)/index.tsx`, `category/[id].tsx` (`numberOfLines={1}`) | Lint OK; maxLength aplicado en inputs |
| B1 | Categorías duplicadas permitidas | ✅ corregido | `app/(mgp-app)/new-category.tsx` (chequeo case-insensitive contra cache `["categories"]`) | En vivo: crear "test-fix" con "TEST-Fix" existente → Alert "Nombre duplicado" |
| B4 | Fotos HEIC rechazadas | ✅ corregido | `presentation/exercises/hooks/usePickExerciseImage.ts` (`allowsEditing` + quality → JPEG; normalización de MIME heic/heif como red de seguridad) | En vivo: la foto del carrete que antes fallaba ahora se sube y se muestra como imagen del ejercicio |
| B5 | Editar/eliminar solo por swipe (accesibilidad) | ✅ corregido | `app/(mgp-app)/exercise/[id].tsx` (long-press → action sheet Editar/Eliminar/Cancelar + `accessibilityActions` + haptic `ImpactFeedbackStyle.Light` al activarse el long-press) | En vivo: long-press abre el action sheet; "Editar" abre el modal con prefill |
| — | `authLogin` logueaba el token | ✅ corregido | `core/auth/actions/auth-actions.ts` | Revisión de código; ya no se imprime el AuthResponse |
| — | console.logs residuales | ✅ corregido | `useCategory.ts`, `get-categories-by-user.action.ts`, `secure-storage.adapter.ts` | Revisión de código |
| — | Mensaje "Error al actualizar el producto" | ✅ corregido | `core/categories/actions/create-update-category.action.ts` → "Error al guardar la categoria" | Revisión de código |
| — | Import de `use-color-scheme.web` en native | ✅ corregido | `app/_layout.tsx` (import de la variante estándar; Metro resuelve `.web` solo en web) | Lint OK, app carga normal tras reload |
| — | Éxito optimista en weight-entry | ✅ corregido | `app/(mgp-app)/weight-entry.tsx` (`mutateAsync` + try/catch; haptic y `router.back()` solo al resolver; botón "Guardando..." deshabilitado durante el request) | En vivo: registro de 11 kg cierra el modal tras resolver y el historial se actualiza |
| — | Lecturas fallidas mostradas como empty state | ✅ corregido | `(home)/index.tsx`, `exercise/[id].tsx`, `useWeightHistory.ts` (expone `isError`; mensaje "No pudimos cargar..." + Reintentar) | Lint OK; no ejercitado en vivo (requeriría tumbar el backend) |
| — | Update de categoría no-op | ⏸ pendiente | `create-update-category.action.ts:12` | Fuera de alcance (feature sin UI, no un fix) |
| — | Register stub | ⏸ pendiente | `app/auth/register/index.tsx` | Fuera de alcance (feature nueva) |
| — | Header "Back" inconsistente, mezcla de unidades en historial | ⏸ pendiente | — | Hallazgos menores, no incluidos en el loop |

Estado final de datos re-verificado tras el loop: Home con 3 categorías / 3 ejercicios originales, sin residuos `TEST-*`, sesión intacta. Los cambios quedaron en el working tree **sin commitear**.
