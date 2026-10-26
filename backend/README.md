# EduAlerta — API REST y servicios locales

**Entorno:** Spring Boot 3.5.x / Java 21, PostgreSQL 16, Flyway y un servicio ML experimental con FastAPI. El navegador consume la API Spring; no conecta directamente a PostgreSQL ni a FastAPI.

## Arranque local

1. Inicia Docker Desktop.
2. En PowerShell, desde `backend/`, crea o revisa `backend/.env` a partir de la plantilla local disponible. No subas `.env` al repositorio.
3. Asegúrate de definir `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` y `BOOTSTRAP_ADMIN_PASSWORD`. `JWT_SECRET` debe ser Base64 y decodificar al menos 32 bytes; cambia todas las credenciales de ejemplo. `JWT_TTL_SECONDS` y `BOOTSTRAP_ADMIN_*` permiten configurar la sesión y la cuenta inicial.
4. Ejecuta:

   ```powershell
   docker compose up -d --build
   docker compose ps
   Invoke-RestMethod "http://localhost:8080/api/health/db"
   ```

Las migraciones Flyway versionadas crean/validan el esquema e índices. La migración V4 usa `pg_trgm` para índices de búsqueda parcial; en una base administrada, un DBA puede tener que habilitar esa extensión antes de migrar.

Desde la raíz del proyecto, ejecuta `npm install` y `npm run dev` para iniciar el frontend. Por defecto, el cliente utiliza `http://localhost:8080/api`; personaliza `VITE_API_BASE_URL` si la API está en otra dirección.

## Endpoints principales

| Método | Ruta | Resultado |
|---|---|---|
| GET/POST | `/api/estudiantes` | Consulta paginada / crea una ficha (201) |
| GET/PUT/DELETE | `/api/estudiantes/{id}` | Lee, edita y da de baja lógicamente (204) |
| GET/POST | `/api/alertas` | Consulta paginada / crea alerta (201) |
| GET/PUT/PATCH/DELETE | `/api/alertas/{id}` y subrutas | Lee, edita, cambia estado y archiva (204) |
| GET/POST/PUT/DELETE | `/api/resultados-academicos` y `/{id}` | CRUD paginado de resultados académicos |
| GET/POST/PUT/DELETE | `/api/admin/usuarios` y `/{id}` | Consulta/crea/edita/desactiva cuentas (solo admin) |
| POST | `/api/ml/modeling/predict` | Predicción de demostración protegida por roles |
| GET | `/api/analitica/resumen` | KPI agregados sin materializar todos los registros en el navegador |
| GET | `/api/health/db` | Diagnóstico de conexión con PostgreSQL |

Los endpoints protegidos requieren `Authorization: Bearer <JWT>`. Las consultas paginadas usan `pagina` desde cero y `tamano` entre 1 y 100. Códigos típicos: 201 al crear, 204 al eliminar/archivar, 400 por validación, 401 sin sesión, 403 sin permiso, 404 si no existe el recurso y 409 por conflicto/duplicado.

## Cuenta y protección

Las contraseñas se guardan como hashes BCrypt. La API devuelve DTOs que no incluyen el hash. Las cuentas desactivadas no pueden iniciar sesión; la baja lógica mantiene su relación histórica. El CRUD de estudiantes también da de baja de forma lógica. Borrar una alerta la archiva para conservar seguimientos. Los resultados académicos se eliminan físicamente: definir una política de auditoría si el entorno requiere retención.

## Machine learning: estado real

FastAPI valida las ocho características del formulario de predicción. Si aún no hay un archivo de modelo, se genera un modelo determinista con datos sintéticos y se conserva en un volumen Docker. La pantalla `PrediccionRiesgo` llama a Spring Boot, muestra la respuesta/advertencia y permite crear una alerta con nivel `sin_evaluar` para revisión humana.

El modelo no ha sido validado con resultados reales de estudiantes. Las métricas y salidas son demostrativas; no las utilices para decisiones reales de promoción, intervención o deserción.

## Pruebas y operaciones

```powershell
# desde la raíz del proyecto
docker compose -f ".\backend\compose.yaml" up -d --build api ml-service
.\backend\scripts\test-acceptance.ps1
.\backend\scripts\backup-db.ps1
```

Para restaurar, usa `backend/scripts/restore-db.ps1`; requiere confirmación interactiva y detiene temporalmente la API.

Las pruebas de integración no sustituyen pruebas de carga, revisión de seguridad, restauraciones periódicas ni validación del modelo. La pantalla vocacional existente todavía persiste localmente en el navegador; sus resultados no se sincronizan entre dispositivos ni se guardan actualmente en PostgreSQL.
