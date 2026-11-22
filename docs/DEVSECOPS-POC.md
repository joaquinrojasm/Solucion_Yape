# PoC DevSecOps de Yape / Bankify

Esta guía describe la rama `feat/seguridad-aprobacion-despliegue` y el workflow `Validacion automatica Yape`. La aplicación conserva su interfaz. El despliegue de esta PoC inicia el JAR en un runner temporal y lo detiene al terminar; no se conecta con Yape ni con producción.

## O1 — Pruebas, calidad y seguridad

El workflow integra estas compuertas:

- `./mvnw --batch-mode --no-transfer-progress -Pseguridad verify`: pruebas Java, SpotBugs y empaquetado Spring Boot.
- `npm test`: pruebas de reglas de la billetera.
- `npm audit --audit-level=high`: el análisis de dependencias detiene el workflow ante vulnerabilidades altas o críticas.
- `.github/scripts/classify-risk.test.mjs`: pruebas de las reglas de clasificación y de validación de los entornos.
- `demostrar_vulnerabilidad=true`: ejecuta una auditoría sobre una dependencia deliberadamente vulnerable aislada bajo `.github/security/vulnerable/`. Esa ejecución debe fallar y bloquear los jobs que dependen de seguridad; no altera las dependencias de la aplicación.

Los reportes de Surefire, SpotBugs, npm audit y las pruebas de la billetera se guardan como artefactos de Actions.

## O2 — Riesgo y aprobación

`.github/scripts/classify-risk.mjs` compara las rutas del cambio con el commit base:

| Cambio | Clasificación | Entorno elegido |
| --- | --- | --- |
| Solo documentación reconocida | Bajo | `demo-automatico` |
| Estilos o recursos visuales del frontend | Medio | `demo-revision` |
| Código, dependencias, workflow, seguridad o rutas no reconocidas | Alto | `demo-revision` |
| Sin cambios identificables o solicitud forzada | Alto | `demo-revision` |

La clasificación es determinista y usa la categoría de mayor riesgo. La opción `forzar_revision` está activada por defecto al iniciar el workflow manualmente.

### Preparar los entornos en GitHub

Antes de integrar el PR, crea estos entornos en **Settings → Environments**:

1. `demo-automatico`: sin revisores requeridos.
2. `demo-revision`: con al menos un revisor requerido. Para demostrar separación de funciones, usa una cuenta distinta de quien inició la ejecución.

El job `Verificar autorizacion configurada` comprueba los nombres y revisores vía API y falla de forma cerrada si falta la protección. La aprobación humana se gestiona con la protección de despliegue de GitHub y queda en el historial del entorno. GitHub permite configurar revisores requeridos en sus entornos; la disponibilidad depende del tipo de repositorio y plan. [Documentación oficial](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments).

## O3 — Artefacto y trazabilidad

`prepare-artifact.mjs` genera un manifiesto con commit, ejecución, actor, hora y SHA-256 del JAR. El job de demostración descarga ese mismo artefacto y comprueba que la huella y el commit coincidan antes de arrancarlo.

`deploy-demo.mjs` verifica en el proceso temporal:

- que el backend responda y sirva la interfaz;
- que una operación POST sin token CSRF se rechace;
- que una transferencia ficticia debite y acredite los saldos correctos;
- que una transferencia sin fondos sea rechazada sin alterar saldos.

El proceso se detiene al finalizar. Los logs, el manifiesto y el reporte con resultados quedan ligados al commit y al workflow run como artefactos. Esta verificación es una demostración del paquete en un entorno efímero, no un despliegue persistente.

## Secuencia de demostración

1. Abre **Actions → Validacion automatica Yape** y revisa la última ejecución de la rama.
2. Para simular una liberación manual, selecciona `main` y ejecuta `workflow_dispatch` con `forzar_revision=true`; el flujo debe esperar a que aprueben `demo-revision`.
3. Para observar la ruta automática, ejecuta en `main` con `forzar_revision=false` luego de un cambio solo documental permitido; la promoción usa `demo-automatico`.
4. Para demostrar el bloqueo de seguridad, ejecuta con `demostrar_vulnerabilidad=true`; la auditoría de la dependencia aislada debe fallar y el despliegue debe omitirse.
5. Descarga `aplicacion-<commit>` y `evidencias-despliegue-...`; revisa el SHA-256, commit, resultados y aprobación en el historial del entorno.

El PR no debe integrarse hasta crear ambos entornos. La configuración del revisor requerido necesita una persona o equipo elegido por el dueño del repositorio. La cuenta única usada para esta PoC no demuestra segregación real de funciones.

