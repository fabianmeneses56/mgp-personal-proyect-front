# Spec 12 — Tests E2E locales con Maestro

- **Estado:** Implemented
- **Dependencias:**
  - Spec `08-infraestructura-tests.md` (Implemented) — dejó los E2E explícitamente
    fuera de alcance con la nota "spec propia si entra"; esta es esa spec. No
    comparte infraestructura con Jest: Maestro es una pieza independiente.
  - Specs `01`–`07` y `09`–`11` (Implemented) — los flujos que se automatizan aquí
    son los que esas specs construyeron (auth, categorías, ejercicios, histórico
    de pesos, alerts).
  - Requiere las variables `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` de `.env`
    (ya contempladas en `.env.example`) apuntando a una cuenta de prueba
    desechable existente en el backend de desarrollo.
- **Fecha:** 2026-08-11

**Objetivo:** Montar Maestro con una batería de flows E2E en `.maestro/` que
cubra los flujos principales de la app (auth, categorías, ejercicios e histórico
de pesos) corriendo localmente contra el simulador de iOS y el backend de
desarrollo de la LAN.

---

## Alcance

### Incluye

**Infraestructura**

- Carpeta `.maestro/` en la raíz con los flows en YAML. Maestro CLI se instala
  en la máquina (no es dependencia de npm); el comando de instalación queda
  documentado en `CLAUDE.md`.
- Script `npm run test:e2e` en `package.json` que ejecuta la batería completa.
  Como Maestro no lee archivos `.env`, el script pasa por un pequeño wrapper
  (`scripts/e2e-with-env.js`, mismo patrón que `scripts/start-with-env.js`) que
  carga `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` de `.env` y los inyecta a
  `maestro test` como parámetros (`-e EMAIL=... -e PASSWORD=...`).
- Precondiciones documentadas (no automatizadas): app instalada en el simulador
  de iOS (`npm run ios`), Metro corriendo y backend de desarrollo de la LAN
  levantado. El script no levanta nada de eso.
- Props `testID` añadidas a los componentes de producción donde los selectores
  de texto sean ambiguos o frágiles (inputs, botones, filas de listas).
- Cada flow lanza la app con `clearState: true`: arranca siempre desde el login,
  sin depender del estado que dejó el flow anterior.
- Actualización de `CLAUDE.md`: comando `npm run test:e2e`, instalación de
  Maestro y precondiciones.

**Batería de flows** (uno por archivo YAML)

1. Login fallido — credenciales malas → alert de error.
2. Login exitoso — credenciales de `.env` → llega al home.
3. Crear categoría.
4. Crear ejercicio dentro de una categoría.
5. Registrar un peso en el histórico de un ejercicio.
6. Editar y eliminar un registro del histórico.
7. Eliminar un ejercicio.
8. Eliminar una categoría.
9. Logout — vuelve a la pantalla de login.

### No incluye (para specs futuras)

- Registro de usuario — la pantalla es un stub sin lógica; cuando se implemente
  (su propia spec), traerá su flow.
- Editar categoría — el action es un no-op documentado; sin feature no hay E2E.
- Cambio de imagen del ejercicio — abre el picker de fotos del sistema, lo más
  frágil de automatizar; si entra, va en su propia spec.
- Android — solo simulador de iOS por ahora.
- CI (GitHub Actions) — solo local, igual que la suite de Jest.
- Mock server o fixtures de backend — los tests corren contra el backend real
  de desarrollo.
- Limpieza de datos creados — decisión explícita: la cuenta de prueba es
  desechable y no importa acumular datos.
- Cambios en la suite de Jest, `jest.config.js` o `jest.setup.ts`.
- Cambios en el backend.

---

## Modelo de datos

Esta feature no introduce estructuras de datos de dominio nuevas, ni datos
persistidos en la app, ni cambios de backend. Lo que sí define son las
convenciones que los flows comparten:

**1. Archivos de flow** — `.maestro/NN-slug.yaml`, numerados en el orden
lógico de la batería:

```
.maestro/
  01-login-fallido.yaml
  02-login-exitoso.yaml
  03-crear-categoria.yaml
  04-crear-ejercicio.yaml
  05-registrar-peso.yaml
  06-editar-eliminar-registro.yaml
  07-eliminar-ejercicio.yaml
  08-eliminar-categoria.yaml
  09-logout.yaml
```

Cada flow es **independiente**: lanza la app con `clearState: true` y no asume
nada de lo que hizo el flow anterior. La numeración es solo legibilidad.

**2. Credenciales** — los flows referencian `${EMAIL}` y `${PASSWORD}`;
`scripts/e2e-with-env.js` las inyecta desde `.env` con
`maestro test -e EMAIL=... -e PASSWORD=...`. Ningún flow tiene credenciales
hardcodeadas.

**3. Datos únicos por corrida** — como la cuenta es desechable y no se limpia,
el backend acumula datos entre corridas. Para que un flow nunca ambigüe con
datos de corridas anteriores (dos categorías con el mismo nombre), cada flow
que crea entidades genera un sufijo único con `evalScript`
(`output.suffix = Date.now()`) y nombra sus datos `E2E Cat ${suffix}` /
`E2E Ex ${suffix}`. Cada flow crea sus propios prerequisitos: el flow 07
(eliminar ejercicio) crea primero su categoría y su ejercicio; no reutiliza los
del flow 04.

**4. Convención de `testID`** — kebab-case con prefijo de pantalla:
`login-email-input`, `login-password-input`, `login-submit-button`,
`home-new-category-button`, etc. Para filas de listas, el `testID` incluye el
nombre de la entidad (`category-row-${name}`) para poder localizar la fila
recién creada. Los `testID` concretos se fijan durante la implementación
siguiendo esta convención; la spec no los enumera uno a uno.

---

## Plan de implementación

Cada paso deja el proyecto funcional: la app no cambia de comportamiento (los
`testID` son inertes) y los flows ya escritos siguen pasando.

1. **Instalar Maestro y verificar el entorno.** Instalar Maestro CLI en la
   máquina (`curl -fsSL "https://get.maestro.mobile.dev" | bash`) y verificar
   con `maestro --version` y con el simulador de iOS arrancado. Todavía no hay
   flows; nada que correr.

2. **Script de arranque.** Crear `scripts/e2e-with-env.js` (lee
   `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` de `.env`, falla con mensaje claro si
   faltan, y ejecuta `maestro test .maestro/ -e EMAIL=... -e PASSWORD=...`) y
   añadir `"test:e2e": "node scripts/e2e-with-env.js"` a `package.json`.
   Verificación: con un flow trivial (lanzar la app y ver la pantalla de
   login), `npm run test:e2e` termina en verde.

3. **Flows de login (01 y 02).** Añadir los `testID` de la pantalla de login
   (`login-email-input`, `login-password-input`, `login-submit-button`) y
   escribir `01-login-fallido.yaml` (credenciales inventadas → aparece el alert
   de error de la spec 09) y `02-login-exitoso.yaml` (`${EMAIL}`/`${PASSWORD}`
   → aparece el home). Estos dos fijan el patrón (clearState, selectores,
   aserciones) que el resto reutiliza.

4. **Flow de crear categoría (03).** `testID` en el botón de nueva categoría,
   el input del formulario y el botón de guardar; flow: login → crear
   `E2E Cat ${suffix}` → asertar que aparece en el listado del home.

5. **Flow de crear ejercicio (04).** `testID` en la pantalla de categoría y el
   formulario de nuevo ejercicio; flow: login → crear categoría propia → entrar
   → crear `E2E Ex ${suffix}` → asertar que aparece en la lista.

6. **Flows del histórico de pesos (05 y 06).** `testID` en la pantalla de
   ejercicio y el formulario de registro de peso; `05-registrar-peso.yaml`
   (crear categoría + ejercicio propios → registrar un peso → asertar que
   aparece en el histórico) y `06-editar-eliminar-registro.yaml` (además: tocar
   el registro → editar → asertar el nuevo valor → eliminar con confirmación →
   asertar que desaparece).

7. **Flows de eliminación (07 y 08).** `07-eliminar-ejercicio.yaml` y
   `08-eliminar-categoria.yaml`: cada uno crea sus propios datos, elimina
   pasando por el alert de confirmación ("Cancelar" primero → sigue existiendo;
   luego "Eliminar" → desaparece del listado).

8. **Flow de logout (09).** `testID` en el botón de logout; flow: login →
   logout → asertar que se vuelve a la pantalla de login.

9. **Cierre.** Corrida completa `npm run test:e2e` en verde (los 9 flows,
   backend de LAN arriba). Actualizar `CLAUDE.md`: instalación de Maestro,
   precondiciones (app instalada, Metro, backend) y el comando `npm run
test:e2e`. Verificar que `npm test`, `npm run lint` y `npx tsc --noEmit`
   siguen en verde (los `testID` no rompen nada).

---

## Criterios de aceptación

Precondiciones para la verificación: simulador de iOS con la app instalada,
Metro corriendo, backend de desarrollo de la LAN levantado y `.env` con las
credenciales de la cuenta de prueba.

- [ ] `maestro --version` funciona en la máquina y la instalación quedó
      documentada en `CLAUDE.md`.
- [ ] Existen los 9 flows en `.maestro/` con los nombres definidos en el modelo
      de datos.
- [ ] `npm run test:e2e` corre la batería completa y los 9 flows terminan en
      verde.
- [ ] `npm run test:e2e` sin `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` en `.env`
      falla inmediatamente con un mensaje claro, sin llegar a lanzar Maestro.
- [ ] Ningún flow contiene credenciales hardcodeadas: `grep -rn "@" .maestro/`
      no revela ningún email real.
- [ ] Correr `npm run test:e2e` dos veces seguidas da verde ambas veces (los
      sufijos únicos evitan colisiones con los datos de la corrida anterior).
- [ ] Cada flow pasa también ejecutado solo
      (`maestro test .maestro/07-eliminar-ejercicio.yaml` con las `-e` — vía
      el script o a mano): ninguno depende de otro.
- [ ] El flow 01 verifica el alert de credenciales incorrectas y el 02 termina
      en el home autenticado.
- [ ] Los flows 06, 07 y 08 pasan por el camino "Cancelar" del alert de
      confirmación antes del camino "Eliminar" (se verifica que cancelar no
      borra).
- [ ] Los `testID` añadidos siguen la convención `pantalla-elemento` y no hay
      ningún otro cambio de comportamiento en el código de producción: fuera
      de props `testID`, el `git diff` de `app/` y `presentation/` está vacío.
- [ ] `npm test` (Jest) sigue en verde sin modificar ningún test.
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos.
- [ ] `CLAUDE.md` documenta instalación de Maestro, precondiciones y el comando
      `npm run test:e2e`.

---

## Decisiones

- **Sí:** Maestro como herramienta E2E. Flows en YAML declarativo, corre contra
  el simulador sin tocar el build nativo y es la opción de menor fricción y
  mantenimiento con Expo.
- **No:** Detox. Más potente (sincronización automática con la UI), pero exige
  configuración nativa por plataforma y es notablemente más frágil de mantener
  con Expo.
- **No:** agent-device. Es automatización dirigida por agente, útil para QA
  exploratorio, pero no un runner determinista que dé verde/rojo con un
  comando. Sigue disponible para QA manual asistido, fuera de esta spec.
- **Sí:** solo simulador de iOS. Es donde se desarrolla y se verifica todo lo
  demás; Android entra en su propia spec si algún día hace falta.
- **Sí:** contra el backend de desarrollo de la LAN (el de `.env.development`),
  que es el que el usuario ya tiene corriendo al desarrollar.
- **No:** mock server local. Más aislado, pero es otra pieza que montar y
  mantener, y dejaría de probar la integración real que es justo el valor de
  un E2E.
- **No:** API de producción. Los tests crean y borran datos; producción no es
  sitio para eso.
- **Sí:** toda la batería de flujos en esta spec (9 flows). Decisión explícita
  del usuario; la app es pequeña y los flujos existentes están estables.
- **Sí:** cuenta de prueba desechable sin limpieza de datos. Decisión explícita:
  no importa acumular basura. El costo se paga con sufijos únicos por corrida
  para que los datos viejos nunca ambigüen un selector.
- **No:** limpieza al final de cada flow. Alarga los flows, y un flow que falla
  a mitad dejaría basura igualmente — la limpieza daría una garantía falsa.
- **Sí:** `clearState: true` en cada flow; todos arrancan desde el login.
  Flows independientes que pueden correrse sueltos y fallar de forma aislada.
- **No:** flow único encadenado con un solo login. Más rápido, pero un fallo a
  mitad tumba todo lo que viene después y no se puede correr un flujo suelto.
- **Sí:** `testID` en componentes de producción. Práctica estándar, inerte en
  runtime, y los selectores por texto se rompen con cualquier cambio de copy.
- **Sí:** wrapper `scripts/e2e-with-env.js` para inyectar credenciales. Maestro
  no lee `.env`, y el proyecto ya tiene el patrón (`start-with-env.js`).
- **No:** credenciales hardcodeadas en los YAML. Los flows van al repo; las
  credenciales no.
- **Sí:** cada flow crea sus propios prerequisitos (el de eliminar ejercicio
  crea antes su categoría y su ejercicio). Es más lento pero elimina todo
  acoplamiento entre flows.
- **Sí:** el script asume simulador + app + Metro + backend ya levantados
  (opción a). Automatizar el arranque de todo eso es frágil y lento; la
  precondición documentada es más honesta.
- **No:** CI en GitHub Actions. Igual que la suite de Jest: por ahora solo
  local, decisión ya tomada en la spec 08 y reafirmada aquí.
- **No:** flows de registro de usuario, editar categoría y cambio de imagen.
  Los dos primeros no tienen feature detrás (stub y no-op); el tercero depende
  del picker de fotos del sistema, lo más frágil de automatizar. Cada uno, si
  entra, va con su propia spec.

---

## Riesgos

| Riesgo                                                                                                                                                                                                                   | Mitigación                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| En iOS, `clearState` de Maestro limpia el contenedor de datos de la app pero puede **no** limpiar el keychain, donde `expo-secure-store` guarda el token: la app arrancaría ya autenticada y ningún flow vería el login. | El paso 3 del plan lo verifica antes de escribir el resto de flows. Si el token sobrevive, se añade un subflow compartido `_ensure-logged-out.yaml` (si aparece el home, hace logout) que cada flow ejecuta antes de empezar.                            |
| Los componentes `Themed*` (`ThemedButton`, `ThemedTextInput`) podrían no reenviar la prop `testID` al elemento nativo, dejando los selectores ciegos.                                                                    | También se detecta en el paso 3 (login usa ambos componentes). Si no la reenvían, se añade el passthrough — cambio inerte que no afecta a ningún consumidor.                                                                                             |
| Los botones de los alerts nativos ("Cancelar", "Eliminar", "OK") no admiten `testID`: solo se pueden seleccionar por texto, y un cambio de copy rompe los flows 01, 06, 07 y 08.                                         | Riesgo aceptado: es la única opción con alerts nativos. La spec 11 centralizó los textos en `alert.service.ts`, así que un cambio de copy es visible en un solo archivo y el rojo del E2E señala exactamente qué texto cambió.                           |
| E2E contra backend real + bundle de desarrollo: la latencia de red o un backend lento producen fallos intermitentes por timing.                                                                                          | Maestro espera automáticamente a que los elementos aparezcan; para las operaciones de red (login, guardados) se usa `extendedWaitUntil` con timeout generoso en vez del timeout por defecto. Si un flow resulta flaky, se ajusta su espera, no se salta. |
| Backend de LAN apagado o con IP cambiada: los 9 flows fallan en rojo sin que el problema sea de los tests.                                                                                                               | Precondición documentada en `CLAUDE.md`. El modo de fallo es obvio: el flow 02 (login exitoso) falla en el primer paso de red; ver ese patrón (01 verde, 02 rojo) apunta directo al backend.                                                             |

---

## Lo que **no** entra en esta spec

- Flow de registro de usuario (la pantalla es un stub; irá con la spec que
  implemente el registro).
- Flow de editar categoría (el action es un no-op; irá con la spec que lo
  implemente).
- Flow de cambio de imagen del ejercicio (picker de fotos del sistema).
- E2E en Android.
- CI en GitHub Actions para los E2E.
- Mock server o fixtures de backend.
- Limpieza de los datos que los flows crean en la cuenta de prueba.
- Cambios en la suite de Jest o en el backend.

Cada una de esas, si entra, va en su propia spec.
