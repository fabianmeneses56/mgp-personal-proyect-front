# Spec 07 — Upgrade a Expo SDK 57

- **Estado:** Implemented
- **Dependencias:** Ninguna spec previa — afecta la base sobre la que corren todas.
- **Fecha:** 2026-07-30

**Objetivo:** Actualizar la app de Expo SDK 54 a SDK 57 de forma incremental
(54→55→56→57), verificando en cada paso que la app compila y arranca en iOS,
y dejándola funcionando exactamente igual que hoy, sin adoptar APIs nuevas.

Requisitos de entorno ya verificados: Node v22.18 ✓ (SDK 57 exige ≥22.13),
Xcode 26.6 ✓ (exige ≥26.4), `newArchEnabled: true` ya activo ✓ (desde SDK 55
la New Architecture es obligatoria).

---

## Alcance

### Incluye

- Upgrade incremental del SDK en tres pasos: 54→55, 55→56 y 56→57. En cada paso:
  - `npx expo install expo@^NN` seguido de `npx expo install --fix` para alinear
    todas las dependencias Expo/RN con la versión del SDK.
  - `npx expo-doctor` sin errores nuevos (o con los mismos warnings preexistentes).
  - Regenerar el proyecto nativo de iOS (CNG: borrar `ios/` y dejar que
    `npx expo run:ios` haga prebuild + build).
  - Verificación mínima de arranque con el MCP de `agent-device`: abrir la app
    en el simulador de iOS, tomar un snapshot interactivo y usar refs/selectors
    (no coordenadas ni screenshots) para ejecutar el flujo de login — el flujo
    más importante de la app — y confirmar que navega a la pantalla de
    categorías.
- Arreglos de compilación/runtime que los saltos de versión exijan (imports rotos,
  APIs renombradas, cambios de tipos por React 19.2 / RN 0.86) — solo lo mínimo
  para que la app funcione igual que hoy.
- Ajuste de dependencias no-Expo si alguna rompe con RN 0.86 / Reanimated 4.5
  (candidata principal: `react-native-gifted-charts`); se sube o fija la versión
  que funcione, sin cambiar su uso en el código.
- Actualización de devDependencies acopladas al SDK (`eslint-config-expo`,
  `@types/react`, `typescript`) a las versiones que `expo install --fix` indique.
- Verificación final completa en iOS (smoke test de los flujos existentes) tras
  llegar a SDK 57.
- Un commit por paso de SDK, para poder volver a un punto estable si algo falla.

### No incluye

- Adopción de APIs nuevas del SDK 55/56/57 (native tabs, `Linking.clearInitialURL`,
  etc.) — cada una iría en su propia spec si algún día interesa.
- Migración de APIs deprecadas que sigan funcionando — decisión explícita de la
  fase de preguntas ("solo upgrade").
- Verificación en Android y web — solo iOS, según lo acordado. Android quedará
  presumiblemente funcional (mismo código JS) pero sin verificar.
- Cambios de features, refactors o limpieza de los "known inconsistencies" del
  CLAUDE.md.
- Cambios en el backend o en las variables de entorno.
- Publicación/builds de producción (EAS) — el alcance termina en el dev build local.

---

## Modelo de datos

Esta spec no introduce estructuras de datos nuevas — es un upgrade de plataforma
sin cambios de dominio.

---

## Plan de implementación

Cada paso de SDK (1–3) repite el mismo ciclo y termina con la app funcionando
y un commit. Si un paso falla y no se resuelve razonablemente rápido, se
revierte al commit anterior y se investiga antes de continuar.

1. **SDK 54 → 55**
   - `npx expo install expo@^55.0.0`, luego `npx expo install --fix`.
   - `npx expo-doctor`; resolver errores que señale (warnings preexistentes se toleran).
   - Borrar `ios/` y correr `npx expo run:ios` (prebuild + build limpios).
   - Verificación mínima con `agent-device` (MCP), recorriendo el flujo más
     importante de la app extremo a extremo, siempre por snapshot interactivo
     y refs/selectors (nunca coordenadas ni taps por screenshot):
     1. Abrir/bootear el simulador de iOS y lanzar la app.
     2. Login: snapshot de la pantalla de login, obtener refs de los campos de
        usuario/contraseña y del botón de submit, y hacer login con las
        credenciales de prueba leídas de `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`
        (variables en `.env`, nunca en texto plano en este archivo — ver
        sección "Credenciales de prueba" más abajo). Confirmar por snapshot
        que navega a la lista de categorías.
     3. Categoría: por ref, crear una categoría nueva y confirmar que aparece
        en la lista.
     4. Ejercicio + imagen: entrar a la categoría creada, por ref agregar un
        ejercicio, y subir una imagen (flujo de `expo-image-picker`, spec 04).
        Confirmar por snapshot que el ejercicio queda creado con su imagen.
     5. Histórico de pesos: entrar al ejercicio, por ref registrar 2-3 pesos
        nuevos en el histórico (specs 01–03).
     6. Gráfica: por ref abrir la mini-gráfica y la pantalla completa de
        progreso (spec 06), y tomar snapshot/screenshot para verificar que la
        gráfica de `react-native-gifted-charts` renderiza los pesos
        registrados correctamente (sin crash, sin glitches, con los puntos
        esperados) en tema claro y oscuro.
   - Commit: `chore: upgrade to Expo SDK 55`.

2. **SDK 55 → 56** — mismo ciclo, incluyendo la verificación end-to-end con
   `agent-device` del paso 1 (login, categoría, ejercicio con imagen, pesos y
   gráfica). Atención especial: RN pasa a 0.85 y React a
   19.2.3; si `@types/react` o TypeScript marcan errores nuevos de tipos,
   corregirlos aquí. Commit: `chore: upgrade to Expo SDK 56`.

3. **SDK 56 → 57** — mismo ciclo, incluyendo la verificación end-to-end con
   `agent-device` del paso 1. RN pasa a 0.86, Reanimated a ~4.5,
   `react-native-worklets` a ~0.10. Es el paso con más riesgo para
   `react-native-gifted-charts`: si la gráfica de progreso (spec 06) crashea o
   se renderiza mal, subir gifted-charts a su última versión estable; si aun
   así falla, fijar la última versión que funcione y anotarlo en el commit.
   Commit: `chore: upgrade to Expo SDK 57`.

4. **Smoke test completo en iOS (dev build)** — recorrido de todos los flujos
   existentes:
   - Login con credenciales válidas e inválidas; logout; reapertura de la app
     con sesión activa (revalidación de la spec 05).
   - Lista de categorías; crear una categoría nueva.
   - Detalle de categoría; agregar un ejercicio.
   - Detalle de ejercicio: imagen (expo-image-picker, spec 04), histórico de
     pesos con swipe editar/eliminar (specs 01–03), registrar un peso nuevo.
   - Mini-gráfica y pantalla completa de progreso con tooltip (spec 06).
   - Tema claro y oscuro.

5. **Cierre**: `npm run lint` sin errores nuevos, `npx expo-doctor` limpio, y
   revisión de `git diff` final para confirmar que solo cambiaron versiones de
   dependencias, lockfile y los arreglos mínimos documentados.

---

## Credenciales de prueba

La verificación con `agent-device` hace login real contra el backend. Las
credenciales **no se escriben en texto plano en este archivo ni en ningún otro
archivo versionado** — viven solo en `.env` (ya está en `.gitignore`):

```
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=
```

Antes de ejecutar la verificación de cada paso del SDK, confirmar que estas
dos variables existen en `.env` local (no se añade ninguna lógica en el código
de la app para leerlas — las lee directamente quien ejecuta el flujo de
`agent-device`, fuera del bundle de la app).

---

## Criterios de aceptación

- [ ] `package.json` queda con `expo@~57.x`, `react-native@0.86.x`, `react@19.2.3`
      y todas las dependencias Expo en las versiones que `expo install --fix`
      resuelve para SDK 57.
- [ ] `npx expo-doctor` termina sin errores (warnings preexistentes al upgrade
      se toleran solo si ya existían en SDK 54).
- [ ] La app compila y corre en iOS con `npx expo run:ios` sobre un proyecto
      nativo regenerado desde cero (sin `ios/` previo).
- [ ] Existen tres commits intermedios, uno por SDK (55, 56, 57), y en cada uno
      el flujo end-to-end (login, crear categoría, crear ejercicio con imagen,
      registrar pesos y verificar la gráfica de progreso) se verificó antes de
      commitear con el MCP de `agent-device` (simulador de iOS, snapshot
      interactivo, acciones por ref/selector, sin credenciales en texto plano
      en el repo).
- [ ] El smoke test completo del paso 4 del plan pasa: auth (login/logout/
      revalidación), categorías, ejercicios, imagen, histórico de pesos con
      swipe, registro de peso y ambas gráficas de progreso con tooltip.
- [ ] La gráfica de `react-native-gifted-charts` se renderiza correctamente en
      tema claro y oscuro (sin crash ni glitches nuevos).
- [ ] `npm run lint` pasa sin errores nuevos respecto a SDK 54.
- [ ] No hay cambios de comportamiento ni de UI introducidos a propósito: el
      `git diff` acumulado solo contiene versiones de dependencias, lockfile,
      y los arreglos mínimos que los breaking changes exigieron (cada uno
      identificable en su commit).

---

## Decisiones tomadas y descartadas

- **SDK 57 en vez de SDK 56 (el pedido original)** — al momento de escribir esta
  spec, SDK 57 ya es la versión actual. El esfuerzo de upgrade es prácticamente
  el mismo y quedarse en 56 dejaría el proyecto una versión atrás de inmediato;
  además Expo Go y el soporte oficial priorizan siempre el SDK más reciente.

- **Ruta incremental (54→55→56→57) en vez de salto directo** — es la
  recomendación oficial de Expo: si algo se rompe, se sabe exactamente en qué
  SDK se originó. El costo son dos ciclos extra de install + build, aceptado a
  cambio de aislar los problemas.

- **Verificación solo en iOS** — es la plataforma de desarrollo habitual
  (dev build con `expo run:ios`). Se descartó verificar Android y web en esta
  spec; el código JS es el mismo, y si algún día se retoma Android, la
  verificación va en su propio ciclo.

- **Solo upgrade, sin migrar deprecaciones que aún funcionan** — decisión
  explícita de la fase de preguntas: el objetivo es una app idéntica a la de
  hoy corriendo en SDK 57. Adoptar APIs nuevas o migrar deprecaciones se hará
  en specs futuras, con el upgrade ya estabilizado.

- **Un commit por paso de SDK** — se descartó un único commit final porque
  perdería los puntos de retorno estables que justifican la ruta incremental.

- **Regenerar `ios/` desde cero en cada paso (CNG)** — la carpeta está en
  `.gitignore` y el proyecto ya funciona por prebuild; arrastrar un proyecto
  nativo viejo entre SDKs es fuente clásica de errores de build fantasma.

- **`react-native-gifted-charts`: subir o fijar, no reemplazar** — si rompe con
  RN 0.86/Reanimated 4.5, se busca la versión que funcione. Cambiar de librería
  de gráficas sería revertir una decisión de la spec 06 y excede este alcance.

- **Verificar el flujo end-to-end completo (login → categoría → ejercicio con
  imagen → pesos → gráfica) en cada paso con `agent-device` (snapshot
  interactivo + refs/selectors) en vez de un smoke test manual** — es el
  recorrido que toca casi todas las capas de la app (auth, API, image picker,
  gráfica de terceros) y el que más rápido detecta una regresión seria;
  automatizarlo con el MCP evita depender de que el usuario repita a mano la
  misma prueba tres veces, y usar refs/selectors en vez de coordenadas o
  screenshots hace la verificación estable aunque cambie el layout entre SDKs.
  El smoke test completo del paso 4 sigue siendo manual porque cubre además
  edición/borrado por swipe y otros casos que no vale la pena automatizar solo
  para este upgrade.

- **Credenciales de prueba solo en `.env` (gitignored), nunca en texto plano
  en el spec** — el spec queda commiteado al repo de forma permanente; escribir
  el email y la contraseña reales ahí los deja en el historial de git para
  siempre, incluso si luego se editan o se borran. Se referencian por nombre
  de variable (`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`) y el valor real vive
  únicamente en `.env` local.

---

## Riesgos identificados

| Riesgo                                                                                                                                 | Mitigación                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-native-gifted-charts` (dependencia no-Expo) incompatible con RN 0.86 / Reanimated 4.5 — ya era el riesgo señalado en la spec 06 | Es el motivo del paso 3 del plan: probar la gráfica inmediatamente tras el salto a 57; subir a la última versión estable o fijar la última que funcione. El commit por paso permite revertir sin perder el resto del upgrade.                        |
| Breaking changes de SDK 55 no documentados en detalle aquí (la spec se escribió consultando principalmente los cambios de 56/57)       | La ruta incremental los aísla: si la app rompe en el paso 1, el problema es de SDK 55 por definición. Leer las release notes de cada versión (`expo.dev/changelog/sdk-NN`) antes de cada paso.                                                       |
| Errores de tipos nuevos por React 19.2.3 / `@types/react` en componentes existentes                                                    | Se corrigen en el paso donde aparezcan (previsiblemente el 2); son errores de compilación, visibles de inmediato, no de runtime.                                                                                                                     |
| El `reactCompiler` experimental (activo en `app.json`) puede comportarse distinto con React 19.2                                       | Si aparecen renders rotos inexplicables, desactivarlo temporalmente para descartar que sea la causa; si resulta ser el culpable, decidir con el usuario si se desactiva de forma permanente (cambio de comportamiento que excede el "solo upgrade"). |
| Caches de Metro/CocoaPods contaminando builds entre pasos                                                                              | Regenerar `ios/` desde cero en cada paso y usar `npx expo start --clear` si aparecen errores de bundling raros.                                                                                                                                      |
