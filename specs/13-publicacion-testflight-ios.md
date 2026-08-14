# Spec 13 — Build de producción iOS y publicación en TestFlight

- **Estado:** Implemented
- **Dependencias:**
  - Ninguna spec anterior es requisito directo. Las specs `01`–`12` (Implemented)
    definen la app que se publica.
  - Requisitos externos (ya cumplidos, se verifican en el paso 1 del plan):
    - Membresía activa del Apple Developer Program.
    - Backend de producción desplegado y estable.
    - `EXPO_PUBLIC_API_URL` configurada como EAS Environment Variable en el
      entorno `production` de expo.dev.
    - Proyecto EAS ya vinculado (`extra.eas.projectId` en `app.json`) y
      `eas.json` con el perfil `production` existente.
- **Fecha:** 2026-08-13

**Objetivo:** Generar el build de producción de iOS con EAS bajo el nombre
público "MGP Tracker" (sin la pantalla de registro) y subirlo a TestFlight
para probarlo en un iPhone real contra el API de producción.

---

## Alcance

### Incluye

**Cambios en el repo**

- Quitar el link de "registrarse" de la pantalla de login
  (`app/auth/login/index.tsx`) y eliminar la ruta `app/auth/register/`
  completa. El stub se recupera de git cuando entre la spec del registro real.
- Actualizar `CLAUDE.md` con la sección de release: comandos de build y
  submit, y las precondiciones (variables EAS, cuenta Apple).

Nota: el nombre visible ya está aplicado — `app.json` tiene
`"name": "MGP Tracker"` (sin commitear al escribir esta spec). El `slug`, el
`scheme` y el `bundleIdentifier` **no** se tocan: cambiarlos rompería el
vínculo con el proyecto EAS y los certificados.

**Proceso manual (fuera del repo, documentado en el plan)**

- Build de producción: `eas build --platform ios --profile production`, con
  certificados y provisioning profiles gestionados automáticamente por EAS.
- Submit a TestFlight: `eas submit --platform ios` apuntando al build
  anterior; EAS crea el registro de la app en App Store Connect en este primer
  submit.
- Prueba interna en TestFlight: instalarte la app en tu iPhone como tester
  interno y verificarla contra el API de producción.

### No incluye (para specs futuras)

- Publicación pública en el App Store: ficha completa, screenshots, política
  de privacidad, formulario App Privacy y revisión de Apple.
- Implementación del registro de usuario (y la eliminación de cuenta que exige
  la guideline 5.1.1(v)) — prerequisito de la publicación pública.
- Testers externos de TestFlight (requieren Beta App Review y cuenta demo).
- Android / Google Play.
- Automatización del build o submit con EAS Workflows (el workflow de preview
  sigue deshabilitado; si se retoma, va en su propia spec).
- OTA updates (EAS Update / expo-updates).
- Cambios de icono o splash (ya son los definitivos).
- Cambios en el backend.

---

## Modelo de datos

Esta feature no introduce estructuras de datos nuevas, ni datos persistidos,
ni cambios de backend. Lo único que fija son los identificadores de
publicación, que ya existen en la configuración y quedan congelados:

- **Bundle ID:** `com.fabianmeneses56.mgp-personal-proyect-front` — identidad
  de la app ante Apple; no cambia nunca tras el primer submit.
- **Nombre visible:** `MGP Tracker` (`name` en `app.json`).
- **Versión:** `version: "1.0.0"` en `app.json` (versión de marketing). El
  `buildNumber` de iOS no vive en el repo: `eas.json` ya tiene
  `appVersionSource: "remote"` y `autoIncrement: true` en el perfil
  `production`, así que EAS lo incrementa solo en cada build.

---

## Plan de implementación

Los pasos 1–3 tocan el repo y dejan el proyecto funcional en cada paso; los
pasos 4–6 son el proceso manual contra EAS y Apple.

1. **Verificar prerequisitos.** `npx eas-cli whoami` (sesión de Expo activa),
   `npx eas-cli env:list production` (aparece `EXPO_PUBLIC_API_URL`), y
   membresía de Apple Developer activa. No cambia ningún archivo; si algo
   falla aquí, se resuelve antes de seguir.

2. **Quitar el registro.** Eliminar `app/auth/register/` y el link de
   "registrarse" en `app/auth/login/index.tsx` (junto con imports que queden
   huérfanos). Verificación: `npx tsc --noEmit`, `npm run lint` y `npm test`
   en verde; en el simulador la pantalla de login se ve sin el link y el
   login funciona igual.

3. **Documentar el release en `CLAUDE.md`.** Nueva sección con los comandos
   de build/submit, las precondiciones (variables EAS, cuenta Apple) y la
   nota de que el `buildNumber` es remoto. Verificación: la sección existe y
   los comandos coinciden con los de esta spec.

4. **Build de producción.** `eas build --platform ios --profile production`.
   En la primera ejecución EAS pide login con el Apple ID y genera
   certificado de distribución y provisioning profile (gestión automática).
   Verificación: el build termina en verde en expo.dev.

5. **Submit a TestFlight.** `eas submit --platform ios --latest`. Al no
   existir la app en App Store Connect, EAS crea el registro con el bundle ID
   y el nombre "MGP Tracker". Verificación: el build aparece en App Store
   Connect → TestFlight y termina de procesarse (estado "Ready to Test"; el
   compliance de cifrado ya está resuelto con
   `ITSAppUsesNonExemptEncryption: false`).

6. **Probar en el iPhone.** En App Store Connect, añadirte como tester
   interno del grupo de TestFlight; instalar la app desde la app TestFlight
   en el iPhone. Verificación: la app abre como "MGP Tracker", el login
   funciona contra el API de producción y los flujos principales (categorías,
   ejercicios, histórico de pesos) responden con datos reales.

---

## Criterios de aceptación

- [ ] `app/auth/register/` ya no existe y `grep -rn "register" app/` no
      devuelve ninguna referencia de navegación al registro.
- [ ] La pantalla de login en el simulador no muestra ningún link de
      registro y el login sigue funcionando.
- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan en verde tras
      quitar el registro.
- [ ] `app.json` conserva `slug`, `scheme` y `bundleIdentifier` idénticos a
      los de `main`; solo `name` difiere ("MGP Tracker").
- [ ] `eas build --platform ios --profile production` termina en verde en
      expo.dev.
- [ ] `eas submit --platform ios --latest` termina sin errores y la app
      existe en App Store Connect con el bundle ID
      `com.fabianmeneses56.mgp-personal-proyect-front`.
- [ ] El build aparece en TestFlight con estado "Ready to Test" sin pasos de
      compliance pendientes.
- [ ] La app instalada desde TestFlight en un iPhone real muestra "MGP
      Tracker" bajo el icono.
- [ ] Con la app de TestFlight: login contra el API de producción exitoso, y
      crear una categoría, un ejercicio y un registro de peso funciona con
      datos reales.
- [ ] `CLAUDE.md` documenta los comandos de build/submit y sus
      precondiciones.

---

## Decisiones

- **Sí:** llegar solo hasta TestFlight interno. Obliga a resolver todo el
  pipeline (certificados, build, submit) sin arrastrar los requisitos de la
  publicación pública (ficha, screenshots, privacidad, revisión).
- **No:** publicación pública en el App Store en esta spec. Tiene requisitos
  propios suficientes para su propia spec, y el registro/eliminación de
  cuenta (guideline 5.1.1(v)) es prerequisito.
- **Sí:** eliminar la ruta `app/auth/register/` y su link. El stub no hace
  nada hoy y se recupera de git cuando entre la spec del registro real.
- **No:** dejar la ruta huérfana sin link, ni condicionarla a
  `EXPO_PUBLIC_STAGE === "dev"`. Código muerto o condicionales para una
  pantalla vacía no aportan nada.
- **Sí:** build y submit manuales desde la terminal. Primera publicación:
  ver cada paso y sus errores vale más que la automatización.
- **No:** workflow de EAS para build/submit al mergear a `main`. El workflow
  de preview ya se deshabilitó; si la automatización se retoma, va en su
  propia spec.
- **Sí:** certificados y provisioning profiles gestionados automáticamente
  por EAS. Es el default, evita tocar Keychain y el portal de Apple.
- **Sí:** dejar que EAS cree el registro de la app en App Store Connect en el
  primer `eas submit`, en vez de crearlo a mano en el portal.
- **Sí:** `slug`, `scheme` y `bundleIdentifier` intactos. Cambiarlos
  rompería el vínculo con el proyecto EAS y la identidad ante Apple; solo
  cambió el nombre visible ("MGP Tracker", ya aplicado en `app.json`).
- **Sí:** `buildNumber` remoto con `autoIncrement` (ya configurado en
  `eas.json`). Evita commits de "bump build number" en el repo.
- **No:** cuenta demo para revisores en esta spec. TestFlight interno no
  pasa por revisión de Apple; la cuenta demo entra con la spec de
  publicación pública.

---

## Riesgos

| Riesgo                                                                                                                                                            | Mitigación                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El bundle de producción sale con `EXPO_PUBLIC_API_URL` vacía o mal puesta (las `EXPO_PUBLIC_*` se inlinen en build time) y la app compila pero no conecta a nada. | El paso 1 verifica `eas env:list production` antes de gastar un build. Si aun así la app no conecta, el fallo es visible en el primer login y se corrige la variable y se rebuilda.                             |
| El nombre "MGP Tracker" ya está tomado por otra app en App Store Connect (los nombres son únicos en todo el App Store) y el submit no puede crear el registro.    | Se elige una variante en el momento ("MGP Tracker App", etc.) — solo cambia el nombre en App Store Connect; el `name` de `app.json` (bajo el icono) puede quedarse como está.                                   |
| El icono tiene canal alfa (transparencia) y Apple rechaza el binario al procesarlo en TestFlight.                                                                 | Si el procesamiento lo rechaza, se aplana el PNG a fondo opaco (sin cambiar el diseño) y se rebuilda. Es un fallo barato: se detecta en minutos, en el paso 5.                                                  |
| Crash o comportamiento distinto solo en release (minificación, sin dev menu, `reactCompiler` experimental activo) que nunca se vio en desarrollo.                 | El perfil `preview` ya existe (release + `environment: production`, distribución interna): si el build de TestFlight falla en runtime, `preview` permite iterar el diagnóstico sin pasar por App Store Connect. |
| Primer setup de credenciales con Apple falla a mitad (2FA, sesión expirada) y deja certificados a medias.                                                         | La gestión de credenciales de EAS es reentrante: volver a correr `eas build` retoma o regenera lo que falte. No hay estado manual que limpiar.                                                                  |

---

## Lo que **no** entra en esta spec

- Publicación pública en el App Store (ficha, screenshots, política de
  privacidad, App Privacy, revisión de Apple, cuenta demo para revisores).
- Registro de usuario y eliminación de cuenta en la app.
- Testers externos de TestFlight.
- Android / Google Play.
- Automatización con EAS Workflows.
- OTA updates (EAS Update).
- Cambios de icono, splash o backend.

Cada una de esas, si entra, va en su propia spec.
