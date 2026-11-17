# Almacenamiento local

La aplicación crea `users-v2/` con Level 10. Esta carpeta se excluye del control de versiones.

`users/` es la ruta del proyecto histórico. No se abre ni se migra automáticamente porque su esquema podía contener claves y datos de tarjetas sin protección.

Las pruebas de API usan una carpeta temporal; las de navegador utilizan `.cache/e2e-db/`. No usan la base de la demo normal.

Los perfiles de prueba permanecen en disco. Cierra el servidor antes de respaldar o administrar la base. No ingreses datos reales.
