# Spec 06 — Gráfica de progreso de pesos

- **Estado:** Approved
- **Dependencias:**
  - Spec `01-historico-pesos-ejercicio.md` / `03-integracion-historico-pesos-backend.md` — el historial de pesos por ejercicio ya existe y se consume vía `useWeightHistory`
- **Fecha:** 2026-07-22

**Objetivo:** Visualizar la evolución del peso de un ejercicio con una mini-gráfica decorativa en la pantalla de detalle que, al tocarla, abre una pantalla completa con la gráfica interactiva.

---

## Alcance

### Incluye

- Instalar `react-native-gifted-charts` y sus peers `react-native-svg` y `expo-linear-gradient` (vía `npx expo install` para versiones compatibles con Expo 54).
- Transformación de datos compartida: convertir cada entrada del historial a un punto `{ value, date }` con el peso **normalizado a kg** desde `weightGrams`, ordenado por fecha ascendente.
- Un componente de gráfica de línea reutilizable en `presentation/weight-history/components/`, con dos variantes: compacta (sparkline sin ejes ni interacción) y completa (ejes, etiquetas de fecha y tooltip).
- Mini-gráfica en `app/(mgp-app)/exercise/[id].tsx`: card decorativa que solo se renderiza con **2+ registros**; tocar la card navega a la pantalla completa.
- Nueva ruta `app/(mgp-app)/exercise-progress.tsx` (push normal en el Stack, registrada en `(mgp-app)/_layout.tsx`), que recibe `exerciseId` y `name` como params — mismo patrón que `weight-entry.tsx`.
- Pantalla completa: gráfica con **todo el historial**, tooltip al tocar un punto mostrando peso (kg), fecha y nota si existe.
- Estados de la pantalla completa: loading, error con reintento, y mensaje "Registra al menos 2 pesos para ver tu progreso" con 0–1 registros.

### No incluye

- Filtros de rango temporal (1M / 3M / 6M / Todo) — spec futura si hace falta.
- Estadísticas resumen (peso máximo, mínimo, variación total) — descartado en la fase de preguntas.
- Interactividad (puntos táctiles / tooltip) en la mini-gráfica del detalle.
- Selector de unidad de visualización — la gráfica siempre muestra kg.
- Gráficas agregadas de varios ejercicios o vista global de progreso.
- Cambios en el backend — `GET /weight-history/:exerciseId` ya devuelve todo lo necesario.

---

## Modelo de datos

Esta spec no introduce datos persistidos nuevos ni cambios de backend. Introduce dos formas derivadas en el cliente:

**1. `WeightHistoryEntry` gana el campo `weightKg`** (en `core/weight-history/interfaces/weight-history.interface.ts`), calculado en el `select` de `useWeightHistory` a partir de `weightGrams` — que hoy se descarta en el mapeo:

```ts
export interface WeightHistoryEntry {
  id: string;
  weight: number; // valor display en la unidad original (sin cambios)
  weightUnit: string;
  weightKg: number; // NUEVO: weightGrams / 1000, redondeado a 2 decimales
  note?: string;
  date: string; // ISO
}
```

**2. Punto de gráfica** — tipo interno del componente de gráfica, derivado de las entradas ordenadas por fecha ascendente:

```ts
interface WeightChartPoint {
  value: number; // weightKg
  date: string; // ISO — para etiquetas de eje y tooltip
  note?: string; // para el tooltip en pantalla completa
}
```

Convenciones:

- El eje Y siempre está en **kg**, sin importar la unidad con que se registró cada entrada.
- Los puntos van en orden cronológico ascendente (izquierda = más antiguo), al revés que la lista del historial, que ordena descendente.

---

## Plan de implementación

1. **Instalar dependencias**: `npx expo install react-native-svg expo-linear-gradient` y luego `npm install react-native-gifted-charts`. Verificación: la app arranca (`npm run start`) sin errores de módulos nativos.

2. **Agregar `weightKg` al modelo**: modificar `core/weight-history/interfaces/weight-history.interface.ts` (campo nuevo en `WeightHistoryEntry`) y el `select` de `useWeightHistory` para calcularlo (`weightGrams / 1000`, redondeado a 2 decimales). Nada visible cambia; la app compila y el historial se ve igual.

3. **Crear el componente de gráfica** `presentation/weight-history/components/WeightProgressChart.tsx`:
   - Props: `entries: WeightHistoryEntry[]` y `variant: "compact" | "full"`.
   - Internamente ordena ascendente por fecha y mapea a los puntos de `LineChart` de gifted-charts.
   - `compact`: línea curva con área degradada (`expo-linear-gradient`), sin ejes, sin puntos, sin interacción, altura fija (~80).
   - `full`: ejes con valores en kg, etiquetas de fecha abreviadas en X, y `pointerConfig` con tooltip que muestra peso (kg), fecha y nota si existe.
   - Colores desde `useThemeColor` (`primary`, `surface`, etc.), como el resto de la app.

4. **Crear la pantalla** `app/(mgp-app)/exercise-progress.tsx`:
   - Lee `exerciseId` y `name` de `useLocalSearchParams`, consume `useWeightHistory(exerciseId)`.
   - Estados: skeleton mientras carga, error con "Reintentar" (mismo patrón que el historial en `exercise/[id].tsx`), mensaje "Registra al menos 2 pesos para ver tu progreso" con 0–1 registros, y la gráfica `variant="full"` con 2+.
   - Registrarla en `(mgp-app)/_layout.tsx` como `<Stack.Screen name="exercise-progress" options={{ title: "Progreso" }} />` (push normal, no sheet).

5. **Agregar la mini-gráfica al detalle** en `app/(mgp-app)/exercise/[id].tsx`:
   - Card nueva entre la card "Peso asignado" y la card "Histórico de pesos".
   - Solo se renderiza si `weightHistory.length >= 2` (con 0–1 registros no aparece nada nuevo).
   - Toda la card es un `Pressable` que hace `router.navigate({ pathname: "/exercise-progress", params: { exerciseId: String(id), name } })`, con un hint visual tipo "Ver progreso →".

6. **Verificación manual**:
   - Ejercicio con 3+ registros en unidades mixtas (kg y lb) → la mini-gráfica aparece y la línea es coherente (todo en kg).
   - Tocar la card → se abre la pantalla completa con push y botón de volver; tocar un punto muestra el tooltip con peso, fecha y nota.
   - Ejercicio con 0 y con 1 registro → sin card en el detalle; entrando directo a la pantalla completa se ve el mensaje de mínimo 2 pesos.
   - Crear/editar/eliminar un registro → al volver, ambas gráficas reflejan el cambio (la invalidación de `["weight-history", exerciseId]` ya existe).
   - Probar en tema claro y oscuro.

---

## Criterios de aceptación

- [ ] Con 2+ registros de peso, el detalle del ejercicio muestra la card de mini-gráfica; con 0 o 1 registros la card no se renderiza.
- [ ] La mini-gráfica es decorativa: no tiene tooltip ni puntos táctiles, y tocar cualquier parte de la card navega a la pantalla de progreso.
- [ ] La pantalla completa grafica **todos** los registros del ejercicio en orden cronológico (izquierda = más antiguo).
- [ ] Todos los puntos están normalizados a kg: un registro guardado como 100 lb se grafica como ≈45.36 kg, no como 100.
- [ ] Tocar un punto en la pantalla completa muestra un tooltip con el peso en kg y la fecha; si el registro tiene nota, también la nota.
- [ ] Con 0–1 registros, la pantalla completa muestra el mensaje "Registra al menos 2 pesos para ver tu progreso" en lugar de la gráfica.
- [ ] Si la carga del historial falla, la pantalla completa muestra el estado de error con "Reintentar", y el botón vuelve a disparar la petición.
- [ ] Crear, editar o eliminar un registro de peso actualiza ambas gráficas al volver a verlas, sin necesidad de refrescar manualmente.
- [ ] La gráfica se ve correctamente en tema claro y oscuro (colores tomados de `useThemeColor`, sin colores hardcodeados que rompan un tema).
- [ ] La lista del histórico, el swipe para editar/eliminar y el botón "Registrar nuevo peso" siguen funcionando exactamente igual que antes (sin regresión).
- [ ] `npm run lint` pasa sin errores nuevos.

---

## Decisiones

- **Sí:** `react-native-gifted-charts` como librería de gráficas — el tooltip (`pointerConfig`) y la línea con área degradada vienen casi gratis, y sus peers (`react-native-svg`, `expo-linear-gradient`) son compatibles con Expo 54.
- **No:** `victory-native` — requiere `@shopify/react-native-skia` y su API es más compleja de lo que este caso necesita.
- **No:** dibujar el SVG a mano — ejes, escalas y tooltips manuales es reinventar la rueda para un caso estándar.
- **Sí:** una sola spec para mini-gráfica + pantalla completa — comparten hook (`useWeightHistory`), librería y componente; partirlas duplicaría contexto sin reducir riesgo real.
- **Sí:** normalizar todos los puntos a kg desde `weightGrams` — eje consistente aunque haya registros en kg, lb y g mezclados.
- **No:** graficar en la unidad del último registro — más lógica de conversión condicional sin beneficio claro para un solo usuario que registra mayormente en kg.
- **No:** graficar `entry.weight` tal cual — con unidades mixtas la línea sería incoherente (100 lb parecería el doble que 50 kg).
- **Sí:** mini-gráfica puramente decorativa, tap en la card abre la pantalla completa — la interacción táctil en una gráfica pequeña dentro de un `ScrollView` compite con el gesto de scroll.
- **Sí:** ruta plana `app/(mgp-app)/exercise-progress.tsx` con params, mismo patrón que `weight-entry.tsx` — evita convertir `exercise/[id].tsx` en carpeta.
- **Sí:** presentación push normal en el Stack — más espacio vertical para la gráfica; el `formSheet` con `fitToContents` limita la altura y sus gestos de cierre chocan con el `pointerConfig`.
- **Sí:** todo el historial sin filtros de rango — alcance mínimo; los filtros (1M/3M/6M) quedan para una spec futura si el historial crece.
- **Sí:** ocultar la card de mini-gráfica con menos de 2 registros — una card con "no hay datos suficientes" es ruido en la pantalla de detalle.
- **Sí:** `weightKg` se calcula una sola vez en el `select` de `useWeightHistory` — evita duplicar la conversión en cada pantalla que grafique.

---

## Riesgos

| Riesgo                                                                                                                                        | Mitigación                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Compatibilidad de `react-native-gifted-charts` con RN 0.81 / Reanimated 4 (algunas versiones han tenido fricciones con la nueva arquitectura) | Instalar los peers con `npx expo install` (resuelve versiones compatibles con Expo 54) y verificar la gráfica en dev build como primer paso; si una versión falla, fijar la última versión estable conocida en `package.json`. |
| El gesto del tooltip (`pointerConfig`) puede chocar con el scroll vertical de la pantalla completa                                            | Diseñar la pantalla de progreso sin `ScrollView` (la gráfica y el header caben en pantalla); si hiciera falta scroll, activar el pointer con long-press.                                                                       |
| Con muchos registros las etiquetas de fecha del eje X se encimarían                                                                           | Mostrar etiquetas solo cada N puntos y/o usar el scroll horizontal interno que `LineChart` ya trae.                                                                                                                            |
| Pesos muy cercanos entre sí (ej. 75 → 77.5 kg) con eje Y desde 0 producen una línea casi plana                                                | Calcular un mínimo de eje Y dinámico cercano al mínimo de los datos (`yAxisOffset`), en vez de arrancar en 0.                                                                                                                  |

---

## Qué **no** está en esta spec

- Filtros de rango temporal (1M / 3M / 6M / Todo).
- Estadísticas resumen (máximo, mínimo, variación total).
- Interactividad en la mini-gráfica del detalle.
- Selector de unidad de visualización.
- Gráficas agregadas de varios ejercicios.

Cada una de esas, si algún día entra, va en su propia spec.
