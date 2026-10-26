# EduAlerta — criterios de aceptación y operación

**Alcance del parche:** CRUD principal de estudiantes, alertas y resultados académicos; listados de administración; controles de acceso; búsqueda/paginación; operación de la demostración ML; índices y rutinas de respaldo.

## 1. Estado de implementación

| Criterio | Implementación entregada | Evidencia demostrable |
|---|---|---|
| CRUD y consultas | DTO validados, estados HTTP, filtros y `Page` de Spring Data JPA con límite de 100 registros por página; índices de consulta | `ListaEstudiantes`, `Alertas`, `AdminUsuarios` y `RegistroResultadosAcademicos` |
| Seguridad y sincronización | API con JWT/roles; hash BCrypt; repositorios JPA; pantallas principales escriben/leen por Spring y PostgreSQL. El frontend elimina la sesión ante 401 | Inicio de sesión, rutas privadas, permisos del backend y datos persistidos tras refrescar |
| Escalabilidad | Paginación de servidor, filtros parametrizados mediante JPA, índices B-tree y trigramas, backups/restauración | Botones de página, migración V4 y scripts `backend/scripts` |
| Componente emergente | Flujo React → Spring Boot → FastAPI; el modelo de demostración se genera si falta y se conserva en un volumen de Docker | `PrediccionRiesgo`, enlazada desde Alertas y Analítica; los gráficos utilizan `/api/analitica/resumen` en lugar de descargar todos los registros |

## 2. CRUD y códigos HTTP

- `GET /api/estudiantes?texto=&estado=&nivelRiesgo=&grado=&pagina=0&tamano=20`: consulta filtrada/paginada.
- `GET /api/estudiantes/{id}`; `POST /api/estudiantes` (201); `PUT /api/estudiantes/{id}`; `DELETE /api/estudiantes/{id}` (204, baja lógica).
- `GET /api/alertas?texto=&estado=&nivelRiesgo=&grado=&pagina=0&tamano=20`; `GET /api/alertas/{id}`; `POST` (201); `PUT`; `PATCH /{id}/estado`; `DELETE` (204, archivo lógico para mantener seguimiento); `GET/POST /{id}/seguimientos`.
- `GET /api/resultados-academicos?texto=&resultado=&estudianteId=&verificado=&pagina=0&tamano=20`; `GET /{id}`; `POST` (201); `PUT /{id}`; `DELETE /{id}` (204).
- `GET /api/admin/usuarios?texto=&pagina=0&tamano=20`; `POST /api/admin/usuarios` (201); `PUT /api/admin/usuarios/{id}`; `DELETE /api/admin/usuarios/{id}` (204, desactivación lógica). La pantalla administrativa permite crear, editar y desactivar cuentas; no permite modificar/desactivar cuentas administradoras desde sus tarjetas.
- `GET /api/analitica/resumen` entrega conteos y promedios agregados para paneles sin bajar filas individuales.
- `GET /api/health/db` confirma la conexión con PostgreSQL.

Las páginas empiezan en `0`; el tamaño debe estar entre `1` y `100`. Los errores de validación devuelven 400, los duplicados/conflictos 409, la ausencia de recurso 404, la falta de autenticación 401 y los permisos insuficientes 403. La búsqueda usa parámetros de JPA, no concatenación de SQL sin parametrizar. No se usa `SELECT *` en las consultas introducidas por este parche.

La baja de estudiantes no borra la ficha ni sus relaciones. Eliminar una alerta la archiva. En cambio, el CRUD de resultados académicos elimina el resultado solicitado físicamente porque ese módulo no tiene una bandera de archivo ni una retención definida; acordar una política de auditoría si la institución necesita conservar todas las versiones.

## 3. Seguridad y sincronización

- Spring Security verifica JWT y aplica roles al endpoint; proteger una ruta en React es solo una barrera de UX, no reemplaza la autorización del servidor.
- `BCryptPasswordEncoder` almacena hashes. Los DTO de usuario no incluyen el hash.
- Las rutas CRUD usan Spring Data JPA/ORM. El cliente HTTP React adjunta el JWT a llamadas protegidas y borra la sesión si recibe 401.
- La dirección interna de FastAPI se configura en Docker Compose y no se necesita en el bundle frontend. Las predicciones pasan por `/api/ml/modeling/predict`, bajo autorización de roles.
- No subir `.env`, tokens o credenciales reales al repositorio ni a capturas. Los valores usados en desarrollo deben rotarse antes de publicar o desplegar fuera del equipo local.
- Los flujos principales de estudiantes, alertas, cuentas, resultados académicos y la predicción/alta de alerta usan PostgreSQL a través de Spring.

**Limitación visible y no ocultada:** el test y los resultados vocacionales existentes (`vocational.service.ts`, `TestVocacional` y `ResultadosVocacionales`) aún usan `localStorage`, y no se sincronizan entre navegadores ni equipos. Los campos de asistencia y respuestas vocacionales tampoco tienen todavía un modelo persistido completo en PostgreSQL. No presentar esos dos módulos como sincronizados entre dispositivos hasta realizar esa integración.

## 4. Componente ML

FastAPI valida las ocho variables de entrada y devuelve probabilidades, clase simulada, procedencia y advertencia. Si el archivo del modelo todavía no existe, el servicio genera un modelo experimental reproducible a partir de datos sintéticos; un volumen Docker conserva el archivo entre recreaciones del contenedor. Si FastAPI falla, la API devuelve un error de servicio en lugar de fingir una predicción válida.

La pantalla llama a Spring, muestra el estado de carga/errores/probabilidades y permite guardar una alerta con nivel `sin_evaluar`. No convierte la clase sintética en un riesgo real automáticamente. El modelo **no está validado con datos observados de estudiantes y no debe usarse para decisiones académicas sobre personas reales**. La presencia de un flujo técnico no equivale a validación científica ni clínica/educativa del modelo.

## 5. Índices, caché y escalabilidad

La migración Flyway V4 crea índices para búsquedas por estado/fecha/relación y GIN trigram para patrones `LIKE '%texto%'`. El panel de Analítica consulta `/api/analitica/resumen`, que agrupa conteos en PostgreSQL sin materializar todos los estudiantes y alertas en el frontend. `pg_trgm` debe estar disponible en la instancia PostgreSQL; en servicios administrados podría necesitar habilitación previa por parte del administrador de base de datos. Verificar los planes con `EXPLAIN (ANALYZE, BUFFERS)` en una copia representativa, porque un índice no garantiza que el optimizador lo seleccione en todas las distribuciones.

La caché no se habilita por defecto: estos datos cambian con frecuencia y algunos son sensibles. Si las métricas muestran que hace falta, añadir TTL breve para catálogos no sensibles, invalidación tras escritura y no guardar respuestas personales por usuario en una caché compartida. Para más carga: mantener límites de página, ajustar pool de conexiones, medir latencias/consultas lentas y considerar réplicas de lectura cuando la infraestructura lo justifique.

## 6. Copias de seguridad y restauración

Los scripts operan contra el servicio `db` definido en `backend/compose.yaml`, usando el usuario/base que Compose ya inyecta; no escriben contraseñas en los scripts. Ejecútalos con PowerShell desde cualquier carpeta:

```powershell
.\backend\scripts\backup-db.ps1
.\backend\scripts\restore-db.ps1 -BackupPath .\backend\backups\edualerta-AAAA-MM-DD-HHMMSS.dump
```

La restauración exige escribir `RESTAURAR` y reemplaza los objetos contenidos en el respaldo. Mantén respaldos fuera del equipo, limita acceso y retén varias generaciones. Un archivo recién creado no demuestra que sea recuperable: programa restauraciones de prueba en una base aislada y documenta tiempo/resultado.

## 7. Prueba de aceptación en el equipo local

1. Haz una copia de seguridad del proyecto y confirma que `.env` está fuera del control de versiones.
2. Desde la raíz, levanta/reconstruye backend y servicio ML:

   ```powershell
   docker compose -f ".\backend\compose.yaml" up -d --build api ml-service
   docker compose -f ".\backend\compose.yaml" ps
   Invoke-RestMethod "http://localhost:8080/api/health/db"
   ```

3. Ejecuta `.\backend\scripts\test-acceptance.ps1` desde PowerShell y autentícate con una cuenta de personal con permisos de administración/docencia. La contraseña se solicita como texto seguro y el token permanece en memoria del proceso.
4. En el frontend, entra a **Estudiantes**, crea/edita una ficha, busca con filtros y verifica la baja lógica; en **Alertas**, crea/edita, cambia estado, agrega seguimiento y archiva; en **Analítica**, usa **Gestionar resultados** para probar el CRUD paginado; usa **Probar IA experimental** para comprobar la ruta a FastAPI.
5. Confirma que los datos persisten tras refrescar. Revisa los registros de API/ML si una prueba falla. No registres JWT ni contraseñas en las evidencias.

La prueba automatizada es una prueba de integración de desarrollo, no un sustituto de pruebas de carga, revisión de seguridad ni validación del modelo.
