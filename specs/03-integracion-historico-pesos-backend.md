# Spec 03 — Integración del histórico de pesos con el backend

- **Estado:** Approved
- **Dependencias:**
  - Spec 01 (`01-historico-pesos-ejercicio.md`) — histórico implementado en memoria
  - Spec 02 (`02-editar-eliminar-historico-pesos.md`) — edición/eliminación implementados en memoria
  - Backend spec `01-weight-history` — endpoints REST implementados y corriendo
- **Fecha:** 2026-06-26

**Objetivo:** Reemplazar el estado en memoria del histórico de pesos en
`app/(mgp-app)/exercise/[id].tsx` por llamadas reales a la API, usando cuatro
actions (`get`, `create`, `update`, `delete`) y un hook de React Query.

---

## Alcance

### Incluye

- Nuevo módulo `core/weight-history/` con:
  - Interfaz `WeightHistoryApiEntry` (shape de la respuesta del API: `weightGrams` en vez de `weight`)
  - Cuatro actions: `getWeightHistory`, `createWeightHistory`, `updateWeightHistory`, `deleteWeightHistory`
- Nuevo hook `useWeightHistory(exerciseId)` en `presentation/weight-history/hooks/` que expone:
  - `weightHistory: WeightHistoryEntry[]` — datos del API ya convertidos a valores display
  - `isLoading: boolean` — para mostrar el skeleton
  - Mutaciones: `create`, `update`, `remove` (todas invalidan el query al completarse)
- Skeleton de tres filas mientras carga el histórico (reemplaza el mock estático)
- Conversión `weightGrams → weight` display en el hook:
  kg → `weightGrams / 1000`, g → `weightGrams`, lb → `weightGrams / 453.592`
- Modificación de `app/(mgp-app)/exercise/[id].tsx`:
  - Eliminar el estado local `weightHistory` y el mock inicial
  - Consumir `useWeightHistory(id)` en su lugar
  - Mostrar skeleton mientras `isLoading`
  - Pasar las mutaciones del hook a los handlers de crear/editar/eliminar

### No incluye

- Cambios al componente `RegisterWeightModal` ni a la lógica de swipe (permanecen igual)
- Paginación del histórico
- Manejo de error con UI específica (el error de API se propaga como `Alert.alert`,
  igual que en las mutaciones existentes del proyecto)
- Optimistic updates (se usa invalidación, consistente con el patrón del proyecto)
- Cambios al modelo `Exercise` compartido ni a otros módulos del backend
- Persistencia local ni caché offline

---

## Modelo de datos

### Interfaz nueva: `WeightHistoryApiEntry`

Local a `core/weight-history/interfaces/weight-history.interface.ts`.
Representa la respuesta cruda del API (peso siempre en gramos):

```ts
export interface WeightHistoryApiEntry {
  id: string;
  weightGrams: number;
  weightUnit: string; // "kg" | "lb" | "g"
  note: string | null;
  date: string; // ISO string
}
```

### Interfaz existente: `WeightHistoryEntry`

Ya definida localmente en `app/(mgp-app)/exercise/[id].tsx` (specs 01 y 02).
Se mueve a `core/weight-history/interfaces/weight-history.interface.ts`
y se importa desde ahí en la pantalla:

```ts
export interface WeightHistoryEntry {
  id: string;
  weight: number; // valor display (ya convertido desde weightGrams)
  weightUnit: string;
  note?: string;
  date: string; // ISO string
}
```

### Función de conversión

Colocada en `core/weight-history/interfaces/weight-history.interface.ts`:

```ts
export function toDisplayWeight(
  weightGrams: number,
  weightUnit: string,
): number {
  if (weightUnit === "kg") return weightGrams / 1000;
  if (weightUnit === "lb") return weightGrams / 453.592;
  return weightGrams; // "g"
}
```

### Query key

`["weight-history", exerciseId]` — usado en `useQuery` y en todos los
`invalidateQueries` de las mutaciones.

### Payloads de las actions

- **create / update:** `{ weight: number, weightUnit: string, note?: string, date: string }`
  (el backend recibe `weight` en la unidad indicada y convierte internamente)
- **delete:** solo `exerciseId` + `entryId`

---

## Plan de implementación

1. **Crear la interfaz y función de conversión** en
   `core/weight-history/interfaces/weight-history.interface.ts`:
   - `WeightHistoryApiEntry` (shape del API)
   - `WeightHistoryEntry` (shape display, movida desde la pantalla)
   - `toDisplayWeight(weightGrams, weightUnit): number`

2. **Crear las cuatro actions** en `core/weight-history/actions/`, siguiendo
   el patrón de error de `delete-exercise.action.ts` (`isAxiosError` + `throw new Error`):
   - `get-weight-history.action.ts` — `GET /exercises/:exerciseId/weight-history`
     → retorna `WeightHistoryApiEntry[]`
   - `create-weight-history.action.ts` — `POST /exercises/:exerciseId/weight-history`
     → retorna `WeightHistoryApiEntry`
   - `update-weight-history.action.ts` — `PATCH /exercises/:exerciseId/weight-history/:entryId`
     → retorna `WeightHistoryApiEntry`
   - `delete-weight-history.action.ts` — `DELETE /exercises/:exerciseId/weight-history/:entryId`
     → retorna `void`

3. **Crear `useWeightHistory(exerciseId)` en
   `presentation/weight-history/hooks/useWeightHistory.ts`**:
   - `useQuery` con key `["weight-history", exerciseId]` que llama a `getWeightHistory`
     y mapea cada `WeightHistoryApiEntry` a `WeightHistoryEntry` usando `toDisplayWeight`
   - `useMutation` para `create` → en `onSuccess` invalida `["weight-history", exerciseId]`
   - `useMutation` para `update` → ídem
   - `useMutation` para `remove` → ídem; en `onError` muestra `Alert.alert`
   - Expone: `{ weightHistory, isLoading, createMutation, updateMutation, removeMutation }`

4. **Modificar `app/(mgp-app)/exercise/[id].tsx`**:
   - Eliminar el estado local `weightHistory` y el mock inicial (el array hardcodeado
     con `id: "initial"`)
   - Eliminar la definición local de `WeightHistoryEntry` (ahora viene del módulo)
   - Importar y llamar a `useWeightHistory(String(id))`
   - Reemplazar el bloque `.map()` del histórico por: si `isLoading`, renderizar
     3 filas skeleton (rectángulos con `backgroundColor: borderColor`, `borderRadius: 14`,
     `height: 56`); si no, el `.map()` existente sin cambios
   - En `handleSubmitWeight`: reemplazar los `setWeightHistory(...)` por llamadas a
     `createMutation.mutate(...)` / `updateMutation.mutate(...)` según `editingEntryId`
   - En `handleDeleteEntry`: reemplazar el `setWeightHistory(prev => prev.filter(...))`
     por `removeMutation.mutate({ exerciseId: String(id), entryId })`
   - El `displayWeight` (card "Peso asignado") se sigue derivando de `weightHistory[0]`
     ordenado por fecha, ahora con datos reales

5. **Verificación manual**:
   - Entrar al detalle de un ejercicio → ver skeleton → ver el histórico real del backend
   - Registrar un nuevo peso → el modal cierra → la lista se recarga con la nueva entrada
   - Editar una entrada → la lista refleja el cambio
   - Eliminar una entrada → desaparece de la lista; si era la más reciente, la card
     "Peso asignado" se actualiza
   - Reiniciar la app y volver al ejercicio → el histórico persiste (viene del backend)

---

## Criterios de aceptación

- [ ] Al entrar al detalle de un ejercicio, se muestran 3 filas skeleton mientras
      se carga el histórico del backend.
- [ ] Una vez cargado, la lista muestra las entradas reales del backend ordenadas
      por fecha descendente, con peso (valor display), unidad, fecha y nota (si existe).
- [ ] La conversión `weightGrams → weight` es correcta: kg → `/1000`, lb → `/453.592`,
      g → valor directo.
- [ ] Al guardar un nuevo peso desde el modal, se llama a
      `POST /api/exercises/:exerciseId/weight-history` y la lista se recarga
      con la nueva entrada visible.
- [ ] Al guardar una edición válida, se llama a
      `PATCH /api/exercises/:exerciseId/weight-history/:entryId` y la entrada
      se actualiza en la lista sin duplicados.
- [ ] Al confirmar la eliminación de una entrada, se llama a
      `DELETE /api/exercises/:exerciseId/weight-history/:entryId` y la entrada
      desaparece de la lista.
- [ ] La card "Peso asignado" siempre refleja la entrada más reciente (por fecha)
      del histórico cargado desde el backend.
- [ ] Si el backend devuelve un error en cualquier mutación, se muestra un
      `Alert.alert` con el mensaje de error y la lista no se modifica.
- [ ] Al reiniciar la app y volver al ejercicio, el histórico persiste
      (los datos vienen del backend, no de estado en memoria).
- [ ] No existe ningún array hardcodeado de mock en `app/(mgp-app)/exercise/[id].tsx`
      ni estado local `weightHistory` inicializado con datos ficticios.
- [ ] El comportamiento del modal (validación de peso, date picker, swipe-to-reveal)
      permanece idéntico al de las specs 01 y 02.

---

## Decisiones tomadas y descartadas

- **Nuevo módulo `core/weight-history/` y `presentation/weight-history/`** en vez de
  agregar las actions al módulo de ejercicios existente — el historial de pesos es un
  sub-recurso independiente con sus propios endpoints, interfaces y hook; colocarlo en
  `core/exercises/` hubiera mezclado responsabilidades y dificultado futuras extensiones
  (paginación, gráficos).

- **Conversión `weightGrams → weight` en el hook** (al mapear el resultado del `useQuery`)
  en vez de en cada action individual — centraliza la lógica de presentación en una sola
  capa; las actions devuelven el shape crudo del API (`WeightHistoryApiEntry`) y el hook
  produce el shape display (`WeightHistoryEntry`).

- **Invalidación del query en `onSuccess`** en vez de optimistic updates — consistente con
  el patrón ya usado en `useCategory` y `deleteExerciseMutation`; evita complejidad de
  rollback y garantiza que la lista siempre refleje el estado real del backend.

- **Skeleton de 3 filas** en vez de spinner o estado vacío durante la carga — más
  consistente visualmente con el contenido que va a aparecer; reutiliza los tokens de
  color ya definidos en la pantalla (`borderColor`, `cardBackground`) sin dependencia
  de librerías externas.

- **`WeightHistoryEntry` movida a `core/weight-history/interfaces/`** en vez de
  mantenerse definida localmente en la pantalla — al integrarse con el backend la interfaz
  es compartida entre la action, el hook y la pantalla; tenerla en la pantalla hubiera
  forzado imports circulares o duplicación.

- **Error de mutación con `Alert.alert`** en vez de UI inline de error — sigue el patrón
  existente en `deleteExerciseMutation` y `useCategory`; no se introduce un nuevo patrón
  de manejo de errores para esta feature.
