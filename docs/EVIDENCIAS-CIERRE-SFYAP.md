# Cierre de validación de la PoC CI/CD – Software Factory / Yape

> Simulación académica basada en Bankify. No es la aplicación oficial de Yape, no procesa dinero real y no se despliega sobre infraestructura del BCP. Los resultados reflejan exclusivamente el repositorio `Solucion_Yape`.

## Alcance

El desarrollo corresponde a las oportunidades seleccionadas en el trabajo final:

| ID | Objetivo | Componente implementado |
| --- | --- | --- |
| O1 | Automatizar calidad y seguridad | GitHub Actions, JUnit/Maven, pruebas de billetera Node, SpotBugs y auditoría de dependencias |
| O2 | Aprobar según riesgo | Clasificador por rutas modificadas; ambientes `demo-automatico` y `demo-revision`; comprobación de revisores |
| O3 | Integrar trazabilidad | SHA de commit, ejecución, reporte de riesgo, manifiesto SHA-256 de JAR, reportes de validación y de despliegue |

## Evidencia contrastada antes del cierre

- [PR #2 – implementación de controles](https://github.com/joaquinrojasm/Solucion_Yape/pull/2): integrado en `main` con commit `d7767ed0acc3004aa20fc9730df5bb61badd84a4`.
- [Ejecución en `main` tras integración](https://github.com/joaquinrojasm/Solucion_Yape/actions/runs/45045139449): finalización correcta de backend, billetera, seguridad, clasificación, verificación de ambiente y despliegue demostrativo.
- [Ejecución manual con revisión solicitada](https://github.com/joaquinrojasm/Solucion_Yape/actions/runs/45045327177): los seis jobs concluyeron correctamente. En el log del clasificador constan `FORCE_REVIEW=true`, riesgo **alto** y ambiente `demo-revision`. El log de configuración constata que ese ambiente tiene revisores requeridos. Para demostrar identidad de quien aprobó y separación efectiva de funciones, consultar el historial de despliegue del ambiente en GitHub; la cuenta única de una PoC no prueba segregación organizacional.
- [Caso defectuoso bloqueado inicialmente](https://github.com/joaquinrojasm/Solucion_Yape/actions/runs/44564174389): ejecución de CI fallida en la rama de demostración del defecto de fondos. [Versión posterior corregida y satisfactoria](https://github.com/joaquinrojasm/Solucion_Yape/actions/runs/44565339386).

Cada ejecución satisfactoria contiene artefactos descargables con reportes del backend, billetera, seguridad, riesgo, aplicación empaquetada y verificación del despliegue. Los artefactos GitHub Actions caducan conforme a la retención configurada (30 días), por lo que conviene descargarlos para el informe.

## Validación pendiente de ruta automática de bajo riesgo

Este archivo y la actualización de la documentación se proponen mediante un PR **solo documental**. Al integrar el PR, el evento `push` sobre `main` debe identificar las rutas de documentación como **riesgo bajo** y utilizar `demo-automatico`, siempre que todas las compuertas pasen. La evidencia válida es el registro real del workflow posterior a la integración; no se considera completado hasta comprobarlo.

## Criterios de cierre y resultados

| Escenario | Resultado esperado | Referencia | Estado verificado |
| --- | --- | --- | --- |
| Compilación y pruebas estables | Controles correctos, artefactos generados | Run 45045139449 | Completado |
| Defecto controlado en fondos | Fallo en CI, sin liberación de la versión defectuosa | Run 44564174389 | Completado |
| Riesgo alto con revisión | Ambiente protegido y liberación tras la compuerta | Run 45045327177 | Ejecución completada; consultar historial de aprobación para atribución |
| Riesgo bajo documental | Clasificación bajo, `demo-automatico`, despliegue exitoso | PR documental de cierre y su futura ejecución de `main` | Por verificar |
| Artefacto trazable | Mismo JAR versionado con SHA-256 y reporte de verificación | Artefactos de runs exitosos | Completado en ejecución temporal |

## Gestión y documentación

- [Jira – SFYAP-1 (O1)](https://usil-sf.atlassian.net/browse/SFYAP-1)
- [Jira – SFYAP-2 (O2)](https://usil-sf.atlassian.net/browse/SFYAP-2)
- [Jira – SFYAP-3 (O3)](https://usil-sf.atlassian.net/browse/SFYAP-3)
- [Jira – SFYAP-4 (evidencias y validación)](https://usil-sf.atlassian.net/browse/SFYAP-4)
- [Confluence – Diseño TO BE y validación](https://usil-sf.atlassian.net/wiki/spaces/DDS/pages/20643842)
- [Documento académico](https://docs.google.com/document/d/17CQZQ2lzsTTqqH-U8v088vW2Po5x6jg7UseS66n9Y0U/edit)

## Instrucciones para reproducción

1. En GitHub, consultar **Actions → Validacion automatica Yape** y seleccionar un run de `main`.
2. Descargar reportes y conservar capturas del resumen de los jobs y artefactos.
3. Para cambios sensibles, ejecutar `workflow_dispatch` con `forzar_revision=true` y observar la protección de `demo-revision`.
4. Para la ruta automática, integrar un PR que modifique exclusivamente documentación permitida; verificar el `push` sobre `main`.
5. Para demostrar bloqueo de seguridad sin introducir vulnerabilidades en la app, ejecutar la acción manual con `demostrar_vulnerabilidad=true`; el job de seguridad debe fallar y evitar el despliegue.

**Limitaciones:** no se afirma prevención absoluta de fallas, monitoreo continuo, rollback automático, despliegue persistente ni impacto cuantificado sobre el servicio Yape real.
