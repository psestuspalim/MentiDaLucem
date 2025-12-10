# Guía de Despliegue en Vercel

Esta aplicación está optimizada para ser desplegada en **Vercel**, la plataforma recomendada para aplicaciones React/Vite.

## 1. Requisitos Previos

*   Tener una cuenta en [Vercel](https://vercel.com/signup).
*   Tener el código subido a un repositorio de **GitHub** (recomendado) o GitLab/Bitbucket.

## 2. Despliegue Automático (Recomendado)

1.  Ve a tu Dashboard de Vercel.
2.  Haz clic en **"Add New..."** -> **"Project"**.
3.  Selecciona tu repositorio de GitHub (`porfavor`).
4.  Configura el proyecto:
    *   **Framework Preset**: Vite (se detectará automáticamente).
    *   **Root Directory**: `./` (o déjalo en blanco si está en la raíz).
    *   **Environment Variables**:
        *   Si usas variables de entorno (como `VITE_API_KEY`), añádelas aquí.
        *   Para este proyecto mock, no necesitas variables críticas por ahora.
5.  Haz clic en **"Deploy"**.

¡Listo! Vercel construirá tu aplicación y te dará una URL (ej: `tu-proyecto.vercel.app`).

## 3. Control de Acceso ("Usuarios que yo decida")

Si quieres que la aplicación sea privada o solo accesible para ciertas personas, tienes varias opciones:

### Opción A: Vercel Deployment Protection (Fácil)
*   *Requiere Plan Pro ($20/mes) o Vercel Authentication.*
*   En Vercel: Settings -> Deployment Protection -> **Password Protection**.
*   Simplemente pon una contraseña y compártela solo con tus usuarios.

### Opción B: Autenticación en la App (Gratis)
*   La aplicación ya cuenta con una simulación de autenticación (`base44`).
*   Actualmente, cualquiera puede entrar si `requiresAuth` está en `false`.
*   Para restringirlo:
    1.  Edita `src/api/base44Client.js`.
    2.  Cambia `requiresAuth = true`.
    3.  Define los usuarios permitidos en el código o conecta un backend real.

### Opción C: Despliegue Manual (Local)
Si solo quieres que usuarios en tu red local accedan:
1.  Ejecuta `npm run host` (o `vite --host`).
2.  Comparte tu IP local (ej: `http://192.168.1.5:5173`) con los dispositivos conectados a tu WiFi.

## 4. Notas Importantes
*   **Base de Datos**: Actualmente la app usa datos simulados (Mock). Si refrescas la página en un despliegue online, el progreso se perderá a menos que implementes una base de datos real (Firebase/Supabase) o uses `localStorage` (ya implementado parcialmente).
