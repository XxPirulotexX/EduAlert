# EduAlerta API — entorno reproducible con Docker

**Estado:** base inicial de desarrollo. Incluye PostgreSQL 16, API Spring Boot, comprobación de conexión y CRUD de estudiantes. Aún no incluye autenticación real ni integración con las pantallas del frontend.

## ¿Por qué PostgreSQL?

EduAlerta contiene relaciones entre estudiantes, matrículas, rendimiento, asistencia, alertas, seguimientos e intentos vocacionales. PostgreSQL permite modelarlas mediante claves primarias y foráneas, restricciones e historial consistente. Para el alcance actual no hay una necesidad clara que justifique una base NoSQL.

## Requisitos del equipo

- Docker Desktop instalado y en ejecución (Windows suele utilizar el backend WSL 2).
- Git para obtener el repositorio.
- Node.js/npm para ejecutar el frontend.

**No es necesario instalar Java ni Maven en Windows** para levantar la API con el flujo Docker de este documento: Maven compila el proyecto dentro de la imagen.

## Primer inicio

1. Desde la raíz del repositorio, abre una terminal en `backend/`.
2. Copia el archivo de ejemplo y configura una contraseña local:

   ```powershell
   Copy-Item .env.example .env
   ```

   Edita `.env` y reemplaza `DB_PASSWORD`. No subas el archivo `.env` al repositorio.

3. Construye la imagen y levanta la base de datos y la API:

   ```powershell
   docker compose up --build -d
   ```

4. Revisa los servicios:

   ```powershell
   docker compose ps
   docker compose logs -f api
   ```

5. Comprueba la conexión real de la API con PostgreSQL en:

   `http://localhost:8080/api/health/db`

   Una respuesta correcta contiene `"status":"ok"` y `"database":"edualerta"`.

## Comandos frecuentes

```powershell
# Consultar estado
 docker compose ps

# Ver los últimos registros de la API
 docker compose logs --tail=100 api

# Reconstruir la API después de cambios de código
 docker compose up --build -d api

# Detener contenedores sin borrar datos
 docker compose down

# ¡PELIGRO! Detener y eliminar también el volumen con datos de PostgreSQL
 docker compose down -v
```

El volumen `edualerta_pgdata` conserva los datos aunque se eliminen y vuelvan a crear los contenedores. No ejecutes `docker compose down -v` si necesitas conservar la base local.

## Trabajo en equipo

- Se versionan `Dockerfile`, `compose.yaml`, código y `.env.example`.
- Cada integrante crea su propio `.env`; este archivo está excluido de Git.
- Cada computador tendrá su propia base local. Docker Compose **no sincroniza automáticamente los datos entre compañeros**. El esquema y los datos de prueba compartidos deberán entregarse mediante migraciones y scripts versionados, o mediante una base de desarrollo remota administrada por el equipo.
- No incluyas datos personales reales ni credenciales en semillas, commits o capturas de pantalla.

## CRUD de estudiantes

Base URL: `http://localhost:8080/api/estudiantes`

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/estudiantes` | Lista estudiantes. |
| GET | `/api/estudiantes/{id}` | Consulta por identificador. |
| POST | `/api/estudiantes` | Crea una ficha con validación. |
| PUT | `/api/estudiantes/{id}` | Actualiza una ficha con validación. |
| DELETE | `/api/estudiantes/{id}` | Da de baja lógica cambiando el estado a inactivo. |

Ejemplo de creación:

```json
{
  "usuarioId": null,
  "codigoEstudiantil": "EA-001",
  "nombres": "Ana",
  "apellidos": "Pérez",
  "estado": "activo"
}
```

## Seguridad y límites actuales

- El CRUD todavía no tiene autenticación: solo debe usarse en desarrollo local.
- `spring.jpa.hibernate.ddl-auto=update` está activo para facilitar el inicio. Antes de fijar el esquema de entrega se sustituirá por migraciones versionadas (por ejemplo, Flyway).
- El CRUD cubre la ficha básica del estudiante; no sustituye todavía el modelo de rendimiento, asistencia, evaluación de riesgo y orientación definido en la documentación.
- El frontend todavía no ha sido conectado a estos endpoints.
