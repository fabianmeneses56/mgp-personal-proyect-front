# Spec 04 — Imagen del ejercicio (subida y edición)

- **Estado:** Approved
- **Dependencias:**
  - Backend spec `02-cloudflare-r2-image-upload.md` — `POST /exercises` y `PATCH /exercises/:id` ya aceptan `multipart/form-data` con campo `image` y devuelven `imageUrl` con URL pública de R2
  - Spec 03 (`03-integracion-historico-pesos-backend.md`) — patrón de mutaciones/React Query ya establecido en `exercise/[id].tsx`
- **Fecha:** 2026-07-02

**Objetivo:** Permitir seleccionar una imagen de la galería al crear un ejercicio y reemplazarla desde la pantalla de detalle, enviando el archivo como `multipart/form-data` a los endpoints ya existentes en el backend.

---

## Alcance

### Incluye

- Selector de imagen desde galería (`expo-image-picker`, nueva dependencia) en:
  - El modal "Nuevo ejercicio" de `app/(mgp-app)/category/[id].tsx` — imagen opcional al crear.
  - La pantalla de detalle `app/(mgp-app)/exercise/[id].tsx` — botón "Cambiar imagen" en el `heroCard` que reemplaza la imagen de un ejercicio existente.
- Hook reutilizable `usePickExerciseImage` que encapsula: pedir permiso de galería, lanzar el picker, validar mimetype (jpeg/png/webp) y tamaño (≤5MB si el asset lo expone), y devolver el asset seleccionado o `null`.
- Cambio de `createExercise` para enviar siempre `multipart/form-data` (con o sin imagen), en vez de JSON.
- Nueva action `updateExerciseImage` — `PATCH /exercises/:id` solo con el campo `image` (no incluye nombre, peso ni unidad).
- Campo `imageUrl?: string` agregado a la interfaz `Exercise` y propagado como parámetro de navegación desde la card de ejercicio hacia el detalle.
- Visualización de la imagen (o un placeholder si no existe) en el `heroCard` de `exercise/[id].tsx`, usando `expo-image` (ya instalado).
- Actualización inmediata del `imageUrl` mostrado en el detalle tras un cambio exitoso, vía estado local sembrado desde el param y actualizado en `onSuccess` de la mutación.
- Invalidación de `["categories"]` al completar la subida/actualización de imagen, para que la lista de ejercicios y el resto de la app reflejen el cambio.

### No incluye

- Edición de nombre, peso o unidad del ejercicio (sigue sin existir ninguna action de update para esos campos; queda para un spec futuro).
- Selección de imagen por cámara (solo galería).
- Mostrar miniatura de imagen en las cards de la lista de ejercicios (`category/[id].tsx`) — el spec solo cubre el detalle.
- Eliminar la imagen de un ejercicio sin reemplazarla (no hay botón "Quitar imagen").
- Recorte/edición de la imagen antes de subir (crop, rotar, filtros).
- Manejo de estado offline o reintentos de subida.
- Cambios al endpoint o lógica del backend (ya implementados según el spec 02 del backend).

---

## Modelo de datos

### Cambio en `Exercise` (`core/categories/interfaces/category.interface.ts`)

```ts
export interface Exercise {
  id?: string;
  name: string;
  weightGrams?: number;
  weight?: number;
  weightUnit?: string;
  category?: string;
  imageUrl?: string; // nuevo
}
```

### Interfaz nueva: `PickedExerciseImage`

En `core/exercises/interfaces/picked-exercise-image.interface.ts`. Representa el asset ya validado, listo para adjuntar a un `FormData`:

```ts
export interface PickedExerciseImage {
  uri: string;
  mimeType: string; // "image/jpeg" | "image/png" | "image/webp"
  fileName: string;
}
```

### Payload de creación (`core/exercises/actions/create-exercise.action.ts`)

```ts
export interface CreateExercisePayload {
  name: string;
  weight: number;
  weightUnit: string;
  category: string;
  image?: PickedExerciseImage;
}
```

Se serializa como `FormData` (siempre, con o sin `image`):

```
name: string
weight: string        // Number(weight) convertido a string
weightUnit: string
category: string
image?: { uri, name: fileName, type: mimeType }   // solo si hay imagen
```

### Payload de actualización de imagen

`updateExerciseImage(exerciseId: string, image: PickedExerciseImage)` — el `FormData` solo lleva el campo `image`:

```
image: { uri, name: fileName, type: mimeType }
```

### Validación en `usePickExerciseImage`

- Mimetype permitido: `image/jpeg`, `image/png`, `image/webp`. Si el asset devuelve otro mimetype, se muestra `Alert.alert` y no se retorna imagen.
- Tamaño: si `asset.fileSize` está disponible y supera `5 * 1024 * 1024` bytes, se muestra `Alert.alert` y no se retorna imagen. Si `fileSize` no está disponible (algunos dispositivos/plataformas no lo exponen), no se bloquea — el backend es la validación final.
- Si el usuario cancela el picker o no concede el permiso de galería, se retorna `null` sin mostrar error (permiso denegado sí muestra un `Alert` indicando que debe habilitarlo).

---

## Plan de implementación

1. **Instalar `expo-image-picker`** (`npx expo install expo-image-picker`) y agregar el plugin/permisos necesarios en `app.json` si el paquete lo requiere (permiso de acceso a galería en iOS/Android).

2. **Crear la interfaz `PickedExerciseImage`** en
   `core/exercises/interfaces/picked-exercise-image.interface.ts`.

3. **Crear el hook `usePickExerciseImage`** en
   `presentation/exercises/hooks/usePickExerciseImage.ts`:
   - Expone `pickImage: () => Promise<PickedExerciseImage | null>`.
   - Pide permiso con `ImagePicker.requestMediaLibraryPermissionsAsync()`; si se deniega, `Alert.alert` y retorna `null`.
   - Lanza `ImagePicker.launchImageLibraryAsync({ mediaTypes: Images, quality: 0.8 })`; si el usuario cancela, retorna `null`.
   - Valida mimetype y tamaño según lo definido en el modelo de datos; si falla, `Alert.alert` y retorna `null`.
   - Si todo es válido, arma y retorna un `PickedExerciseImage` (con `fileName` derivado del `uri`/mimetype si el asset no trae nombre).

4. **Agregar `imageUrl?: string`** a la interfaz `Exercise` en
   `core/categories/interfaces/category.interface.ts`.

5. **Modificar `core/exercises/actions/create-exercise.action.ts`**:
   - `CreateExercisePayload` gana el campo opcional `image?: PickedExerciseImage`.
   - El body deja de enviarse como JSON y se construye como `FormData` (siempre), con header `Content-Type: multipart/form-data`.
   - Se mantiene el mismo patrón de manejo de error (`isAxiosError` + `throw new Error`).

6. **Crear `core/exercises/actions/update-exercise-image.action.ts`**:
   - `updateExerciseImage(exerciseId: string, image: PickedExerciseImage): Promise<Exercise>`.
   - `PATCH /exercises/:exerciseId` con `FormData` que solo lleva `image`.
   - Mismo patrón de error que las demás actions de exercises.

7. **Modificar el modal "Nuevo ejercicio" en `app/(mgp-app)/category/[id].tsx`**:
   - Nuevo estado `selectedImage: PickedExerciseImage | null`.
   - Botón "Agregar imagen" (usa `usePickExerciseImage().pickImage()`); si retorna un asset, se guarda en `selectedImage` y se muestra una miniatura de vista previa (`expo-image`) con opción de "Quitar" (limpia el estado, no llama al backend).
   - `handleCreateExercise` incluye `image: selectedImage ?? undefined` en el payload de `exerciseMutation.mutate`.
   - `closeModal` también resetea `selectedImage`.
   - En `renderExerciseCard`, agregar `imageUrl: String(item.imageUrl ?? "")` a los `params` del `router.push` hacia `/exercise/[id]`.

8. **Modificar `app/(mgp-app)/exercise/[id].tsx`**:
   - Agregar `imageUrl` a los params leídos por `useLocalSearchParams`.
   - Nuevo estado local `currentImageUrl: string | undefined`, sembrado desde el param al montar.
   - En el `heroCard`, renderizar la imagen con `expo-image` si `currentImageUrl` existe; si no, un placeholder (ícono `image-outline` sobre `borderColor`).
   - Botón "Cambiar imagen" debajo/encima de la imagen: llama a `pickImage()`; si retorna un asset, dispara inmediatamente `updateImageMutation.mutate({ exerciseId: String(id), image })` (sin paso de confirmación intermedio).
   - `updateImageMutation` (`useMutation` inline, mismo patrón que `deleteExerciseMutation`): en `onSuccess`, actualiza `currentImageUrl` con `data.imageUrl` e invalida `["categories"]`; en `onError`, `Alert.alert` con el mensaje de error.

9. **Verificación manual**:
   - Crear un ejercicio sin imagen → se guarda igual que antes (`imageUrl: null` desde el backend).
   - Crear un ejercicio con una imagen válida (jpeg/png/webp, <5MB) → aparece en el detalle con la imagen subida.
   - Intentar seleccionar un archivo con mimetype no soportado o mayor a 5MB (si el dispositivo expone `fileSize`) → se bloquea antes de llamar al backend, con `Alert`.
   - Desde el detalle de un ejercicio sin imagen, presionar "Cambiar imagen" y seleccionar una → aparece el placeholder reemplazado por la imagen real tras la mutación.
   - Desde el detalle de un ejercicio con imagen, cambiarla por otra → la imagen se reemplaza y el objeto anterior se elimina en R2 (verificable indirectamente porque el backend ya lo garantiza).
   - Volver a la lista de ejercicios y reingresar al detalle → la imagen persiste (viene del backend a través del param actualizado por navegación, o de una nueva consulta si se navega de nuevo).

---

## Criterios de aceptación

- [ ] Al crear un ejercicio sin seleccionar imagen, la petición se envía como `multipart/form-data` y el ejercicio se crea normalmente (comportamiento equivalente al actual).
- [ ] Al crear un ejercicio seleccionando una imagen válida (jpeg/png/webp, ≤5MB) desde la galería, el ejercicio se crea con `imageUrl` apuntando a la URL pública devuelta por el backend.
- [ ] Si el archivo seleccionado tiene un mimetype no soportado, se muestra un `Alert` y no se llama al backend.
- [ ] Si el archivo seleccionado supera 5MB y el dispositivo expone `fileSize`, se muestra un `Alert` y no se llama al backend.
- [ ] Si el usuario cancela el picker de galería, no se produce ningún error visible ni se modifica el estado del formulario.
- [ ] Si se deniega el permiso de acceso a galería, se muestra un `Alert` indicando que debe habilitarse manualmente.
- [ ] En la pantalla de detalle de un ejercicio sin imagen, se muestra un placeholder en el `heroCard`.
- [ ] En la pantalla de detalle de un ejercicio con imagen, se muestra la imagen real en el `heroCard`.
- [ ] Al presionar "Cambiar imagen" en el detalle y seleccionar una imagen válida, se llama a `PATCH /exercises/:id` con la nueva imagen y, al completarse, la imagen mostrada se actualiza sin necesidad de recargar la pantalla.
- [ ] Si la mutación de cambio de imagen falla, se muestra un `Alert.alert` con el mensaje de error y la imagen mostrada no cambia.
- [ ] Tras cambiar la imagen desde el detalle, la query `["categories"]` se invalida (verificable porque la próxima carga de la lista de ejercicios refleja el cambio).
- [ ] No existe ninguna acción de edición de nombre, peso o unidad del ejercicio agregada por este spec — `updateExerciseImage` solo envía el campo `image`.
- [ ] No se agrega opción de cámara ni de "quitar imagen sin reemplazar" en ninguna pantalla.

---

## Decisiones tomadas y descartadas

- **`updateExerciseImage` solo maneja imagen** — se descartó una edición completa (nombre/peso/unidad) porque hoy no existe ninguna action de update para esos campos en el front (la única existente es `createExercise`); mezclar ambas cosas en este spec hubiera duplicado el alcance del backend spec 02, que solo trata imagen. La edición de los demás campos queda para un spec futuro.

- **`createExercise` siempre envía `FormData`, con o sin imagen** — se descartó mantener JSON para el caso sin imagen porque el backend usa `FileInterceptor` de forma incondicional en `POST /exercises`; tener dos formatos de body distintos según haya o no imagen hubiera sido más frágil que un único formato consistente.

- **Solo galería, sin cámara** — se descartó ofrecer ambas fuentes porque cámara requiere gestionar un permiso adicional y una UI de selección (Alert/ActionSheet) que no aporta valor claro en esta primera versión; puede agregarse después sin romper el hook `usePickExerciseImage`.

- **Hook `usePickExerciseImage` reutilizable** en vez de duplicar la lógica de selección/validación en el modal de creación y en el detalle — ambos flujos necesitan exactamente el mismo comportamiento (permiso, picker, validación), así que centralizarlo evita divergencia.

- **Cambio de imagen en el detalle se dispara inmediatamente al seleccionar** (sin paso de confirmación ni botón "Guardar" separado) — se descartó un flujo de dos pasos (seleccionar → confirmar) porque agrega fricción sin beneficio: si el usuario se arrepiente, puede volver a presionar "Cambiar imagen" y elegir otra.

- **`imageUrl` en el detalle vive en estado local sembrado desde el param de navegación** (no se deriva de `useCategories`) — se descartó consumir `categoriesQuery.data` en el detalle porque hoy esa pantalla no depende de React Query para sus datos base (solo para las mutaciones); introducir esa dependencia hubiera sido un cambio de patrón más grande de lo que pide este spec. La consistencia se logra igual porque la mutación invalida `["categories"]`, que es lo que ve la lista al volver.

- **Validación de tamaño en el front es best-effort** (`fileSize` puede no estar disponible) — se descartó bloquear la subida cuando `fileSize` es `undefined`, porque eso impediría subir imágenes válidas en plataformas donde el picker no expone ese dato; el backend sigue siendo la validación autoritativa.

- **No se muestra miniatura en las cards de la lista de ejercicios** — se descartó por alcance: el usuario pidió explícitamente foco en "la sección del ejercicio" (el detalle), no en el listado.

---

## Riesgos identificados

- **`expo-image-picker` es una dependencia nativa** — en proyectos con Expo Go puede funcionar sin rebuild, pero si el proyecto usa un dev client custom conviene verificar que el permiso de galería esté declarado correctamente en `app.json`/`Info.plist`/`AndroidManifest` antes de probar en dispositivo físico.

- **Diferencias de permisos entre iOS y Android** — el flujo de `requestMediaLibraryPermissionsAsync` y el mensaje que ve el usuario al denegar varían por plataforma; hay que probar el caso de denegación en ambas.

- **`FormData` con archivos en React Native tiene quirks conocidos** — el objeto `{ uri, name, type }` no es un `Blob` real; algunas versiones de Android requieren que el `uri` tenga el prefijo `file://` explícito. Si la subida falla silenciosamente en Android, este es el primer sospechoso.

- **`fileSize` no siempre disponible** — como se documentó en las decisiones, la validación de tamaño en el front puede no dispararse en todos los dispositivos; el riesgo real de subir un archivo >5MB queda cubierto por el backend (ya devuelve 400), no por el front.

- **Objetos huérfanos en R2** — si la mutación de `updateExerciseImage` falla en el front después de que el backend ya subió el archivo (p. ej. corte de red en la respuesta), es un riesgo ya aceptado y documentado en el spec del backend, no algo que este spec del front deba mitigar.
