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
- **Alumnos**: alta, baja (lógica), edición, listado — un tutor solo ve a sus propios hijos
- **Tutores**: alta, baja (bloqueada si tiene alumnos activos), edición, listado
- **Usuarios**: alta de instructores/admins/tutores con acceso, baja lógica (desactivación)
- **Cintas**: catálogo por disciplina, alta/baja/edición (solo admin)
- **Eventos de cambio de cinta**: crear evento, agregar candidatos (precarga talla de cinta
  desde el perfil del alumno), actualizar resultado — al aprobar, genera automáticamente
  el registro en el historial de cintas del alumno
- **Pagos**: periodos de pago mensuales, agregar candidatos, actualizar estado de pago
- **Comunicación**: conversaciones por tema/hilo, mensajes, puede iniciar instructor o tutor
- **Inventario**: productos, variantes con talla/color/SKU, control de stock con
  bitácora de movimientos (entrada/salida/ajuste/venta/devolución)

Cada módulo del backend sigue el mismo patrón (service + controller + module + dto),
y cada pantalla del frontend sigue el mismo patrón de formulario + tabla + alta/baja.

## Qué falta por construir (siguiente paso natural)

- Pantalla de detalle de alumno (para ver su historial de cintas, pagos y conversaciones juntos)
- Pantalla de eventos de cambio de cinta en el frontend (el backend ya existe)
- Gestión de variantes de producto desde el frontend (el backend ya existe)
- Ventas y detalle de venta (conectar con inventario para descontar stock automático)
- Registros de comportamiento (tabla ya existe en el esquema, falta exponerla en un módulo)


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
