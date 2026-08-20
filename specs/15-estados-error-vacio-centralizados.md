# Spec 15 — Estados de error y vacío centralizados en `presentation/common`

- **Estado:** Implemented
- **Dependencias:**
  - Ninguna spec es requisito. Se apoya en `useThemeColors()` (refactor ya
    mergeado, ver `CLAUDE.md` → "Reading theme colors").
- **Fecha:** 2026-08-20

**Objetivo:** Crear `ErrorState` y `EmptyState` en
`presentation/common/components/`, sobre una tarjeta base `StateCard`, y migrar
a ellos los 7 sitios que hoy repiten a mano el bloque "No pudimos cargar… /
Reintentar" y el bloque "Aún no hay…".

---

## Alcance

### Incluye

- Tres componentes nuevos en `presentation/common/components/`:
  - `StateCard.tsx` — chrome compartido (fondo `surface`, borde
    `surfaceBorder`, `borderRadius: 26`, padding y `gap`). No decide contenido.
  - `EmptyState.tsx` — `title` + `description` opcional, sobre `StateCard`.
  - `ErrorState.tsx` — `message` + botón de reintento, con
    `variant: "card" | "inline"`.
- Migración de los 4 estados de error:
  - `app/(mgp-app)/activity.tsx` — variante `card`.
  - `app/(mgp-app)/(home)/index.tsx` — variante `card`.
  - `app/(mgp-app)/exercise-progress.tsx` — variante `inline`.
  - `presentation/exercises/components/WeightHistory.tsx` — variante `inline`.
- Migración de los 3 estados vacíos que comparten la misma tarjeta:
  - `app/(mgp-app)/activity.tsx` ("Aún no hay actividad").
  - `app/(mgp-app)/(home)/index.tsx` ("Aun no hay categorias").
  - `app/(mgp-app)/category/[id].tsx` ("No hay ejercicios en esta categoria").
- Borrado de los estilos locales que quedan sin uso: `emptyState`,
  `emptyTitle`, `emptyDescription`, `retryButton`, `retryText`,
  `historyErrorState`.

### No incluye (para specs futuras)

- Estados de **carga**. `activity.tsx` y `(home)/index.tsx` repiten el mismo
  `loadingCard` con `ActivityIndicator`, y `WeightHistory` tiene su propio
  `HistorySkeleton`; son tres tratamientos distintos y la unificación merece su
  propia decisión de diseño.
- Añadir estado de error donde hoy no lo hay. `app/(mgp-app)/exercise/[id].tsx`
  consume `isError` pero solo oculta la gráfica (`!isLoading && !isError`); dejarlo
  igual mantiene esta spec mecánica.
- Cambios de copy: ningún texto cambia respecto a `main`.
- Tests de render de los componentes nuevos —
  `specs/08-infraestructura-tests.md` excluye explícitamente los tests de
  componentes visuales de `presentation/`.
- Iconografía, ilustraciones o uso de los tokens `danger*` en los estados de
  error (hoy todos usan `textFaint` + `primary`).

---

## Modelo de datos

No hay datos persistidos ni cambios de backend. Lo nuevo es el contrato de los
tres componentes:

```tsx
// presentation/common/components/StateCard.tsx
interface props {
  children: ReactNode;
  /** Espaciado externo del sitio de uso (p. ej. el `marginTop` de una lista). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// presentation/common/components/EmptyState.tsx
interface props {
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// presentation/common/components/ErrorState.tsx
interface props {
  /** Qué falló, en una frase. P. ej. "No pudimos cargar tu actividad." */
  message: string;
  onRetry: () => void;
  /** `card` (por defecto) fuera de una tarjeta; `inline` dentro de una. */
  variant?: "card" | "inline";
  /** Texto del botón. Por defecto "Reintentar". */
  retryLabel?: string;
  /** Etiqueta de accesibilidad del botón. Por defecto, `retryLabel`. */
  retryAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

Convenciones:

- PascalCase + `export default`, `interface props` en minúscula, `StyleSheet.create`
  al final del archivo: el patrón de `presentation/common/components/AddNewButton.tsx`.
- Los colores se leen con `useThemeColors()` y se aplican inline sobre estilos
  estáticos, nunca aliasados a variables locales.
- El `style` externo va **último** en el array de estilos, así que el sitio de uso
  siempre puede ajustar el espaciado sin tocar el componente.
- Ningún componente conoce React Query: reciben `onRetry` como callback plano.

Uso:

```tsx
<ErrorState
  message="No pudimos cargar tu actividad."
  onRetry={() => activityQuery.refetch()}
  style={styles.emptyStateSpacing}
/>

<ErrorState
  variant="inline"
  message="No pudimos cargar el historial."
  onRetry={() => refetch()}
  retryAccessibilityLabel="Reintentar cargar el historial"
/>

<EmptyState
  title="Aún no hay actividad"
  description="Crea o edita una categoría, un ejercicio o un registro de peso y aparecerá aquí."
  style={styles.emptyStateSpacing}
/>
```

---

## Plan de implementación

1. **Crear los componentes.** `StateCard.tsx`, `EmptyState.tsx` y
   `ErrorState.tsx` en `presentation/common/components/`. Nada los usa todavía;
   el proyecto compila igual.

2. **Migrar los estados `card`.** `activity.tsx` y `(home)/index.tsx`: las dos
   ramas de `ListEmptyComponent` pasan a `<ErrorState>` / `<EmptyState>`. El
   `marginTop: 18` que traía el `emptyState` local se conserva como
   `styles.emptyStateSpacing` pasado por `style`. Borrar los cinco estilos
   locales que quedan huérfanos en cada archivo.

3. **Migrar los estados `inline`.** `exercise-progress.tsx` (pasa
   `style={styles.stateWrapper}`, que sigue usándose en las ramas de carga y de
   "menos de 2 pesos") y `WeightHistory.tsx` (sin `style`: la base ya reproduce
   su `historyErrorState`).

4. **Migrar el estado vacío restante.** `category/[id].tsx` → `<EmptyState>`.

5. **Verificación:** `npx tsc --noEmit`, `npm run lint` y `npm test` en verde, y
   `grep -rn "No pudimos cargar" app presentation` devuelve solo los `message`
   pasados a `ErrorState`.

6. **Verificación manual en iOS** de las cuatro pantallas con el backend caído
   (ver "Criterios de aceptación").

---

## Criterios de aceptación

- [x] `npx tsc --noEmit` pasa.
- [x] `npm run lint` pasa sin errores nuevos (siguen los 2 warnings
      preexistentes de `react-hooks/exhaustive-deps` en `(mgp-app)/_layout.tsx`).
- [x] `npm test` está en verde **sin modificar ningún test** (43 suites, 170 tests).
- [x] `grep -rn "Reintentar" app presentation` devuelve una sola definición del
      texto: el default de `retryLabel` en `ErrorState.tsx`.
- [x] Ningún texto de mensaje, título o botón cambió respecto a `main`.
- [ ] Con el backend caído, las cuatro pantallas muestran su mensaje y el botón
      "Reintentar", y al tocarlo se dispara el `refetch`:
      actividad, home (categorías), progreso del ejercicio e histórico de pesos.
- [ ] Los tres estados vacíos se ven igual que antes: actividad sin registros,
      home sin categorías y una categoría sin ejercicios.
- [ ] Todo lo anterior en modo claro y en modo oscuro.

---

## Decisiones

- **Sí:** `presentation/common/components/`, junto a `AddNewButton`.
  `presentation/theme/components/` está descrito en `CLAUDE.md` como primitivas
  de diseño (`Themed*` + hooks de color); un estado con copy en español y un
  callback de negocio no es una primitiva de diseño.
- **Sí:** prop `variant: "card" | "inline"` que reproduce **exactamente** el
  aspecto actual de cada sitio. Los dos looks existen por una razón real: dos de
  los cuatro estados ya viven dentro de una tarjeta y anidar otra se vería mal.
- **No:** un único look unificado para los cuatro. Habría cambiado visualmente
  `exercise-progress` y `WeightHistory` en un cambio que se quería mecánico.
- **Sí:** incluir el estado vacío además del de error. Comparten el mismo bloque
  de tarjeta byte a byte en tres archivos; migrar solo la mitad habría dejado la
  duplicación viva justo al lado del componente nuevo.
- **Sí:** `StateCard` como base compartida en vez de duplicar el chrome entre
  `EmptyState` y `ErrorState`. Es el único punto donde viven el radio, el borde y
  el padding de la tarjeta.
- **No:** que `ErrorState` reciba directamente el objeto de React Query
  (`query.isError`, `query.refetch`). Acoplaría un componente de presentación a
  la librería de datos y complicaría usarlo desde algo que no sea un `useQuery`.
- **Sí:** prop `style` para el espaciado externo. El `marginTop: 18` de las
  listas y el `paddingVertical: 40` de la tarjeta de la gráfica son decisiones
  del sitio de uso, no del componente.
- **Sí:** `retryAccessibilityLabel` opcional. `WeightHistory` ya tenía
  `accessibilityLabel="Reintentar cargar el historial"` y se conserva; el resto
  cae al default (`retryLabel`), que antes era lo que el lector de pantalla leía
  igualmente.
- **No:** tests de render. `specs/08-infraestructura-tests.md` los excluye
  explícitamente ("se prueba la lógica, no el render") y no hay ni un test de
  componente en el repo; añadir el primero aquí sería una decisión de
  infraestructura de tests, no de esta spec.
- **No:** unificar los estados de carga en la misma spec. Son tres tratamientos
  distintos (dos `loadingCard` a pantalla completa y un skeleton animado) y
  elegir uno es una decisión de diseño, no un refactor mecánico.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Al mover los estilos a los componentes, alguna pantalla cambia de aspecto sin que nadie lo note (no hay snapshot tests ni tests de render). | Los valores se copiaron literalmente de cada sitio. Las diferencias residuales son de 2px y están listadas abajo; la verificación manual en iOS (claro y oscuro) es un criterio de aceptación. |
| Los cuatro estados de error tenían valores ligeramente distintos entre sí, así que "no cambiar nada" es imposible al unificar. | Se normalizó al valor dominante y las cuatro desviaciones quedan documentadas: `category/[id].tsx` pasa de `paddingVertical: 28` a `30`; en `activity`/`(home)` el `marginBottom: 8` del título pasa a ser el `gap: 10` del contenedor; el error inline de `WeightHistory` pierde el `paddingVertical: 8` propio del texto (el contenedor ya aporta `gap: 6`); y el error inline de `exercise-progress` **gana** `accessibilityRole`/`accessibilityLabel`, que no tenía. |
| El default `variant="card"` hace fácil olvidar `variant="inline"` en un estado que ya vive dentro de una tarjeta, produciendo tarjeta dentro de tarjeta. | El default es el caso mayoritario (pantalla completa) y el error es visualmente obvio en cuanto se ve la pantalla. Documentado en el JSDoc de la prop. |
| Sin nada que lo impida, una pantalla futura vuelve a escribir el bloque a mano. | Mismo riesgo aceptado que en la spec 11 (alertas): el `grep` del criterio de aceptación permite re-auditarlo barato. |

---

## Lo que **no** entra en esta spec

- Estados de carga (`loadingCard`, `HistorySkeleton`).
- Añadir estado de error en `app/(mgp-app)/exercise/[id].tsx`.
- Cambios de copy.
- Tests de render de componentes.
- Iconos, ilustraciones o tokens `danger*` en los estados de error.
- Cambios en el backend.

Cada una de esas, si entra, va en su propia spec.
