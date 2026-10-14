# EduAlerta — Guía de ejecución y pruebas de aceptación

**Versión:** 0.2  
**Fecha:** 14 de octubre de 2026

## 1. Requisitos locales

- Windows con Docker Desktop iniciado (motor Linux/WSL 2 activo cuando corresponda).
- Node.js y npm para ejecutar el frontend.
- Git para control de versiones.
- No se requiere instalar Java ni Maven en Windows para construir/ejecutar el backend con el Dockerfile del proyecto.

## 2. Inicio del backend y PostgreSQL

Desde PowerShell:

```powershell
cd backend
Copy-Item .env.example .env  # solo la primera vez; no sobrescribas un .env existente
```

Edita `backend/.env` con valores locales. Luego:

```powershell
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 api
```

Confirma que PostgreSQL aparece `Healthy` y que la API ha iniciado. Verifica la conectividad en `http://localhost:8080/api/health/db`.

Para detener los contenedores conservando los datos, ejecuta desde `backend`:

```powershell
docker compose down
```

**No uses `docker compose down -v` salvo que desees borrar deliberadamente el volumen y todos sus datos locales.**

## 3. Inicio del frontend

Desde otra terminal, en la raíz del repositorio:

```powershell
npm install
```

Crea `/.env.local` si no existe:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

Luego:

```powershell
npm run dev
```

Si se modifica una variable `VITE_*`, reinicia Vite. No pongas secretos en variables `VITE_*`, porque se publican en el código cliente.

## 4. Compilación de control

Desde la raíz del frontend:

```powershell
npm run build
npx tsc --noEmit
```

La advertencia de chunks de Vite es informativa si el comando finaliza correctamente; los errores de TypeScript sí deben corregirse antes de entregar.

## 5. Matriz de pruebas manuales

Marca cada prueba después de repetirla en la misma versión y rama que vas a entregar.

| ID | Prueba | Resultado esperado | Estado reportado por el equipo |
|---|---|---|---|
| DB-01 | Consultar `/api/health/db` | `status: ok` y base `edualerta` | Verificado localmente |
| CRUD-01 | `POST /api/estudiantes` | Ficha creada con ID | Verificado localmente |
| CRUD-02 | `GET /api/estudiantes/{id}` | Devuelve ficha creada | Verificado localmente |
| CRUD-03 | `PUT /api/estudiantes/{id}` | Persiste cambio | Verificado localmente |
| CRUD-04 | `DELETE /api/estudiantes/{id}` | Cambio de estado a inactivo; se conserva registro | Verificado localmente |
| UI-01 | Crear desde el frontend | La tarjeta aparece sin recargar la página | Verificado localmente |
| UI-02 | Actualizar desde el frontend | Cambios visibles al instante | Verificado localmente |
| UI-03 | Validación de formulario | Campos obligatorios bloquean envío inválido | Verificado localmente |
| AUTH-01 | Credenciales incorrectas | Login rechazado, sin token | Verificado localmente |
| AUTH-02 | Endpoint privado sin token | HTTP 401 | Verificado localmente |
| AUTH-03 | Docente entra a administración de usuarios | HTTP 403 | Verificado localmente |
| AUTH-04 | Estudiante solicita listado general del CRUD | HTTP 403 | Verificado localmente |
| ROUTE-01 | Visitar ruta privada sin sesión | Redirección a login | Verificado localmente |
| ROUTE-02 | Entrar en ruta de otro rol | Redirección al inicio autorizado | Verificado localmente |
| BUILD-01 | `npm run build` y `npx tsc --noEmit` | Ambos finalizan sin errores | Repetir al preparar entrega |

Los estados de la tabla reflejan las comprobaciones comunicadas durante el desarrollo; se recomienda repetir toda la matriz en la versión que se subirá para evaluación.

## 6. Cuentas de prueba

- Administrador inicial: el correo definido en `BOOTSTRAP_ADMIN_EMAIL` y la contraseña de `BOOTSTRAP_ADMIN_PASSWORD` en `backend/.env`.
- Docente y estudiante: las cuentas creadas desde la pantalla administrativa o mediante `POST /api/admin/usuarios`. Las contraseñas son las establecidas al crearlas; no hay una contraseña predeterminada para esas cuentas.

Nunca copies contraseñas en este documento ni en commits.

## 7. Resolución de fallos comunes

- **No conecta el navegador, pero la API abre:** inspecciona la consola (F12) por CORS y confirma que el origen real de Vite está incluido en `CorsConfig.java`.
- **HTTP 401:** comprueba que la sesión no venció, que el token se envía y que el usuario está activo.
- **HTTP 403:** la sesión existe, pero el rol no tiene permiso para esa operación.
- **PostgreSQL no inicia:** revisa `docker compose ps` y `docker compose logs db`.
- **API no inicia:** revisa `docker compose logs --tail=150 api` y soluciona el primer error de arranque/compilación.
- **Se pierden datos después de reiniciar:** confirma que se está usando el volumen Compose y evita `docker compose down -v`.

## 8. Trabajo en equipo

Cada compañero necesita su propio `.env` local. El equipo comparte por Git `compose.yaml`, `Dockerfile`, el código, migraciones y `.env.example`; no comparte contraseñas ni secretos. Cada instalación Docker usa sus propios datos locales. Para compartir los mismos registros entre todos se necesita una instancia de base de datos de desarrollo compartida, configurada con acceso restringido; no publiques PostgreSQL directamente en Internet.
