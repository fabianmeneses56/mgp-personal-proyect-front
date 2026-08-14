# Spec 13 — Pantalla de actividad reciente

- **Estado:** Approved
- **Dependencias:**
  - Backend `05-feed-actividad-reciente.md` (Approved, repo `mgp-personal-proyect`)
    — define `GET /api/activity?limit=N` y el shape de cada item. **Esta spec no se
    puede probar hasta que ese endpoint esté desplegado en el backend de desarrollo
    de la LAN.**
  - Spec `03-integracion-historico-pesos-backend.md` (Implemented) — de ahí se
    reutiliza `toDisplayWeight()` para formatear `weightGrams` + `weightUnit`.
  - Spec `08-infraestructura-tests.md` (Implemented) — los tests nuevos siguen su
    patrón (mock de `mgpApi`, wrapper de React Query).
  - Spec `05-manejo-sesion-expirada.md` (Implemented) — el 401 del endpoint lo
    maneja el interceptor global; esta spec no lo trata.
- **Fecha:** 2026-08-14

**Objetivo:** Añadir una pantalla `app/(mgp-app)/activity.tsx`, accesible desde el
header del home, que muestre en solo lectura las últimas 20 creaciones y ediciones
del usuario (categorías, ejercicios y pesos) agrupadas por día.

---

## Alcance

### Incluye

**Capa core**

- `core/activity/interfaces/activity.interface.ts` — tipos `ActivityType`,
  `ActivityAction` y `ActivityItem`, espejo exacto del shape que devuelve el
  backend.
- `core/activity/actions/get-activity.action.ts` — `getActivity(limit = 20)` sobre
  `mgpApi.get("/activity", { params: { limit } })`. Sigue la convención de
  `core/weight-history`: lanza `Error` con el mensaje del backend cuando falla (no
  devuelve `null`).

**Capa presentation**

- `presentation/activity/hooks/useActivity.ts` — `useQuery` con key `["activity"]`,
  expone `activityQuery`.
- `presentation/activity/utils/group-activity-by-day.ts` — agrupa los items (ya
  ordenados desc por el backend) en secciones por día, con título `"Hoy"`,
  `"Ayer"` o fecha corta (`"12 ago"`).
- `presentation/activity/components/ActivityRow.tsx` — una fila: ícono Ionicons en
  círculo según `type`, frase en primera persona y hora (`14:35`) a la derecha.
- `presentation/activity/components/ActivityHeaderButton.tsx` — ícono
  `time-outline` para el `headerRight` del home, navega a `/activity`.

**Capa app**

- `app/(mgp-app)/activity.tsx` — `SectionList` con las secciones del util,
  `RefreshControl` (pull-to-refresh), estado de carga, estado vacío y estado de
  error con botón "Reintentar", copiando el patrón visual del home.
- `app/(mgp-app)/_layout.tsx` — nueva `Stack.Screen name="activity"` con título
  `"Actividad"`, y el `headerRight` del home pasa a renderizar
  `ActivityHeaderButton` + `AddNewButton`.

**Copy de las filas** (`description` es el snapshot que manda el backend):

| type             | action    | Texto                                                   |
| ---------------- | --------- | ------------------------------------------------------- |
| `category`       | `created` | Creaste la categoría **{description}**                  |
| `category`       | `updated` | Editaste la categoría **{description}**                 |
| `exercise`       | `created` | Creaste el ejercicio **{description}**                  |
| `exercise`       | `updated` | Editaste el ejercicio **{description}**                 |
| `weight_history` | `created` | Registraste **{peso}** en **{description}**             |
| `weight_history` | `updated` | Editaste un registro de **{peso}** en **{description}** |

Donde `{peso}` es `toDisplayWeight(weightGrams, weightUnit)` + la unidad (ej.
`80 kg`).

**Tests**

- `core/activity/actions/__tests__/get-activity.action.test.ts` — mock de
  `mgpApi`, verifica el `limit` enviado y el mensaje de error propagado.
- `presentation/activity/hooks/__tests__/useActivity.test.tsx` — con el wrapper de
  React Query de `test-utils/`.
- `presentation/activity/utils/__tests__/group-activity-by-day.test.ts` —
  agrupación y títulos "Hoy"/"Ayer"/fecha.

### No incluye (para specs futuras)

- **Navegación desde el feed.** Ningún item es tocable. Navegar exigiría params que
  el backend no da (`entityId` de un peso es la entrada, no el ejercicio) y manejar
  recursos ya borrados.
- **Paginación o "ver más".** Siempre `limit=20`, un solo request. El backend no
  tiene `offset` ni cursor.
- **Filtros por tipo, rango de fechas o búsqueda.** El backend no los expone.
- **Registro de eliminaciones.** El backend solo emite creaciones y ediciones.
- **Invalidar `["activity"]` desde las mutaciones existentes.** Ningún hook de
  `categories`, `exercises` ni `weight-history` se toca; el feed se actualiza al
  entrar a la pantalla y con pull-to-refresh.
- **Badge de "novedades" o contador de no leídos.** Requiere estado local
  persistido; spec propia si entra.
- **Actividad en el home.** El home no cambia salvo el botón nuevo del header.
- **Flow E2E de Maestro.** Los E2E de la spec 12 no se tocan; entra cuando el
  endpoint lleve tiempo estable en el backend de desarrollo.
- **Tiempo relativo ("hace 2 h")** ni auto-refresco por temporizador.
- **Cambios en el backend.** Esta spec consume el contrato de la spec 05 tal como
  está.

---

## Modelo de datos

Esta feature no persiste nada en el dispositivo: todo lo que define son los tipos
que cruzan `core → presentation → app`. No hay `SecureStore`, `AsyncStorage` ni
cache propia más allá de la de React Query.

### Tipos del backend (`core/activity/interfaces/activity.interface.ts`)

```ts
export type ActivityType = "category" | "exercise" | "weight_history";
export type ActivityAction = "created" | "updated";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: ActivityAction;
  entityId: string;
  description: string; // snapshot del nombre al momento de la acción
  weightGrams: number | null; // solo type = "weight_history"
  weightUnit: string | null; // "kg" | "lb" | "g" | null
  createdAt: string; // ISO string
}
```

Uniones de strings en vez de `enum`, igual que `WeightHistoryApiEntry.weightUnit`,
que ya usa `string` con el comentario de valores posibles.

`ActivityItem` es el shape crudo del backend y viaja sin transformar hasta la fila:
el formateo de peso y de hora ocurre en render, no en el action.

### Secciones de la lista (`presentation/activity/utils/group-activity-by-day.ts`)

```ts
export interface ActivitySection {
  title: string; // "Hoy" | "Ayer" | "12 ago"
  dayKey: string; // "2026-08-14", clave estable para keyExtractor
  data: ActivityItem[]; // orden del backend (createdAt DESC), sin reordenar
}

export function groupActivityByDay(
  items: ActivityItem[],
  now?: Date, // inyectable para los tests; default new Date()
): ActivitySection[];
```

Convenciones:

- El agrupado usa la **fecha local del dispositivo**, no UTC: `createdAt` viene en
  UTC y un registro de las 23:00 local debe caer en "Hoy", no en el día siguiente.
- `dayKey` se arma con los getters locales (`getFullYear`/`getMonth`/`getDate`), no
  con `toISOString()`.
- Un `createdAt` inválido no revienta la pantalla: el item cae en una sección con
  `dayKey: "invalid"` y título con la fecha cruda. Mismo espíritu que
  `toTimestamp()`, que devuelve `0` en vez de `NaN`.
- El util **no ordena**: confía en el `createdAt DESC` del backend. Si el orden
  cambiara, es un bug del backend, no algo que el front parchee en silencio.

### Contrato del hook (`presentation/activity/hooks/useActivity.ts`)

```ts
export const useActivity = () => {
  const activityQuery = useQuery({
    queryKey: ["activity"],
    queryFn: () => getActivity(ACTIVITY_LIMIT), // ACTIVITY_LIMIT = 20
  });

  return { activityQuery };
};
```

Misma forma que `useCategories`: devuelve el objeto de query entero y la pantalla
decide qué hacer con `isLoading`, `isError`, `isRefetching` y `refetch`.

### Íconos y copy por tipo

Un solo mapa en `ActivityRow.tsx`, sin lógica dispersa:

```ts
const ACTIVITY_ICON: Record<ActivityType, keyof typeof Ionicons.glyphMap> = {
  category: "folder-outline",
  exercise: "barbell-outline",
  weight_history: "trending-up-outline",
};
```

---

## Plan de implementación

Cada paso deja la app arrancando (`npm run start`), `npm test` en verde y
`npm run lint` limpio. Los pasos 1–4 no dependen del backend desplegado; del 5 en
adelante la verificación manual sí requiere el endpoint arriba en el backend de
desarrollo.

1. **Tipos y action.** Crear `core/activity/interfaces/activity.interface.ts` con
   `ActivityType`, `ActivityAction` e `ActivityItem`, y
   `core/activity/actions/get-activity.action.ts` con `getActivity(limit = 20)`.
   Copiar el manejo de error de `get-weight-history.action.ts`: `isAxiosError` →
   mensaje del backend, si no `"Error al obtener la actividad reciente"`.

2. **Test del action.** `core/activity/actions/__tests__/get-activity.action.test.ts`
   con `jest.mock("@/core/api/mgpApi", ...)`: verifica la ruta `/activity`, el
   `params: { limit: 20 }`, el `limit` explícito, y que un error de axios propaga el
   mensaje del backend.

3. **Util de agrupación + su test.**
   `presentation/activity/utils/group-activity-by-day.ts` con
   `groupActivityByDay(items, now?)`, y `__tests__/group-activity-by-day.test.ts`
   cubriendo: "Hoy", "Ayer", fecha corta, items del mismo día en una sola sección,
   lista vacía → `[]`, y `createdAt` inválido → sección `"invalid"` sin excepción.

4. **Hook + su test.** `presentation/activity/hooks/useActivity.ts` con
   `ACTIVITY_LIMIT = 20` y la query `["activity"]`. Test con el wrapper de
   `test-utils/query-wrapper.tsx`: llama al action con 20 y expone los datos.

5. **Pantalla mínima y ruta.** `app/(mgp-app)/activity.tsx` que renderiza un
   `SectionList` sin adornos con los datos del hook, y `Stack.Screen name="activity"`
   con título `"Actividad"` en `app/(mgp-app)/_layout.tsx`. Verificación manual:
   `router.navigate("/activity")` desde el home muestra los items reales del backend.

6. **Botón de acceso.** `presentation/activity/components/ActivityHeaderButton.tsx`
   (Ionicons `time-outline`, mismo tamaño de hit area y `Haptics.selectionAsync()`
   que `AddNewButton`), y el `headerRight` de `(home)/index` pasa a devolver una
   `View` en fila con `ActivityHeaderButton` + `AddNewButton`. Verificación: el
   ícono aparece en el header del home y navega.

7. **Fila con diseño.** `presentation/activity/components/ActivityRow.tsx`: círculo
   `primarySoft` con el ícono del tipo, frase en primera persona con el nombre en
   `defaultSemiBold`, hora `HH:mm` a la derecha en `textFaint`. El peso se formatea
   con `toDisplayWeight(weightGrams, weightUnit)` importado de
   `@/core/weight-history/interfaces/weight-history.interface`. La pantalla pasa a
   usarla en `renderItem` y renderiza los títulos de sección con
   `renderSectionHeader`.

8. **Estados de la pantalla.** Carga con la tarjeta + `ActivityIndicator` del home,
   vacío ("Aún no hay actividad" + explicación), error (mensaje + "Reintentar" que
   llama `refetch()`) y `RefreshControl` enganchado a `isRefetching` / `refetch`.

9. **Documentación.** Añadir la feature `activity` a la sección Architecture de
   `CLAUDE.md` (una línea en `core/` y otra en `presentation/`, junto a `auth`,
   `categories`, `exercises`).

---

## Criterios de aceptación

- [ ] El header del home muestra el ícono de actividad a la izquierda del botón "+",
      y tocarlo abre una pantalla con título "Actividad".
- [ ] Con el endpoint respondiendo datos, la pantalla lista como máximo 20 items,
      del más reciente al más antiguo.
- [ ] Los items están agrupados bajo encabezados de día: "Hoy", "Ayer" y fecha corta
      (`12 ago`) para el resto.
- [ ] Un registro creado hoy a las 23:00 hora local aparece bajo "Hoy" (no bajo el
      día siguiente).
- [ ] Cada fila muestra ícono según el tipo: carpeta para categoría, mancuerna para
      ejercicio, flecha ascendente para peso.
- [ ] Una categoría creada se lee "Creaste la categoría {nombre}"; editada,
      "Editaste la categoría {nombre}". Lo mismo para ejercicios con "el ejercicio".
- [ ] Un peso creado se lee "Registraste 80 kg en {ejercicio}" con el valor
      convertido desde `weightGrams` según `weightUnit`; editado, "Editaste un
      registro de 80 kg en {ejercicio}".
- [ ] Cada fila muestra la hora en formato `HH:mm` a la derecha.
- [ ] Tocar una fila no hace nada: no navega, no abre alertas, no cambia de pantalla.
- [ ] Deslizar hacia abajo dispara `refetch()` y muestra el indicador de refresco.
- [ ] Salir de la pantalla y volver a entrar trae la actividad actualizada sin
      reiniciar la app.
- [ ] Con el feed vacío se ve la tarjeta "Aún no hay actividad" y ningún encabezado
      de día.
- [ ] Si el endpoint falla (500, red caída o endpoint inexistente), se ve la tarjeta
      de error con "Reintentar", y el botón vuelve a lanzar la petición.
- [ ] Mientras carga por primera vez se ve la tarjeta con spinner, no una lista
      vacía.
- [ ] Ninguna otra pantalla cambia de comportamiento: crear o editar categorías,
      ejercicios y pesos funciona exactamente igual que antes.
- [ ] `npm test` pasa, incluyendo los tres archivos nuevos de test.
- [ ] `npm run lint` pasa sin warnings nuevos.
- [ ] `CLAUDE.md` menciona la feature `activity` en `core/` y `presentation/`.

---

## Decisiones tomadas y descartadas

- **Sí:** pantalla propia (`app/(mgp-app)/activity.tsx`) accesible desde el header
  del home. **No:** sección dentro del home ni sheet nativo. El home ya tiene su
  propia query y su hero; meter el feed ahí alarga el scroll y mezcla dos fuentes de
  datos en una pantalla. El sheet, con `fitToContents`, es mal contenedor para una
  lista larga.

- **No:** navegación desde las filas. El feed es solo lectura. `category/[id]` y
  `exercise/[id]` reciben `name` y `data` por params, que el feed no tiene, y el
  `entityId` de un peso apunta a la entrada, no al ejercicio dueño. Habilitar
  navegación exigiría refactorizar esas rutas o cambiar el backend, y además
  obligaría a manejar el caso del recurso ya borrado (el log sobrevive al borrado,
  por diseño del backend). Si se quiere, va en spec propia.

- **Sí:** `limit=20` fijo, un solo request. **No:** botón "ver más" ni paginación. El
  backend no expone `offset` ni cursor y tapa en 50; la pantalla es "actividad
  reciente", no un historial navegable.

- **Sí:** encabezados por día + hora en la fila. **No:** tiempo relativo
  ("hace 2 h"). El relativo queda desactualizado si la pantalla sigue abierta y
  obliga a un temporizador o a recalcular en cada render para algo que no aporta
  precisión.

- **Sí:** refetch al montar la pantalla + pull-to-refresh. **No:** invalidar
  `["activity"]` desde los hooks de categorías, ejercicios y pesos. Tocaría ~6 hooks
  existentes para nada: el registro en el backend es fire-and-forget, así que
  invalidar justo tras la mutación puede refetchear antes de que la fila exista y
  mostrar un feed incompleto. Entrar a la pantalla ya trae datos frescos.

- **Sí:** `ActivityItem` viaja crudo desde el action hasta la fila. **No:** un tipo
  "de dominio" transformado como `WeightHistoryEntry`. Esa transformación existe
  porque el histórico ordena y compara por `timestamp`; aquí el backend ya manda
  todo ordenado y el único cálculo (peso legible, hora) es de presentación pura.

- **Sí:** reutilizar `toDisplayWeight()` de `core/weight-history/interfaces`.
  **No:** duplicar la conversión en `activity`. Es la misma conversión de
  `weightGrams` + unidad que ya se probó en la spec 03; duplicarla abre la puerta a
  que las dos versiones se separen.

- **Sí:** uniones de strings (`"category" | "exercise" | "weight_history"`) para los
  tipos. **No:** `enum` de TypeScript. El repo no usa `enum` en ningún `interface*/`
  y `weightUnit` ya es un `string` documentado con comentario.

- **Sí:** el action lanza `Error` con el mensaje del backend. **No:** devolver `null`
  como hace `auth-actions.ts`. La convención de `core/weight-history` y
  `core/categories` es lanzar, y React Query necesita el throw para poblar
  `isError`.

- **Sí:** agrupar por fecha **local** del dispositivo. **No:** agrupar por la fecha
  UTC del `createdAt`. Con UTC, un entrenamiento de las 23:00 en Colombia (UTC-5)
  aparecería bajo el día siguiente, que es visiblemente incorrecto para el usuario.

- **Sí:** el util de agrupación respeta el orden que llega. **No:** reordenar
  defensivamente en el front. El backend garantiza `createdAt DESC` con un índice
  hecho para eso; reordenar escondería una regresión suya en vez de exponerla.

- **Sí:** Ionicons en círculo `primarySoft`. **No:** emoji. Toda la app usa Ionicons
  y el círculo repite el lenguaje visual de los badges del home.

- **Sí:** tests de action, hook y util de agrupación. **No:** flow E2E de Maestro en
  esta spec. Los flows de la spec 12 corren contra el backend real de desarrollo;
  hasta que el endpoint lleve tiempo desplegado ahí, un flow nuevo sería un test
  rojo por infraestructura, no por código.

---

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                           | Mitigación                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **El endpoint no existe todavía en el backend de desarrollo.** La spec 05 del backend está `Approved`, no implementada. Sin ella, la pantalla solo puede verse en su estado de error.                                                            | Los pasos 1–4 del plan (tipos, action, util, hook y sus tests) no dependen del backend y se pueden completar y commitear igual. Del paso 5 en adelante la verificación manual queda bloqueada hasta que el endpoint esté arriba; el estado de error de la pantalla es exactamente lo que se ve mientras tanto, así que no hay pantalla en blanco ni crash. |
| **Registro best-effort en el backend: acciones que no aparecen en el feed.** Si el insert del log falla, la operación de dominio responde `200` igual y la fila nunca existe. El usuario ve que creó un ejercicio pero no lo ve en su actividad. | Fuera del control del front: no hay forma de distinguir "no se registró" de "todavía no llegó". El pull-to-refresh permite reintentar; si el hueco se vuelve frecuente, es un bug del backend que se rastrea en sus logs, no algo que esta pantalla parchee.                                                                                               |
| **`description` desincronizada tras un rename.** Renombrar "Press banca" a "Press de banca" deja las filas viejas mostrando el nombre anterior, y puede leerse como un bug.                                                                      | Es el comportamiento deliberado del log del backend, ya documentado en su spec 05. La pantalla no intenta resolver el nombre actual: sin navegación desde las filas, el nombre viejo es solo contexto histórico y no lleva al usuario a ningún sitio equivocado.                                                                                           |
| **Un `weightUnit` desconocido rompe el formateo.** `toDisplayWeight()` trata cualquier unidad que no sea `"kg"` ni `"lb"` como gramos, así que un valor inesperado mostraría un número enorme.                                                   | El backend reutiliza su `WeightUnit` enum, que es la misma fuente que ya alimenta el histórico de pesos. El riesgo es idéntico al que la spec 03 ya asumió, y una fila con el número raro no rompe el render.                                                                                                                                              |
| **El header del home se llena.** Pasa de una acción a dos en el lado derecho, más el logout a la izquierda. En pantallas pequeñas puede quedar apretado.                                                                                         | Son dos íconos sin texto en un header cuyo título es corto ("Categorias"). Si más adelante hace falta una tercera acción, el sitio correcto es un menú, y eso sería spec propia.                                                                                                                                                                           |

---

## Lo que **no** entra en esta spec

- Navegación desde las filas del feed hacia la categoría, el ejercicio o el registro
  de peso.
- Paginación, "ver más" o cualquier forma de pasar de 20 items.
- Filtros por tipo, por rango de fechas o búsqueda.
- Registro de eliminaciones en el feed.
- Badge de novedades, contador de no leídos o cualquier estado de "visto".
- Invalidación de `["activity"]` desde las mutaciones existentes.
- Flow E2E de Maestro.
- Cambios en el backend.

Cada una de esas, si entra, va en su propia spec.
