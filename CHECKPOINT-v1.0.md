# rmora-website — Checkpoint v1.0
**Fecha:** 2026-03-24
**Estado:** En producción — https://rmora.org

---

## Resumen del proyecto

Sitio web personal-profesional de Ronald Mora-Barboza (ronald@rmora.org).
Incluye portafolio académico, publicaciones, proyectos, sistema de reuniones
con Google Calendar/Meet, formulario de contacto y panel de administración completo.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 3, shadcn/ui |
| Routing | wouter v3 |
| Estado servidor | tRPC v11 + React Query |
| Backend | Express.js + TypeScript |
| ORM | Drizzle ORM |
| Base de datos | MySQL |
| Auth | Google OAuth 2.0 + JWT httpOnly cookie |
| Email | Resend (ronald@rmora.org) |
| Calendario | Google Calendar API + Meet auto-generado |
| Deploy | PM2 + Nginx + CloudPanel (Ubuntu 24.04) |

---

## Páginas públicas

| Ruta | Descripción |
|---|---|
| `/` | Hero, servicios destacados, publicaciones recientes, testimonios, CTA |
| `/about` | Presentación, filosofía, enfoque actual, CV descargable |
| `/services` | Áreas de consultoría, conferencias, asesoría |
| `/projects` | Proyectos y recursos descargables (dinámico desde BD) |
| `/publications` | Publicaciones con filtro y ordenamiento (dinámico desde BD) |
| `/contact` | Tabs: enviar mensaje / solicitar reunión con slots disponibles |

## Panel administrativo

| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard con estadísticas |
| `/admin/meetings` | Gestión de reuniones agendadas |
| `/admin/messages` | Mensajes de contacto recibidos |
| `/admin/availability` | Bloqueos de disponibilidad |
| `/admin/publications` | CRUD publicaciones |
| `/admin/resources` | CRUD proyectos/recursos |
| `/admin/testimonials` | CRUD testimonios del carrusel |

---

## Base de datos

**Dev:** `mysql://rmora_user@192.168.0.11:9306/rmora_website`
**Prod:** `mysql://romora@localhost:3306/website`

### Tablas
- `admins` — administrador único
- `users` — usuarios OAuth
- `publications` — artículos, blogs, ponencias
- `meetings` — reuniones (integradas con Google Calendar)
- `contact_messages` — mensajes de contacto
- `availability_blocks` — bloqueos de disponibilidad (none/weekly/weekday/daily)
- `licenses` — catálogo de licencias open source (PK: code)
- `resources` — proyectos y recursos descargables
- `testimonials` — opiniones para carrusel en Hero

---

## Servicios externos

| Servicio | Uso | Estado |
|---|---|---|
| Google OAuth | Login admin | Producción ✅ |
| Google Calendar API | Crear/cancelar eventos + Meet links | Producción ✅ |
| Resend | Emails confirmación y notificación | Verificado ✅ |

---

## Infraestructura de producción

- **Servidor:** 89.116.51.101 (Hostinger VPS)
- **OS:** Ubuntu 24.04
- **Panel:** CloudPanel
- **Nginx:** 1.28 — sirve `client/dist/` estático, proxy `/api` y `/trpc` → port 3001
- **PM2:** proceso `rmora-website` (id 1)
- **App:** `/home/romora/htdocs/rmora.org/`
- **SSH:** puerto 47031, clave ed25519

---

## Deploy

```bash
# Desde máquina local
cd /home/romora/Desarrollo/claude/rmora-website
bash scripts/deploy.sh
```

Si el `.env` no existe en el servidor:
```bash
scp -P 47031 -i /home/romora/claves_VPS/id_ed25519_VPS \
  .env.production romora@89.116.51.101:/home/romora/htdocs/rmora.org/.env
```

---

## Scripts útiles

```bash
# Dev local
npm run dev

# Build producción
npm run build

# Renovar token Google Calendar (si falla con invalid_grant)
node scripts/get-refresh-token.mjs

# Schema inicial en BD producción (una sola vez)
mysql -u romora -p'Rmb+02359adm' website < scripts/schema.sql
```

---

## Archivos clave

| Archivo | Descripción |
|---|---|
| `client/src/data/` | Contenido estático (about, services, hero) |
| `client/src/pages/public/` | Páginas públicas |
| `client/src/pages/admin/` | Páginas del panel admin |
| `client/public/` | Imágenes, CV (CRMB2512MP.pdf) |
| `server/src/db/schema.ts` | Definición completa de tablas |
| `server/src/lib/availability.ts` | Lógica de slots disponibles |
| `server/src/services/googleCalendar.ts` | Integración Google Calendar |
| `server/src/services/resend.ts` | Templates y envío de emails |
| `scripts/schema.sql` | Schema + seed para BD de producción |
| `scripts/deploy.sh` | Script de deploy automatizado |
| `.env` | Variables dev |
| `.env.production` | Variables producción |
