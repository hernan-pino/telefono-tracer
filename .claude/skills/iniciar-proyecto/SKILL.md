---
name: iniciar-proyecto
description: Levanta el proyecto Telefono Tracer en modo demo — arranca el dev server de Next.js y un túnel HTTPS de ngrok, configura NEXTAUTH_URL automáticamente y muestra la URL pública para abrir en el celular. Usar cuando el usuario quiera mostrar la app a alguien más, hacer una demo en celular, o levantar todo el entorno de prueba con un solo comando.
---

# Iniciar proyecto (modo demo)

Tu objetivo: dejar la app Telefono Tracer corriendo y accesible desde cualquier celular vía una URL HTTPS pública, lista para mostrarla a alguien.

## Pasos (ejecutalos en orden)

### 1. Limpiar estado previo

Matá cualquier proceso `node` que pueda estar ocupando los puertos 3000/3001 — es muy común que queden huérfanos en Windows después de cerrar terminales mal.

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Y si tenés tareas previas registradas en el harness (de invocaciones anteriores a esta skill), pará las que sigan vivas con `TaskStop`.

### 2. Verificar que ngrok esté disponible

Primero probá si `ngrok` está en el PATH:

```powershell
Get-Command ngrok -ErrorAction SilentlyContinue | Select-Object Source
```

Si no aparece, usá la ruta absoluta del binario instalado por winget:
`C:\Users\herna\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe`

(Si esa ruta tampoco existe, ngrok no está instalado — avisale al usuario que corra `winget install Ngrok.Ngrok` y se detenga la skill.)

### 3. Arrancar ngrok en background

```powershell
& "<ruta_ngrok>" http 3000 --log=stdout --log-format=logfmt
```

Corré esto con `run_in_background: true`.

### 4. Obtener la URL pública del túnel

Esperá unos segundos a que ngrok inicie, después consultá su API local:

```powershell
try { (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels").tunnels[0].public_url } catch { "" }
```

Si la primera consulta falla porque ngrok todavía está arrancando, reintentalo una o dos veces con pequeñas esperas. Si después de tres intentos no devuelve URL, leé el archivo de output del task de ngrok para diagnosticar (errores típicos: agente desactualizado → `ngrok update`; sin authtoken; ya hay otro ngrok corriendo).

### 5. Actualizar `NEXTAUTH_URL` en `.env.local`

Editá [.env.local](.env.local) reemplazando el valor actual de `NEXTAUTH_URL` por la URL que devolvió ngrok. Es **crítico** — si no se hace, el login va a fallar con error de callback cuando se acceda desde el celular.

> **No toques `DATABASE_URL`**. Debe quedar como `file:C:/Users/herna/OneDrive/Escritorio/proyectos claude/telofonoTraser/prisma/dev.db` (path absoluto con espacio literal — Prisma no acepta `%20` ni rutas relativas en este proyecto por como están las cosas).

### 6. Arrancar el dev server

```bash
cd "c:/Users/herna/OneDrive/Escritorio/proyectos claude/telofonoTraser" && npm run dev
```

Con `run_in_background: true`.

### 7. Verificar que todo esté arriba

- Local: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000` → esperás `307` (redirect al login).
- Túnel: `curl -s -o /dev/null -w "%{http_code}\n" -H "ngrok-skip-browser-warning: 1" <URL_NGROK>` → esperás `307`.

Si el local devuelve algo distinto a 307, leé el output del task de `npm run dev` para ver si compiló bien.

### 8. Reportar al usuario

Mostrale al usuario un mensaje claro y corto, tipo:

```
✓ Listo. La app está corriendo en:

  https://xxxx-yy-zz.ngrok-free.dev

Abrila en el celular. La primera vez ngrok muestra una pantalla de aviso
("Visit Site"). Después vas al login, tocás un usuario del panel dev y entrás.

Cuando termines la demo, pedime "para el proyecto" y mato todo.
```

Incluí también, en una sección colapsable o al pie:
- Que la URL **cambia cada reinicio de ngrok** (a menos que tengan dominio reservado).
- Que los IDs de las tareas en background son `<id_dev_server>` y `<id_ngrok>`, por si quieren pararlos manualmente.

## Errores comunes y cómo manejarlos

- **`Port 3000 is in use`** en el log de `npm run dev`: hay un node huérfano. Volvé al paso 1 y matá todos los `node`, después relanzá `npm run dev`.
- **Login devuelve "Email o contraseña incorrectos"** desde el celular: probablemente `DATABASE_URL` quedó mal o el `.next/` cache se corrompió. Verificá la URL absoluta exacta del paso 5; si está bien, parar todo, borrar `.next/`, y volver a iniciar.
- **Estilos rotos / página sin formato** en el celular: clásico de `.next/` cache corrupto cuando hubo dos dev servers compitiendo por el mismo puerto. Parar todo, `Remove-Item -Recurse -Force .next`, y reiniciar.
- **`ERR_NGROK_121`** (versión del agente muy vieja): corré `<ruta_ngrok> update` y volvé a arrancar.

## Lo que NO tenés que hacer

- **No commitees** los cambios de `NEXTAUTH_URL` — son temporales para la demo.
- **No corras `npm install`** ni `npm run db:migrate` "por las dudas" — son innecesarios y agregan tiempo a la demo. Las dependencias y la DB ya están listas.
- **No expongas el authtoken de ngrok** en mensajes al usuario. Ya está guardado en `%USERPROFILE%\AppData\Local\ngrok\ngrok.yml`.
