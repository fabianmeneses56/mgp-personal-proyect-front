# Spec 14 — CD: build de producción y TestFlight disparados por tag

- **Estado:** Implemented
- **Dependencias:**
  - `13-publicacion-testflight-ios.md` (Implemented) — dejó el pipeline
    manual funcionando de punta a punta: certificados generados, app creada
    en App Store Connect y un build ya procesado en TestFlight. Esta spec
    automatiza ese proceso; no lo reinventa.
  - Requisitos externos (ya cumplidos, se verifican en el paso 1):
    - Repositorio de GitHub vinculado al proyecto de EAS (ya lo está: el
      workflow de preview se dispara con `Trigger Type: GitHub`).
    - App Store Connect API Key almacenada en EAS (la usó el submit del
      13-ago).
    - `EXPO_PUBLIC_API_URL` en el entorno `production` de EAS.
- **Fecha:** 2026-08-18

**Objetivo:** Que publicar una versión en TestFlight sea empujar un tag, y que
el proceso quede versionado en el repo en vez de vivir en la máquina de quien
publica.

---

## Contexto: qué había realmente

La spec 13 dejó dos afirmaciones que hoy no se sostienen, y conviene
corregirlas porque cambian el punto de partida:

- **"El workflow de preview sigue deshabilitado"** — es falso.
  `.eas/workflows/build-preview-on-merge.yml` está activo y se dispara desde
  GitHub: corrió en `refs/heads/main@83a76bbf2018` (merge del PR #14) y en
  `refs/heads/main@d15b64b09904`, ambas con `Trigger Type: GitHub`. Lo único
  deshabilitado es el de E2E, renombrado a `e2e-tests.txt` en `0e10ae3`
  (EAS solo lee `.yml`/`.yaml`).
- **"Build y submit manuales desde la terminal"** — a medias. El submit del
  13-ago (`2c901c12`) no se hizo con `eas submit`, sino con un workflow
  llamado `submit-ios.yaml` lanzado a mano (`Trigger Type: Other`). Ese
  archivo **nunca se commiteó en ninguna rama**: existió como archivo local,
  `eas workflow:run` lo subió junto al proyecto, y se perdió. El
  conocimiento de cómo se publicó la versión actual no está en el repo.

De ese submit sale además un dato que sí quedó fuera de control de versiones:
el **ASC App ID `6801318596`**. `eas.json` tiene `submit.production` en `{}`,
así que hoy un `eas submit` limpio no sabe a qué app de App Store Connect
apuntar.

---

## Alcance

### Incluye

- `.eas/workflows/release-testflight-on-tag.yml` — nuevo workflow, disparado
  por tags `v*.*.*`, con tres jobs encadenados:
  1. `verify_version` (job custom) — compara el tag con `expo.version` de
     `app.json` y falla si divergen, **antes** de gastar un build.
  2. `build_ios` (`type: build`) — perfil `production`.
  3. `testflight` (`type: testflight`) — sube el build y espera el
     procesamiento en App Store Connect.
- `eas.json` — `submit.production.ios.ascAppId = "6801318596"`, para que el
  destino del submit deje de ser conocimiento tácito.
- `CLAUDE.md` — la sección "Release (iOS / TestFlight)" pasa de describir el
  proceso manual a describir el flujo por tag, con el comando de re-corrida
  manual y las precondiciones.

### No incluye (para specs futuras)

- Android / Google Play: no hay perfil de submit ni cuenta de Play Console.
- OTA updates (EAS Update / `expo-updates`): cambia el modelo de release
  entero, no solo su disparador.
- Reactivar el workflow de E2E (`e2e-tests.txt`): está roto por su cuenta
  (apunta a `.maestro/login.yaml`, que ya no existe) y va en su propia spec.
- Testers externos de TestFlight y publicación pública en el App Store: los
  bloqueos siguen siendo los de la spec 13 (registro de usuario, eliminación
  de cuenta, ficha, revisión).
- Bump automático de `expo.version`. El tag manda y `verify_version` obliga a
  que coincidan, pero quién sube el número sigue siendo una persona.
- Notas de release generadas desde los commits: el `changelog` que se manda a
  TestFlight es sólo `Release <tag>`.

---

## Modelo de datos

No hay estructuras nuevas. Lo que esta spec fija son dos identificadores de
publicación que antes vivían fuera del repo:

- **ASC App ID:** `6801318596` — la app en App Store Connect a la que apunta
  el submit. Se versiona en `eas.json`.
- **Contrato del tag:** `v<expo.version>`, con `expo.version` en formato
  `MAJOR.MINOR.PATCH`. El patrón del trigger es `v*.*.*`, así que un tag como
  `v1.1` o `release-1.1.0` simplemente no dispara nada.

El `buildNumber` de iOS sigue sin vivir en el repo: `appVersionSource:
"remote"` + `autoIncrement: true` en el perfil `production`.

---

## Plan de implementación

1. **Verificar prerequisitos.** `npx eas-cli whoami`,
   `npx eas-cli env:list --environment production` (aparece
   `EXPO_PUBLIC_API_URL`), y `npx eas-cli workflow:runs` para confirmar que
   el vínculo con GitHub está vivo. No toca archivos.

2. **Escribir el workflow.** `.eas/workflows/release-testflight-on-tag.yml`
   con los tres jobs. Verificación:
   `npx eas-cli workflow:validate .eas/workflows/release-testflight-on-tag.yml`
   en verde, y la lógica del guard probada en local contra varios refs
   (`v1.0.0` pasa, `v1.1.0` falla, una rama se omite).

3. **Versionar el ASC App ID.** `submit.production.ios.ascAppId` en
   `eas.json`. Verificación: el diff toca sólo esa clave.

4. **Documentar en `CLAUDE.md`.** Reemplazar la sección de release manual.
   Verificación: la sección describe el flujo por tag y los comandos
   coinciden con el workflow.

5. **Probar el release real.** Empujar `v1.0.0` (coincide con el
   `expo.version` actual) y ver la corrida completa en expo.dev.
   Verificación: los tres jobs en verde y el build nuevo en TestFlight.

---

## Criterios de aceptación

- [ ] `npx eas-cli workflow:validate .eas/workflows/release-testflight-on-tag.yml`
      pasa.
- [ ] Empujar un tag `v*.*.*` dispara la corrida en expo.dev con
      `Trigger Type: GitHub`.
- [ ] Con `expo.version` = `1.0.0`, un tag `v1.1.0` hace fallar
      `verify_version` y **no** se lanza ningún build.
- [ ] Con el tag correcto, `build_ios` produce un build `production` y
      `testflight` lo deja procesado en App Store Connect.
- [ ] `npx eas-cli workflow:run release-testflight-on-tag.yml` desde una rama
      omite `verify_version` sin fallar y sigue al build.
- [ ] Un push a `main` sin tag **no** dispara este workflow (sí el de
      preview, que es otro).
- [ ] `eas.json` tiene `submit.production.ios.ascAppId` y ningún otro cambio.
- [ ] `CLAUDE.md` describe el flujo por tag y ya no dice que el release sea
      manual.

---

## Decisiones

- **Sí:** disparar por tag `v*.*.*`. Cada corrida gasta un build de EAS y
  crea una versión en TestFlight; atarlo a los merges convertiría cada
  cambio de docs o de CI en un release.
- **No:** disparar en cada push a `main`, que es el ejemplo por defecto de la
  documentación de Expo. Tiene sentido con equipos que mergean pocas veces al
  día y quieren TestFlight siempre fresco; aquí sólo quemaría builds.
- **Sí:** un job `verify_version` que falla temprano. El fallo que previene
  —tag `v1.1.0` sobre un `app.json` que dice `1.0.0`— es silencioso: el build
  sale bien y TestFlight muestra un número que no corresponde al tag.
- **Sí:** omitir la verificación cuando `github.ref_name` no parece un tag,
  resolviéndolo dentro del `run` en vez de con un `if:` a nivel de job. Un job
  saltado y sus `needs` tienen semántica que no está documentada con
  claridad; un `exit 0` explícito no depende de eso.
- **Sí:** `type: testflight` en vez de `type: submit`. Espera el
  procesamiento en App Store Connect y acepta `changelog` y grupos de
  testers, así que el job termina cuando la build está realmente disponible,
  no cuando se subió el binario.
- **Sí:** versionar el ASC App ID en `eas.json`. Es un identificador público,
  no un secreto, y sin él el submit depende de que EAS adivine o pregunte.
- **No:** mover el workflow de preview ni tocarlo. Sirve para otra cosa
  (build interno por merge) y funciona; si sobra, se decide aparte.
- **No:** generar el changelog desde los commits. Los mensajes de este repo
  no están escritos para leerse como notas de release.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El tag se empuja sobre un commit que no es el que se quiere publicar (por ejemplo, antes de mergear el bump de versión). | El tag apunta a un commit concreto y el build sale de ahí, así que el error es visible en la corrida (`Trigger` muestra el SHA). Se corrige borrando el tag remoto y volviendo a etiquetar; el `buildNumber` remoto ya se incrementó, pero eso no rompe nada. |
| Un release falla a mitad (build en verde, `testflight` en rojo por procesamiento de Apple) y volver a empujar el mismo tag no dispara nada. | `npx eas-cli workflow:run release-testflight-on-tag.yml` relanza el flujo sin mover el tag; `verify_version` se omite en corridas manuales, así que no estorba. |
| `verify_version` corre en un job custom que asume que `node` y `app.json` están disponibles tras el checkout. Si EAS cambia ese entorno, el guard falla y bloquea releases legítimos. | El fallo es ruidoso y ocurre antes del build (no gasta nada). El desbloqueo inmediato es lanzar el workflow a mano, que omite la verificación. |
| El ASC App ID versionado queda obsoleto si la app se recrea en App Store Connect. | Está en `eas.json`, no en la máquina de alguien: el submit falla con un ID que no existe y el arreglo es una línea. Antes, el dato no estaba en ninguna parte. |
| Cada tag consume un build de producción del plan de EAS. | El trigger es explícito por diseño; nadie publica sin escribir `git push origin vX.Y.Z`. |

---

## Lo que **no** entra en esta spec

- Android / Google Play.
- OTA updates (EAS Update).
- Arreglar y reactivar el workflow de E2E.
- Testers externos de TestFlight y publicación pública en el App Store.
- Bump automático de `expo.version` y notas de release generadas.
- Cambios en la app, el backend, el icono o el splash.

Cada una de esas, si entra, va en su propia spec.
