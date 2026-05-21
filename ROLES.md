# Roles y flujos

Este documento explica qué puede hacer cada rol en Telefono Tracer y cómo se desarrolla el flujo principal de la app (transferencia de un sample entre tiendas).

---

## 👤 SUPERVISOR — visión global

El supervisor es el rol administrativo. Ve y gestiona **todas** las tiendas, samples y transferencias del sistema.

### Permisos

| Acción | Dónde |
|---|---|
| **Ver todo** — todas las tiendas, samples y transferencias | toda la app |
| **Crear samples nuevos** (dar de alta un equipo) | `/samples/new` |
| **Marcar un sample como `LOST` o `RETIRED`** | detalle del sample → `PATCH /api/samples/[id]` |
| **Aprobar una transferencia** pendiente | `/transfers/[id]` → acción `APPROVE` |
| **Rechazar una transferencia** (con motivo) | `/transfers/[id]` → acción `REJECT` |
| **Gestionar tiendas** | `/stores` |
| **Gestionar usuarios** | `/users` |
| **Ver auditoría completa** (historial global de movimientos) | `/historial` |

### Navegación inferior

`🏠 Inicio` · `📱 Samples` · `🔄 Traslados` · `📋 Historial` · `🚪 Salir`

---

## 🧑‍💼 MERCHANDISER — operador de una tienda

El merchandiser está asignado a **una** tienda (`storeId`). Solo opera con lo que pertenece a su tienda.

### Permisos

| Acción | Dónde |
|---|---|
| **Ver los samples de su tienda** (filtro automático por `storeId`) | `/samples` |
| **Buscar / escanear un sample** (IMEI o código de barras) | botón de escaneo en `/samples` |
| **Solicitar una transferencia** de un sample suyo hacia otra tienda | `/transfers/new` → `POST /api/transfers` |
| **Recibir un sample entrante** (confirmar llegada física) | `/transfers/[id]` → acción `RECEIVE` |

> La recepción solo está permitida si:
> - El merchandiser pertenece a la **tienda destino** del traslado, **y**
> - El traslado está en estado `APPROVED` (ya pasó por el supervisor).

### Lo que NO puede hacer

- Crear samples nuevos.
- Cambiar el estado de un sample (no puede marcarlo como perdido ni retirado).
- Aprobar ni rechazar transferencias (solo las solicita).
- Entrar a `/stores`, `/users` ni `/historial` — el sistema lo redirige a `/dashboard`.
- Ver samples ni traslados de otras tiendas.

### Navegación inferior

`🏠 Inicio` · `📱 Mis Samples` · `🔄 Traslados` · `🚪 Salir`

---

## 🔄 Flujo típico: transferencia de un sample

Este es el flujo principal de la app y es donde se ven los dos roles colaborando.

```
┌──────────────────────────┐
│ Tienda A                 │
│ Sample "Vivo Y17s Negro" │  estado: ACTIVE
│ IMEI 351234560000001     │
└────────────┬─────────────┘
             │
   1. Merchandiser A escanea el sample y
      solicita moverlo a Tienda B
             ▼
┌──────────────────────────┐
│ TransferRequest          │  estado: PENDING
│ from: Tienda A           │
│ to:   Tienda B           │
│ by:   Ana (Merch Centro) │
└────────────┬─────────────┘
             │
   2. Supervisor revisa y decide
             ▼
        ┌────┴─────┐
        │          │
     APPROVE    REJECT
        │          │
        ▼          ▼
┌─────────────┐  ┌──────────────────────────────┐
│ Sample:     │  │ TransferRequest: REJECTED    │
│ IN_TRANSIT  │  │ rejectionReason: "..."       │
└──────┬──────┘  │ Sample vuelve a ACTIVE       │
       │         │ en Tienda A                  │
       │         └──────────────────────────────┘
   3. Merchandiser B ve el traslado entrante,
      escanea el sample al recibirlo
       │
       ▼
┌──────────────────────────┐
│ Tienda B                 │
│ Sample "Vivo Y17s Negro" │  estado: ACTIVE
│ currentStoreId: B        │
└──────────────────────────┘
```

### Paso a paso

1. **Solicitud** — *Merchandiser de Tienda A* escanea o elige un sample que está en su tienda, abre **"Nuevo traslado"** y selecciona Tienda B como destino. Se crea un `TransferRequest` en estado `PENDING`. El sample sigue en estado `ACTIVE` mientras tanto.

2. **Aprobación** — *Supervisor* abre `/transfers`, ve la solicitud pendiente y tiene dos opciones:
   - **APROBAR**: el sample pasa a `IN_TRANSIT`, el `TransferRequest` queda `APPROVED`.
   - **RECHAZAR** (con motivo): el `TransferRequest` queda `REJECTED` con `rejectionReason`, el sample sigue como `ACTIVE` en Tienda A.

3. **Recepción** — *Merchandiser de Tienda B* ve el traslado entrante en su lista, escanea físicamente el equipo cuando llega y confirma la recepción. El sample queda `ACTIVE` con `currentStoreId = Tienda B`.

4. **Auditoría** — Cada paso (creación, aprobación/rechazo, recepción, cambio de estado) genera un `AuditEvent` que el *Supervisor* puede consultar en `/historial`. Cada sample también tiene su propia línea de tiempo de eventos en su pantalla de detalle.

---

## Resumen rápido

| | SUPERVISOR | MERCHANDISER |
|---|:---:|:---:|
| Ver todas las tiendas | ✅ | ❌ (solo la suya) |
| Crear sample | ✅ | ❌ |
| Marcar sample LOST / RETIRED | ✅ | ❌ |
| Solicitar transferencia | ❌ | ✅ |
| Aprobar transferencia | ✅ | ❌ |
| Rechazar transferencia | ✅ | ❌ |
| Recibir transferencia | ❌ | ✅ (solo si es la tienda destino) |
| Gestionar tiendas / usuarios | ✅ | ❌ |
| Ver historial / auditoría | ✅ | ❌ |
