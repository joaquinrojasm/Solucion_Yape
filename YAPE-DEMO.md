# Simulación universitaria de Yape

La interfaz React de este proyecto recrea el entorno móvil de Yape para una demostración académica. La pantalla principal se abre directamente, sin pedir credenciales reales. En una computadora se presenta dentro de un marco de aplicación; en un celular ocupa el ancho disponible.

## Qué puedes probar

- Inicio morado, buscador de funcionalidades y doce accesos a servicios.
- Mostrar y ocultar el saldo ficticio inicial de S/ 1,250.80.
- Seleccionar contactos ficticios, enviar un monto en soles y escribir un mensaje.
- Consultar el detalle del yapeo y filtrar movimientos recibidos o enviados.
- Generar y descargar un QR que contiene únicamente texto de demostración.
- Simular el escaneo de un QR para abrir el pago a Bodega Don Pepe.
- Explorar promociones, recargas, servicios, créditos y cambio de moneda de ejemplo.
- Abrir perfil, ayuda y notificaciones, o reiniciar la demo desde el perfil.

El saldo y los movimientos se guardan en `localStorage`, bajo la clave `yape-universidad-v1`. Los yapeos usan centavos enteros y validan monto positivo, precisión, límite de demostración y saldo disponible. El límite de S/ 500 de esta demo es una decisión del simulador y no una afirmación sobre los límites vigentes del servicio real.

Las operaciones de la nueva interfaz son locales y ficticias. No se conectan a Yape, no envían dinero y no llaman a la API bancaria de Bankify. Las pantallas de servicios son ejercicios de exploración: sus calculadoras no alteran el saldo. El cambio de S/ 3.75 por dólar y las cuotas sin intereses son datos de ejemplo. El backend original permanece disponible para los ejercicios de Bankify.

## Ejecutar

Requiere Java 21 o superior. Desde la raíz:

```powershell
.\mvnw.cmd package -DskipTests
java -jar target/bankify-0.0.1-SNAPSHOT.jar
```

Abre `http://localhost:18080/`. Maven instala su propia versión de Node para construir la interfaz. Si Java 8 está configurado por defecto en Windows, selecciona primero un JDK compatible en `JAVA_HOME` y `PATH`.

Para desarrollo del frontend con Node 22.14 o superior:

```powershell
cd src/main/frontend
npm ci
npm run dev
```

Pruebas de las reglas de saldo y yapeos: `npm test` dentro de `src/main/frontend`. Compilación del frontend: `npm run build`.

## Referencias visuales y recursos

Se consultaron las fuentes el 17 de noviembre de 2026. La simulación toma como referencia las capturas públicas del centro de ayuda, que pueden corresponder a una versión distinta de la instalada actualmente en cada dispositivo.

- [Captura del inicio publicada por Yape](https://www.yape.com.pe/preguntas-frecuentes/yapeo-de-servicios/como-puedo-realizar-mis-pagos-de-sunat-a-traves-de-yapear-servicios): colores, distribución, doce servicios, búsqueda, banner, saldo y acciones inferiores.
- [Imagen original de referencia](https://www.datocms-assets.com/56886/1762970094-yapear-servicios-sunat-1.png): se guarda como `public/yape/app-reference.png`. Los iconos de aprobación, remesas, seguros, bus, entradas y “Ver todo”, junto con el banner de gas, se muestran como recortes mediante CSS sobre esa imagen original.
- [Web oficial de Yape](https://www.yape.com.pe/): los SVG originales de recargas, servicios, promociones, créditos, tienda y dólares; logo e imágenes promocionales. Los nombres de los SVG de origen se conservan en los enlaces siguientes.
- [Ficha oficial de Google Play](https://play.google.com/store/apps/details?id=com.bcp.innovacxion.yapeapp&hl=es_PE): icono de la aplicación y referencia de funcionalidades.
- [Flujo de pago QR de Yape](https://www.yape.com.pe/preguntas-frecuentes/enviar-y-recibir-yapeos/31--como-hago-un-pago-con-qr): referencia para la navegación del escáner al monto y al detalle.

Los recursos descargados están en `src/main/frontend/public/yape/` para que la interfaz no dependa de imágenes remotas:

| Archivo local   | Origen                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `recargas.svg`  | [Icono original](https://www.datocms-assets.com/56886/1735247316-sp_fullcolor_smartphone_notification_symbol_soles.svg)     |
| `servicios.svg` | [Icono original](https://www.datocms-assets.com/56886/1735247316-sp_fullcolor_water_drop_spotlight.svg)                     |
| `promos.svg`    | [Icono original](https://www.datocms-assets.com/56886/1735247316-sp_fullcolor_eight_pointed_star_discount_notification.svg) |
| `creditos.svg`  | [Icono original](https://www.datocms-assets.com/56886/1735247317-sp_fullcolor_two_cash.svg)                                 |
| `tienda.svg`    | [Icono original](https://www.datocms-assets.com/56886/1735247316-sp_fullcolor_home_store.svg)                               |
| `dolares.svg`   | [Icono original](https://www.datocms-assets.com/56886/1735247317-sp_fullcolor_money_dollar_symbol.svg)                      |
| `logo.png`      | [Logo original](https://www.yape.com.pe/images/components/component-25/logo.png)                                            |
| `remesas.png`   | [Imagen original](https://www.datocms-assets.com/56886/1723236973-novedades-home-01.png)                                    |
| `seguridad.png` | [Imagen original](https://www.datocms-assets.com/56886/1749241097-banner_mobile_500x940.jpg)                                |

Los iconos generales de navegación usan la biblioteca existente `@tabler/icons-react`. La tipografía Roboto se guarda localmente desde Google Fonts. Yape y sus recursos visuales pertenecen a sus respectivos titulares; este proyecto los utiliza como referencia de una simulación académica y se identifica como tal en la interfaz y el detalle de operaciones.
