# Spec 01 — Histórico de pesos en detalle de ejercicio

- **Estado:** Implemented
- **Dependencias:** Ninguna (usa la pantalla existente `app/(mgp-app)/exercise/[id].tsx` y el modelo `Exercise`)
- **Fecha:** 2026-06-24

**Objetivo:** Permitir ver, en el detalle de un ejercicio, un histórico de los pesos asignados y registrar un nuevo peso desde un modal, todo con datos en memoria (sin backend ni persistencia real).

## Alcance

**Incluye:**

- Sección de "Histórico de pesos" en `app/(mgp-app)/exercise/[id].tsx`, debajo de la card de "Peso asignado", mostrando una lista de entradas (más reciente primero) con peso, unidad, fecha y nota opcional.
- Botón/acción para abrir un modal de "Registrar nuevo peso" desde esa misma pantalla (siguiendo el patrón de modal con `useState` + `<Modal>` ya usado en `app/(mgp-app)/(home)/index.tsx`, no una ruta separada).
- Formulario del modal con: peso (numérico), unidad (kg/lb), nota (texto libre, opcional).
- Al guardar, la nueva entrada se agrega en memoria (estado local del componente) al inicio del histórico, y se actualiza el "Peso asignado" mostrado en la card existente.
- Datos iniciales del histórico como mock estático (array hardcodeado) para poder ver la UI poblada al entrar a la pantalla.

**No incluye (explícitamente fuera de alcance):**

- Integración con backend/API: no hay endpoint, action ni React Query mutation real. Nada se persiste; al salir de la pantalla o recargar la app se pierde el histórico.
- Persistencia local (AsyncStorage/SecureStore) del histórico.
- Edición o eliminación de entradas individuales del histórico una vez creadas.
- Gráfico de tendencia (queda para una spec futura si se decide abordarlo).
- Cambios al modelo `Exercise` en `core/categories/interfaces/category.interface.ts` (el histórico vive solo en el estado de la pantalla, no en la interfaz compartida).

## Modelo de datos

Estructura nueva, local a la pantalla `app/(mgp-app)/exercise/[id].tsx` (no se agrega a `core/categories/interfaces/category.interface.ts`, ya que es solo UI sin persistencia):

```ts
interface WeightHistoryEntry {
  id: string; // generado en cliente (ej. Date.now().toString() o uuid simple)
  weight: number;
  weightUnit: string; // "kg" | "lb"
  note?: string;
  date: string; // ISO string, ej. new Date().toISOString()
}
```

**Estado local:**

- `weightHistory: WeightHistoryEntry[]` — inicializado con un mock estático que incluye al menos una entrada (la correspondiente al peso actual recibido por params), para que la pantalla no se vea vacía al entrar.
- Al guardar el modal, se hace `setWeightHistory(prev => [nuevaEntrada, ...prev])` y se actualiza también el valor de "Peso asignado" mostrado (estado local separado o derivado de `weightHistory[0]`).

**Formulario del modal (estado local):**

```ts
{
  weight: string; // input controlado, se convierte a number al guardar
  weightUnit: string; // default "kg"
  note: string; // default ""
}
```

## Plan de implementación

1. En `app/(mgp-app)/exercise/[id].tsx`, agregar el tipo `WeightHistoryEntry` y el estado `weightHistory` inicializado con un mock que incluye una entrada basada en los `weight`/`weightGrams`/`weightUnit` recibidos por params (fecha = hoy, nota vacía), de modo que la pantalla siga funcionando igual que antes pero ya con el estado listo.

2. Renderizar la sección "Histórico de pesos" debajo de la card de "Peso asignado": un `ThemedText` de título y una lista (`.map` sobre `weightHistory`, ordenada por fecha descendente) mostrando cada entrada como una fila con peso + unidad, fecha formateada y nota (si existe). Reutilizar los tokens de color ya definidos en la pantalla (`cardBackground`, `borderColor`, `mutedText`).

3. Agregar estado `modalVisible` y el formulario local (`weight`, `weightUnit`, `note`), y un botón "Registrar nuevo peso" que abre el modal, siguiendo el patrón de `<Modal animationType="slide" transparent>` usado en `app/(mgp-app)/(home)/index.tsx`.

4. Implementar `handleSubmit` del modal: valida que `weight` sea un número válido mayor a 0 (si no, `Alert.alert` igual que en la creación de categoría), construye la nueva `WeightHistoryEntry`, la antepone a `weightHistory`, actualiza el peso "actual" mostrado en la card, resetea el formulario y cierra el modal.

5. Verificación manual: abrir el detalle de un ejercicio, confirmar que se ve al menos una entrada de histórico; abrir el modal, registrar un peso nuevo, confirmar que aparece arriba del histórico y que la card de "Peso asignado" se actualiza; confirmar que cancelar el modal no agrega entradas.

## Criterios de aceptación

- [ ] Al entrar al detalle de un ejercicio, se muestra una sección "Histórico de pesos" con al menos una entrada (correspondiente al peso actual del ejercicio).
- [ ] Cada entrada del histórico muestra peso, unidad, fecha y nota (si la tiene).
- [ ] Existe un botón visible en la pantalla para "Registrar nuevo peso".
- [ ] Al presionar ese botón se abre un modal con campos para peso, unidad y nota (opcional).
- [ ] Si se intenta guardar con un peso vacío o no numérico, se muestra una alerta y el modal no se cierra ni se agrega ninguna entrada.
- [ ] Al guardar un peso válido, el modal se cierra, la nueva entrada aparece primero en el histórico, y la card de "Peso asignado" refleja el nuevo valor.
- [ ] Al cancelar el modal (sin guardar), no se agrega ninguna entrada al histórico.
- [ ] Ninguna llamada a `mgpApi`, action o React Query mutation se agrega para esta funcionalidad — todo el comportamiento vive en estado local del componente.
- [ ] Al recargar la pantalla (salir y volver a entrar), el histórico vuelve a su estado mock inicial (comportamiento esperado dado que no hay persistencia).

## Decisiones tomadas y descartadas

- **Histórico en memoria, sin persistencia ni backend** — decisión explícita del usuario para esta iteración: el foco es validar la UI antes de integrar con la API real.
- **Modal con `useState` + `<Modal>` en el mismo archivo, en vez de ruta separada** — se descartó crear una ruta tipo `exercise/[id]/edit-weight` para mantener consistencia con el patrón ya usado en `app/(mgp-app)/(home)/index.tsx` para la creación de categorías.
- **Lista simple en vez de gráfico de tendencia** — se descartó el gráfico para esta spec porque implica una librería de charts y bastante más esfuerzo de UI; se deja como posible spec futura.
- **Nota opcional incluida en la entrada del histórico** — se decidió incluirla (en vez de solo peso + unidad + fecha) para dar más contexto a cada cambio, sin costo adicional relevante en esta etapa.
- **No se modifica la interfaz `Exercise` compartida** — el histórico es una estructura nueva y local a la pantalla (`WeightHistoryEntry`), ya que no hay necesidad de propagarla a otras partes del código mientras no haya backend.
