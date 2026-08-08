# Spec 02 — Edición y eliminación de entradas del histórico de pesos

- **Estado:** Implemented
- **Dependencias:** Spec 01 (`01-historico-pesos-ejercicio.md`) — requiere el histórico de pesos ya implementado en `app/(mgp-app)/exercise/[id].tsx`
- **Fecha:** 2026-06-25

**Objetivo:** Permitir editar (peso, unidad, nota y fecha) o eliminar una entrada existente del histórico de pesos mediante swipe-to-reveal, manteniendo todo en memoria sin integración a backend.

## Alcance

**Incluye:**

- Acciones de "Editar" y "Eliminar" por cada fila del histórico de pesos en `app/(mgp-app)/exercise/[id].tsx`, reveladas mediante swipe (usando `Swipeable` de `react-native-gesture-handler`, ya instalado en el proyecto).
- Reutilización del modal existente de "Registrar nuevo peso": al elegir "Editar" se abre el mismo modal pre-llenado con los datos de la entrada (peso, unidad, nota, fecha), con el título y el texto del botón cambiados a modo edición (ej. "Editar peso" / "Guardar cambios").
- Campo de fecha editable en el modal (tanto en creación como en edición), usando un date picker nativo vía `@react-native-community/datetimepicker` (nueva dependencia a instalar).
- Al guardar una edición, la entrada correspondiente se actualiza en el estado local `weightHistory` (por `id`), conservando su posición ordenada por fecha.
- Al eliminar una entrada, se quita del estado local `weightHistory` tras confirmar en un `Alert.alert` (patrón ya usado para eliminar ejercicios/categorías).
- Recalculo automático del "Peso asignado" mostrado en la card superior, derivándolo siempre de la entrada más reciente (por fecha) del `weightHistory` resultante, tanto tras editar como tras eliminar.
- Estado vacío: si se elimina la última entrada del histórico, la sección muestra un texto indicando que no hay registros (ej. "Sin registros de peso") y la card de "Peso asignado" pasa a un valor vacío/por defecto.

**No incluye (explícitamente fuera de alcance):**

- Integración con backend/API: no hay endpoint, action ni mutación de React Query para editar o eliminar entradas. Todo el comportamiento es en memoria, igual que en la Spec 01.
- Persistencia local (AsyncStorage/SecureStore).
- Deshacer ("undo") una eliminación.
- Edición/eliminación múltiple o en lote.
- Cambios al modelo `Exercise` compartido (`core/categories/interfaces/category.interface.ts`); el histórico sigue viviendo solo en el estado de la pantalla.
- Validación de fecha respecto a otras entradas (ej. no se valida que la fecha editada no quede "en el futuro" o duplicada).

## Modelo de datos

Extiende el estado local ya definido en la Spec 01, en `app/(mgp-app)/exercise/[id].tsx`. No se modifica la interfaz `WeightHistoryEntry`:

```ts
interface WeightHistoryEntry {
  id: string;
  weight: number;
  weightUnit: string; // "kg" | "lb"
  note?: string;
  date: string; // ISO string
}
```

**Estado nuevo/modificado en la pantalla:**

- `editingEntryId: string | null` — `id` de la entrada que se está editando; `null` cuando el modal está en modo creación. Determina si `handleSubmit` crea una entrada nueva o actualiza una existente.
- El formulario del modal se extiende con la fecha:

```ts
{
  weight: string;
  weightUnit: string; // default "kg"
  note: string; // default ""
  date: Date; // default: new Date() en creación; fecha de la entrada en edición
}
```

- `showDatePicker: boolean` — controla la visibilidad del `DateTimePicker` nativo dentro del modal.
- `assignedWeight` (el valor mostrado en la card de "Peso asignado") deja de ser un estado actualizado manualmente en cada submit y pasa a derivarse siempre de `weightHistory` ordenado por `date` descendente: `weightHistory[0]` si existe, o un valor vacío/placeholder si `weightHistory.length === 0`.

**Nueva dependencia:**

- `@react-native-community/datetimepicker` — para el selector nativo de fecha en el modal.

## Plan de implementación

1. Instalar `@react-native-community/datetimepicker` (`npx expo install @react-native-community/datetimepicker`) para tener el date picker nativo disponible.

2. En `app/(mgp-app)/exercise/[id].tsx`, agregar el campo `date: Date` al estado del formulario del modal y el estado `showDatePicker`. Renderizar dentro del modal un botón/campo que muestra la fecha seleccionada y abre el `DateTimePicker` al presionarlo; al confirmar, actualiza `date` en el formulario.

3. Agregar el estado `editingEntryId: string | null`. Cambiar el botón "Registrar nuevo peso" para que, al abrirse el modal en modo creación, ponga `editingEntryId = null` y resetee el formulario (incluyendo `date = new Date()`).

4. Envolver cada fila del histórico en un `Swipeable` (de `react-native-gesture-handler`), con `renderRightActions` mostrando dos botones: "Editar" y "Eliminar", siguiendo los tokens de color ya usados en la pantalla (ej. un color de acento para editar, un color de error para eliminar).

5. Implementar la acción "Editar": al presionar, cierra el swipe, setea `editingEntryId` al `id` de la entrada, prellena el formulario del modal con sus valores (`weight.toString()`, `weightUnit`, `note`, `date = new Date(entry.date)`) y abre el modal con título/botón en modo edición.

6. Implementar la acción "Eliminar": al presionar, cierra el swipe y muestra un `Alert.alert` de confirmación ("Cancelar" / "Eliminar"); si se confirma, remueve la entrada de `weightHistory` por `id`.

7. Modificar `handleSubmit` del modal: si `editingEntryId` es `null`, mantiene el comportamiento actual (crear y anteponer); si tiene un valor, reemplaza la entrada con ese `id` en `weightHistory` con los nuevos valores del formulario (incluyendo la fecha editada), conservando el resto del histórico sin cambios. En ambos casos, valida `weight` como número > 0 antes de continuar (mismo `Alert.alert` que ya existe).

8. Eliminar la actualización manual del "Peso asignado" en `handleSubmit` (ya no aplica) y reemplazar su fuente de datos en el render de la card por un valor derivado: ordenar `weightHistory` por `date` descendente y tomar el primer elemento, o mostrar un placeholder ("Sin registros") si el array está vacío.

9. Verificación manual:
   - Editar una entrada existente (incluida la más reciente) y confirmar que el cambio se refleja en el histórico y, si corresponde, en la card de "Peso asignado".
   - Eliminar una entrada no-más-reciente y confirmar que el histórico y la card no cambian incorrectamente.
   - Eliminar la entrada más reciente y confirmar que la card se actualiza tomando la siguiente entrada más reciente.
   - Eliminar todas las entradas y confirmar que se muestra el estado vacío.
   - Cancelar el `Alert` de eliminación y confirmar que no se borra nada.
   - Cancelar el modal en modo edición y confirmar que la entrada original no cambia.

## Criterios de aceptación

- [ ] Al deslizar (swipe) una fila del histórico de pesos, se revelan dos acciones: "Editar" y "Eliminar".
- [ ] Al presionar "Editar", se abre el modal pre-llenado con peso, unidad, nota y fecha de esa entrada, con título/botón en modo edición.
- [ ] El modal permite seleccionar la fecha mediante un date picker nativo, tanto en creación como en edición.
- [ ] Al guardar una edición válida, la entrada se actualiza en el histórico con los nuevos valores (incluida la fecha) sin crear una entrada duplicada.
- [ ] Si se intenta guardar una edición con peso vacío o no numérico, se muestra una alerta y la entrada original no se modifica.
- [ ] Al presionar "Eliminar", se muestra un `Alert.alert` de confirmación antes de borrar la entrada.
- [ ] Si se cancela el `Alert` de eliminación, la entrada permanece sin cambios en el histórico.
- [ ] Si se confirma la eliminación, la entrada desaparece del histórico.
- [ ] La card de "Peso asignado" siempre refleja la entrada más reciente (por fecha) del histórico actual, tanto después de editar como después de eliminar cualquier entrada (incluida la más reciente).
- [ ] Si se eliminan todas las entradas del histórico, se muestra un estado vacío (texto indicando que no hay registros) y la card de "Peso asignado" muestra un valor vacío/placeholder.
- [ ] Cancelar el modal en modo edición (sin guardar) no modifica la entrada original.
- [ ] Ninguna llamada a `mgpApi`, action o mutación de React Query se agrega para editar o eliminar entradas — todo el comportamiento vive en estado local del componente.
- [ ] Al recargar la pantalla (salir y volver a entrar), el histórico vuelve a su estado mock inicial de la Spec 01 (no hay persistencia de ediciones ni eliminaciones).

## Decisiones tomadas y descartadas

- **Swipe-to-reveal para las acciones de editar/eliminar** — se eligió sobre botones inline siempre visibles, long-press con Alert, o tap-en-la-fila, porque mantiene la fila limpia visualmente y es un patrón estándar en listas de este tipo; se usa `Swipeable` de `react-native-gesture-handler`, ya instalado en el proyecto.
- **Reutilizar el modal de creación para edición** (en vez de un modal separado) — se descartó un segundo modal porque el formulario es idéntico; se distingue el modo vía `editingEntryId` y se cambian título/texto del botón.
- **El "Peso asignado" se deriva siempre de `weightHistory`** (en vez de mantenerse como estado independiente actualizado manualmente) — necesario porque editar o eliminar la entrada más reciente debe reflejarse automáticamente en la card sin lógica duplicada de sincronización.
- **Se permite eliminar la última entrada del histórico, mostrando un estado vacío** — se descartó bloquear la eliminación de la última entrada porque añadía una regla artificial (no hay backend que dependa de tener siempre un valor) y complicaba la UI sin beneficio claro en esta etapa.
- **Fecha editable mediante date picker nativo** — se decidió instalar `@react-native-community/datetimepicker` en vez de usar un input de texto libre, para evitar errores de formato y mantener consistencia con un selector nativo estándar de Expo/RN.
- **Confirmación con `Alert.alert` antes de eliminar** — sigue el patrón ya usado en el repo para eliminar ejercicios y categorías, evitando eliminaciones accidentales por un swipe involuntario.
- **Sin integración a backend ni persistencia** — decisión explícita del usuario, consistente con el alcance de la Spec 01: el foco sigue siendo validar la UI antes de conectar con la API real.

## Riesgos identificados

- **Comportamiento distinto de `DateTimePicker` entre iOS y Android** — en Android se abre como diálogo modal nativo (se cierra solo), mientras que en iOS se renderiza inline y requiere un botón explícito de "Listo"/cierre; el plan de implementación debe manejar ambos casos en el modal.
- **Conflicto de gestos entre el `Swipeable` de las filas y el scroll vertical de la lista del histórico** — si la lista usa `ScrollView`/`FlatList`, hay que verificar que el swipe horizontal no interfiera con el scroll vertical (riesgo conocido al combinar `Swipeable` con listas scrollables).
- **Nueva dependencia (`@react-native-community/datetimepicker`)** — requiere rebuild nativo (no solo Expo Go) en algunos casos; si el proyecto usa Expo Go sin custom dev client, conviene verificar compatibilidad antes de instalar.
