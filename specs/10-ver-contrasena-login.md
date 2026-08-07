# Spec 10 — Ver contraseña en el login

- **Estado:** Implemented
- **Dependencias:**
  - Ninguna spec previa es requisito. Toca `app/auth/login/index.tsx`, igual que
    la spec `09-errores-login-diferenciados.md` (aprobada y aún sin implementar),
    pero en partes distintas del archivo: la 09 cambia el handler `onLogin` y los
    mensajes del Alert, esta solo cambia el JSX del campo de contraseña. Se pueden
    implementar en cualquier orden.
- **Fecha:** 2026-08-07

**Objetivo:** Añadir una prop `secureToggle` a `ThemedTextInput` que renderiza un
icono de ojo para alternar entre contraseña oculta y visible, y usarla en el campo
de contraseña de la pantalla de login.

---

## Alcance

### Incluye

- Nueva prop opcional `secureToggle?: boolean` en
  `presentation/theme/components/ThemedTextInput.tsx`. Por defecto `false`: sin la
  prop, el componente se comporta exactamente como hoy.
- Cuando `secureToggle` es `true`, el componente renderiza a la derecha del
  `TextInput` un icono de Ionicons que alterna entre `eye-outline` (contraseña
  oculta) y `eye-off-outline` (contraseña visible).
- Estado interno `isSecure` en `ThemedTextInput`, inicializado en `true`. Cuando
  `secureToggle` está activo, ese estado es el que manda sobre `secureTextEntry`:
  se aplica después del spread de `...rest`, así que el valor que pase el
  consumidor se ignora.
- Color del icono: `textFaint` cuando la contraseña está oculta, `primary` cuando
  está visible, para reforzar el estado activo.
- `accessibilityRole="button"` y `accessibilityLabel` que alterna entre
  `"Mostrar contraseña"` y `"Ocultar contraseña"`.
- Uso de la prop en el campo de contraseña de `app/auth/login/index.tsx`
  (`secureTextEntry secureToggle`).

### No incluye

- La pantalla de registro (`app/auth/register/index.tsx`): hoy es un stub sin
  formulario. Cuando se implemente, usará la misma prop sin cambios en el
  componente.
- Tests unitarios del toggle. El repo no tiene todavía ningún test de componente
  de UI; abrir esa línea es una decisión aparte y va en su propia spec. La
  verificación de esta spec es manual.
- Verificación automatizada con `agent-device`.
- Cualquier otro cambio en la pantalla de login: el handler `onLogin`, los
  mensajes de error y el layout del formulario quedan como están (los mensajes de
  error son alcance de la spec 09).
- Cambios en los demás campos que usan `ThemedTextInput` en la app.
- Ocultar la contraseña automáticamente al perder el foco, al enviar el formulario
  o tras un tiempo de inactividad.
- Cambios en el backend.

---

## Modelo de datos

Esta feature no introduce estructuras de datos nuevas, ni datos persistidos, ni
cambios de backend. El único estado que aparece es local al componente y vive
mientras el input está montado.

Lo único que cambia es el contrato de props de `ThemedTextInput`:

```ts
interface Props extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  /**
   * Renderiza un icono de ojo a la derecha para alternar la visibilidad del
   * texto. Cuando es `true`, el componente controla `secureTextEntry` y el valor
   * que llegue por props se ignora. Por defecto `false`.
   */
  secureToggle?: boolean;
}
```

Estado interno nuevo:

```ts
const [isSecure, setIsSecure] = useState(true);
```

Convenciones:

- `isSecure` arranca siempre en `true`. No se persiste: al desmontar la pantalla
  de login el estado se pierde y la próxima vez la contraseña vuelve a estar
  oculta.
- El icono izquierdo (`icon`) y el del toggle son independientes: el campo de
  contraseña del login mantiene su `lock-closed-outline` a la izquierda.

---

## Plan de implementación

1. **Añadir la prop y el estado en `ThemedTextInput`.**
   En `presentation/theme/components/ThemedTextInput.tsx`, extender `Props` con
   `secureToggle?: boolean`, desestructurarla en la firma del componente con
   valor por defecto `false`, y añadir `const [isSecure, setIsSecure] = useState(true)`.
   Todavía no se usa nada de eso en el render. La app compila y se comporta igual
   que antes.

2. **Renderizar el icono del toggle.**
   Después del `<TextInput>`, dentro del `View` contenedor, renderizar
   condicionalmente (`secureToggle && ...`) un `<Ionicons>` envuelto en
   `Pressable`:
   - `name`: `isSecure ? "eye-outline" : "eye-off-outline"`.
   - `size`: `20`, igual que el icono izquierdo.
   - `color`: `isSecure ? placeholderColor : primaryColor`.
   - `onPress`: `() => setIsSecure((prev) => !prev)`.
   - `accessibilityRole="button"` y
     `accessibilityLabel={isSecure ? "Mostrar contraseña" : "Ocultar contraseña"}`.

   El `onTouchStart` del `View` contenedor se deja como está: tocar el ojo también
   enfoca el input, que es el comportamiento esperado en iOS.

3. **Hacer que el estado interno controle `secureTextEntry`.**
   En el `<TextInput>`, añadir después de `{...rest}` la línea
   `secureTextEntry={secureToggle ? isSecure : rest.secureTextEntry}`. El orden
   importa: al ir después del spread, gana sobre el valor que pase el consumidor
   cuando el toggle está activo, y lo respeta cuando no lo está.

4. **Usar la prop en el login.**
   En `app/auth/login/index.tsx`, añadir `secureToggle` al `ThemedTextInput` de
   contraseña, junto al `secureTextEntry` que ya tiene.

5. **Pasar el lint.**
   `npm run lint` sin errores nuevos.

---

## Criterios de aceptación

Verificación manual en el simulador de iOS, en la pantalla de login:

- [ ] El campo de contraseña muestra un icono de ojo a la derecha; el campo de
      correo electrónico no lo muestra.
- [ ] Al abrir la pantalla, la contraseña se ve enmascarada y el icono es
      `eye-outline` en color `textFaint`.
- [ ] Al tocar el icono, el texto de la contraseña pasa a verse en claro y el
      icono cambia a `eye-off-outline` en color `primary`.
- [ ] Al tocar el icono de nuevo, la contraseña vuelve a enmascararse y el icono
      vuelve a `eye-outline` en color `textFaint`.
- [ ] El texto escrito no se pierde ni se recorta al alternar en cualquiera de los
      dos sentidos.
- [ ] Se puede seguir escribiendo con la contraseña visible, y lo que se escribe
      aparece en claro.
- [ ] Tocar el icono enfoca el input (el borde pasa a `primary` y sale el teclado)
      además de alternar la visibilidad.
- [ ] El login sigue funcionando con la contraseña visible: se envía la contraseña
      real, no una versión enmascarada.
- [ ] El campo de correo electrónico y el resto del formulario se ven igual que
      antes del cambio.
- [ ] La app se ve correctamente en modo claro y en modo oscuro.
- [ ] `npm run lint` termina sin errores nuevos.
- [ ] `npm test` sigue en verde.

---

## Decisiones

- **Sí:** el toggle vive en `ThemedTextInput` como prop reutilizable. El
  componente ya es el dueño de su layout interno (icono izquierdo, borde, foco), y
  así la pantalla de registro lo hereda gratis cuando se implemente.
- **No:** estado `showPassword` en `app/auth/login/index.tsx` con un icono suelto.
  Habría que duplicar el ojo y su lógica en cada pantalla con contraseña.
- **Sí:** prop explícita `secureToggle`. Es opt-in y no cambia nada de lo que ya
  existe.
- **No:** inferir el ojo automáticamente de `secureTextEntry`. Cambiaría el
  aspecto de cualquier campo seguro futuro sin que nadie lo pida.
- **Sí:** el estado interno gana sobre el `secureTextEntry` de props cuando el
  toggle está activo. Tener dos fuentes de verdad para el mismo booleano
  garantiza que tarde o temprano se desincronicen.
- **No:** que la prop del consumidor defina solo el valor inicial. Añade un caso
  raro (arrancar visible) que nadie ha pedido.
- **Sí:** dejar el `onTouchStart` del contenedor como está, de modo que tocar el
  ojo también enfoque el input. Es el comportamiento habitual en iOS y evita
  añadir código para parar la propagación.
- **Sí:** el icono cambia de color (`textFaint` → `primary`) además de cambiar de
  forma. El estado "contraseña visible" es el estado con riesgo y conviene que se
  note.
- **No:** ocultar la contraseña sola al perder el foco, al pulsar "Ingresar" o
  tras un timeout. El componente se desmonta al navegar fuera del login, y eso ya
  devuelve el campo a oculto en la práctica.
- **No:** tests unitarios del toggle en esta spec. El repo no tiene ningún test de
  componente de UI todavía; introducir React Native Testing Library implica
  decidir convenciones (qué se testea de un componente temático, cómo se mockean
  los hooks de tema) que merecen su propia spec. Verificación manual por ahora.
- **No:** verificación con `agent-device`. El cambio es de un solo control visual
  y el usuario lo comprueba a mano.
- **No:** tocar la pantalla de registro. Hoy es un stub sin formulario; añadirle
  el campo sería implementar el registro, que es otra spec.

---

## Riesgos

| Riesgo                                                                                                                                                                        | Mitigación                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El `secureTextEntry` interno se coloca antes de `{...rest}` en un refactor futuro y el toggle deja de funcionar en silencio: el icono cambia pero el texto sigue enmascarado. | El paso 3 del plan fija el orden de forma explícita y el criterio de aceptación lo verifica de punta a punta.                                                                                                                                |
| En Android, alternar `secureTextEntry` sobre un `TextInput` montado puede cambiar la fuente del campo o vaciarlo (comportamiento conocido de React Native).                   | La verificación de esta spec es en iOS, que es donde se desarrolla. Si el bug aparece al probar en Android, se corrige remontando el input con una `key` derivada de `isSecure`; no se implementa de entrada porque penaliza el caso normal. |
| El icono del ojo queda demasiado pegado al texto y se toca sin querer al escribir.                                                                                            | El `TextInput` ya tiene `marginRight: 10`; si al probar se ve apretado, se sube el margen. Criterio de aceptación: se puede seguir escribiendo con la contraseña visible.                                                                    |

---

## Lo que **no** entra en esta spec

- Campo de contraseña en la pantalla de registro.
- Tests unitarios de componentes de UI (React Native Testing Library).
- Verificación automatizada con `agent-device`.
- Los mensajes de error diferenciados del login — eso es la spec 09.
- Ocultar la contraseña automáticamente por foco, envío o timeout.

Cada una de esas, si entra, va en su propia spec.
