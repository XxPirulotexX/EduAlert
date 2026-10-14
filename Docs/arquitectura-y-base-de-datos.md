# EduAlerta — Arquitectura y diseño de base de datos

**Versión:** 0.2  
**Estado:** Documentación de entrega — revisar que coincida con la rama final  
**Fecha:** 14 de octubre de 2026

## 1. Arquitectura implementada

EduAlerta utiliza una arquitectura cliente-servidor dividida en:

- **Frontend:** React, TypeScript y Vite. Presenta las pantallas, valida formularios para mejorar la experiencia, gestiona estados de carga/errores y consume la API mediante HTTP.
- **Backend:** Spring Boot con API REST. Valida los datos, aplica reglas de negocio, autentica usuarios y autoriza las operaciones según su rol.
- **Persistencia:** PostgreSQL. Conserva las cuentas, fichas de estudiantes y los datos gestionados por los endpoints implementados.
- **Contenedores:** Docker Compose permite iniciar PostgreSQL y Spring Boot con una configuración común para el equipo.
- **Autenticación:** contraseñas almacenadas mediante hash BCrypt y token JWT enviado como `Authorization: Bearer ...` en las solicitudes autenticadas.

Flujo de las solicitudes:

```text
React / TypeScript
        |
        | HTTP + JSON (JWT cuando el endpoint es privado)
        v
Spring Boot REST + Spring Security
        |
        | JPA / JDBC
        v
PostgreSQL
```

## 2. Justificación del modelo relacional

Se selecciona PostgreSQL como base de datos relacional porque el dominio tiene entidades estructuradas y relaciones explícitas: una cuenta tiene un rol, una cuenta de estudiante puede vincularse con una ficha estudiantil, y las operaciones necesitan integridad, restricciones de unicidad y relaciones mediante claves foráneas.

El CRUD requiere crear, consultar, actualizar y desactivar registros de forma consistente. Las transacciones y restricciones relacionales ayudan a evitar códigos estudiantiles duplicados y vínculos inválidos. Además, el modelo entidad-relación facilita documentar las relaciones entre usuarios, estudiantes, matrículas, rendimiento, asistencia, alertas y resultados vocacionales.

Una base documental NoSQL no ofrece una ventaja clara para este alcance académico: el esquema tiene relaciones fuertes, consultas previsibles y necesidad de integridad referencial. Por ello PostgreSQL resulta una opción adecuada y sencilla de justificar.

## 3. Variables de entorno

Las credenciales locales se guardan en `backend/.env`, que no debe subirse a Git. El repositorio debe contener únicamente `backend/.env.example` sin secretos reales. El frontend utiliza `/.env.local` para `VITE_API_BASE_URL`; ese archivo también debe quedar excluido de Git.

Ejemplo conceptual de la URL para el frontend:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

No se deben incluir valores de contraseña ni `JWT_SECRET` en capturas, documentación pública, commits ni salidas compartidas de `docker compose config`.

## 4. Endpoints de referencia

Las rutas y permisos se deben contrastar con el código de la rama que se entrega.

| Método | Ruta | Uso | Acceso previsto |
|---|---|---|---|
| `GET` | `/api/health/db` | Comprobar conectividad con PostgreSQL | Público para diagnóstico local |
| `POST` | `/api/auth/login` | Validar correo y contraseña y obtener JWT | Público |
| `GET` | `/api/auth/me` | Obtener la identidad vinculada al token | Usuario autenticado |
| `GET` | `/api/estudiantes` | Consultar estudiantes | Administrador, docente u orientador |
| `GET` | `/api/estudiantes/{id}` | Consultar una ficha | Administrador, docente u orientador |
| `POST` | `/api/estudiantes` | Crear ficha | Administrador o docente |
| `PUT` | `/api/estudiantes/{id}` | Actualizar ficha | Administrador o docente |
| `DELETE` | `/api/estudiantes/{id}` | Dar de baja lógica | Administrador o docente |
| `GET` | `/api/admin/usuarios` | Consultar cuentas | Administrador |
| `POST` | `/api/admin/usuarios` | Crear cuenta | Administrador |

La autorización efectiva se realiza en el servidor. Las rutas protegidas en React mejoran la navegación, pero no sustituyen las reglas de Spring Security.

## 5. Alcance que no se debe sobreafirmar

El CRUD real de fichas estudiantiles y la autenticación/autoridad inicial están comprobados en el entorno local reportado por el equipo. No implica que todos los módulos de Alertas Tempranas, analítica, asistencia y orientación vocacional estén migrados a la API: algunas pantallas conservan datos simulados o persistencia local.

La interfaz de administración permite crear y consultar cuentas en la versión actual; no debe describirse como un CRUD completo de usuarios si edición, baja y recuperación de contraseña no están implementadas.

El test vocacional sigue siendo una estimación orientativa heurística y no una prueba psicométrica validada. El sistema no debe tomar decisiones disciplinarias automáticas a partir de niveles de riesgo.
