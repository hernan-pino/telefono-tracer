# Telefono Tracer

App web para el **control de inventario y trazabilidad de samples de exhibición de telefonía** — los celulares de muestra que se exhiben en tiendas y se transfieren entre sucursales.

Está pensada como **PWA mobile-first**: los usuarios (merchandisers / supervisores) la usan desde el celular, escaneando el IMEI o código de barras del equipo con la cámara para darlo de alta, buscarlo, o iniciar una transferencia entre tiendas.

## Funcionalidades

- **Login** por rol (`MERCHANDISER` / `SUPERVISOR`).
- **Samples**: alta de equipos (marca, modelo, color, IMEI, serial), detalle, búsqueda por escaneo.
- **Transferencias entre tiendas**: solicitud, aprobación / rechazo con motivo, estado en tránsito.
- **Historial / auditoría** de cada sample (quién lo movió, cuándo, de qué tienda a cuál).
- **Gestión** de tiendas y usuarios.
- **Escáner de cámara** vía `@zxing` para IMEI y códigos de barras.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 14** (App Router) + **TypeScript** |
| UI | **Tailwind CSS**, navegación mobile con `BottomNav` |
| Auth | **NextAuth** (credenciales + bcrypt) |
| DB | **Prisma** sobre **SQLite** (archivo local `prisma/dev.db`) |
| Escáner | **@zxing/browser** + **@zxing/library** |
| PWA | `public/manifest.json` (instalable como app standalone) |

## Modelo de datos (`prisma/schema.prisma`)

- `Store` — tiendas / sucursales
- `User` — roles `MERCHANDISER` / `SUPERVISOR`, asociado a una tienda
- `Sample` — el celular (brand, model, color, serial, imei, status `ACTIVE / IN_TRANSIT / LOST / RETIRED`)
- `TransferRequest` — solicitud de movimiento entre tiendas, status `PENDING / APPROVED / REJECTED`
- `AuditEvent` — log de eventos por sample (creación, transferencia, etc.)

## Cómo correrlo en local

```bash
npm install
npm run db:generate     # genera el cliente Prisma
npm run db:migrate      # aplica migraciones a SQLite
npm run db:seed         # carga datos iniciales (opcional)
npm run dev             # arranca en http://localhost:3000
```

Scripts útiles:

- `npm run db:studio` — abre Prisma Studio para inspeccionar la DB.
- `npm run build` / `npm run start` — build y server de producción.

Variables de entorno (`.env` / `.env.local`):

- `DATABASE_URL` — ruta al SQLite (ej. `file:./dev.db`)
- `NEXTAUTH_SECRET` y `NEXTAUTH_URL` — requeridos por NextAuth

## Probar en el celular con ngrok

El escáner de cámara del navegador **requiere HTTPS**, así que no alcanza con abrir la IP local desde el celular. Para probar en un teléfono real durante desarrollo se usa **ngrok**, que expone el `next dev` con una URL pública HTTPS temporal:

```bash
# Terminal 1
npm run dev              # http://localhost:3000

# Terminal 2
ngrok http 3000          # devuelve una URL https://xxxx.ngrok-free.app
```

Abrís esa URL `https://...ngrok-free.app` en el navegador del celular y la app funciona como si estuviera publicada, con permiso de cámara incluido. Al cerrar `ngrok` la URL deja de existir — es solo para pruebas.

> Nota: cada vez que se reinicia ngrok cambia el subdominio (salvo que se use un dominio reservado de la cuenta). Si NextAuth da error de callback URL, hay que actualizar `NEXTAUTH_URL` en `.env.local` con la URL actual de ngrok y reiniciar `npm run dev`.

## Estructura del código

```
src/
├── app/
│   ├── (auth)/login/        # pantalla de login
│   ├── (app)/               # rutas autenticadas
│   │   ├── dashboard/
│   │   ├── samples/         # listado, alta, detalle
│   │   ├── transfers/       # solicitudes y resolución
│   │   ├── stores/
│   │   ├── users/
│   │   └── historial/
│   └── api/                 # endpoints (auth, samples, transfers)
├── components/              # BarcodeScanner, ScanToFind, AuditTimeline, BottomNav, ...
├── lib/                     # auth.ts, prisma.ts
└── middleware.ts            # protección de rutas
```
