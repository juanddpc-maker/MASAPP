# Escuela de Artes Marciales - Proyecto base

Estructura:
- `backend/` — API en NestJS + Prisma
- `frontend/` — App web en React + Vite
- `docker-compose.yml` — Postgres + pgAdmin para desarrollo local

## 1. Levantar la base de datos local

```bash
docker compose up -d
```

## 2. Levantar el backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init   # crea las tablas en Postgres
npx prisma db seed                   # crea el usuario admin de prueba
npm run start:dev
```

El backend queda en `http://localhost:3000/api`.

Usuario de prueba creado por el seed:
- correo: `admin@escuela.local`
- password: `admin123`

## 3. Levantar el frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

La app queda en `http://localhost:5173`. Entra con el usuario de prueba y verás
el listado de alumnos (vacío al inicio — usa Prisma Studio para agregar datos
de prueba rápido con `npx prisma studio` desde la carpeta backend).

## Qué ya está construido

- Autenticación con JWT y roles (ADMINISTRADOR, INSTRUCTOR, TUTOR)
- Módulo de Alumnos completo (crear, listar, ver, actualizar, dar de baja)
  con reglas de permiso: un tutor solo ve a sus propios hijos
- Esquema completo de base de datos (17 tablas) con Prisma, reflejando
  el ERD: Alumnos, Tutores, Usuarios, Cintas, Eventos de cambio de cinta,
  Pagos, Comunicación, Inventario y Ventas

## Qué falta por construir (siguiente paso natural)

Cada uno de estos módulos sigue el mismo patrón que `alumnos/`
(service + controller + module). Copia esa carpeta como plantilla:

- `tutores/`
- `cintas/` y `eventos-cambio-cinta/`
- `pagos/` (periodos de pago + candidatos)
- `comunicacion/` (conversaciones + mensajes + registros de comportamiento)
- `inventario/` (productos, variantes, stock, movimientos, ventas)
- `usuarios/` (alta de instructores y tutores con acceso)

## Estrategia de deployment (cuando esté listo para salir de local)

1. **Backend + base de datos → Railway**
   - Crea un proyecto en Railway, agrega un servicio Postgres administrado
   - Conecta este repo de GitHub para el servicio del backend (usa el Dockerfile ya incluido)
   - Configura las variables de entorno (`DATABASE_URL` la da Railway automático, agrega `JWT_SECRET`)
   - Cada `git push` a main despliega solo el backend

2. **Frontend → Vercel**
   - Conecta el mismo repo de GitHub, apunta el "root directory" a `frontend/`
   - Configura `VITE_API_URL` apuntando a la URL pública que te da Railway para el backend
   - Cada `git push` a main despliega automático el frontend

Con esto tienes deploy continuo desde GitHub para ambas partes, sin tocar
servidores manualmente.
