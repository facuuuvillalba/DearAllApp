# ComApp - Red Social Empresarial

```
database/   schema.sql + seed.sql (PostgreSQL)
backend/    API Node.js + Express (JWT, bcrypt, RBAC)
admin-web/  Panel Next.js + Tailwind (usuarios y canales)
mobile/     App Expo Router + TypeScript (empleados, EAS Update)
```

## 1. Base de datos
```bash
createdb comapp
psql postgresql://postgres:postgres@localhost:5432/comapp -f database/schema.sql
psql postgresql://postgres:postgres@localhost:5432/comapp -f database/seed.sql
```

## 2. Backend (puerto 4000)
```bash
cd backend
cp .env.example .env     # ajustar DATABASE_URL y JWT_SECRET
npm install
npm run seed:admin       # crea el primer Admin (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev
```

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/login` | público (rate limit 10/15 min) |
| GET | `/api/auth/me` | autenticado |
| POST | `/api/admin/users` | Admin (registra `audit_logs`) |
| GET/PATCH | `/api/admin/users[/:id]`, `GET /api/admin/roles`, `POST /api/admin/groups` | Admin |
| GET | `/api/groups` | grupos autorizados al usuario, con `canWrite` |
| GET | `/api/messages/:groupId?limit&before&after` | miembros del grupo |
| POST | `/api/messages` | miembros; en canales `is_announcement_only` solo RRHH/Admin |

Reglas de acceso: un grupo con `target_role_id = NULL` es global; con rol, solo ese rol (Admin ve todo).
`user_groups` se sincroniza automáticamente al crear usuarios, cambiar su rol o crear grupos.

## 3. Panel web (puerto 3000)
```bash
cd admin-web
cp .env.example .env.local
npm install
npm run dev
```

## 4. App móvil
```bash
cd mobile
cp .env.example .env     # EXPO_PUBLIC_API_URL (10.0.2.2 en emulador Android; IP LAN en dispositivo físico)
npm install
npx expo install --fix   # alinea versiones con tu SDK de Expo
npx expo start
```

### OTA con EAS Update
```bash
npm i -g eas-cli && eas login
eas init                 # completa updates.url con tu project ID en app.json
eas build --profile production --platform all
eas update --channel production --message "Descripción del cambio"
```
`runtimeVersion` usa la política `appVersion`: los updates OTA solo llegan a binarios con la misma versión.
