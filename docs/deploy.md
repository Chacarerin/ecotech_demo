# EcoTech Solutions — Cómo se publica

> **Documento público.** Explica el método de despliegue para que se entienda y se pueda
> replicar. No contiene direcciones, usuarios, rutas ni claves del servidor: esos datos viven en
> una guía operativa privada, fuera del repositorio. Ver
> [`seguridad_publicacion.md`](seguridad_publicacion.md).

---

## 1. Resumen

```
git push origin main     →  la CI prueba, se conecta al servidor y ejecuta el script de deploy
                         →  el script actualiza, respalda, migra, compila y reinicia
                         →  la CI verifica que el sitio y la API respondan
```

Un solo camino para publicar, siempre el mismo. No hay pasos manuales en el día a día.

---

## 2. Ambientes

| Ambiente | Interfaz | API | Base de datos |
|----------|----------|-----|---------------|
| Local | `http://localhost:5173` | `http://localhost:8000` | PostgreSQL 14 local |
| Producción | `https://ecotech.antostudio.cl` | `https://ecotech-api.antostudio.cl` | PostgreSQL 14 del servidor, solo accesible desde el propio servidor |

El dominio es público por naturaleza —cualquiera lo consulta en el DNS—, así que se declara.
Lo que no se publica es cómo se administra el servidor que lo atiende.

No hay ambiente de pruebas intermedio: se valida en local y se publica. Para un proyecto de una
persona con un agente, un tercer ambiente cuesta más de lo que protege.

---

## 3. Arquitectura del despliegue

```
   Computador de desarrollo        GitHub                        Servidor (VPS)
          │                          │                                │
          │  git push origin main    │                                │
          ├─────────────────────────►│                                │
          │                          │  1. pruebas y verificación     │
          │                          │     de publicación             │
          │                          │  2. SSH con una clave que solo │
          │                          │     puede ejecutar el deploy   │
          │                          ├───────────────────────────────►│
          │                          │                                │  deploy.sh
          │                          │                                │   · un deploy a la vez
          │                          │                                │   · git pull --ff-only
          │                          │                                │   · respaldo de la base
          │                          │                                │   · migraciones
          │                          │                                │   · reinicio de gunicorn
          │                          │                                │   · build de la interfaz
          │                          │◄───────────────────────────────┤
          │                          │  3. curl a la interfaz y a     │
          │                          │     /api/health/               │
          │◄─────────────────────────┤                                │
          │   ✅ o ❌ en Actions      │                                │

   En el servidor:   Nginx ──► archivos estáticos de la interfaz
                     Nginx ──► socket local ──► gunicorn ──► Django ──► PostgreSQL
```

---

## 4. Decisiones y su porqué

| Decisión | Razón |
|----------|-------|
| **El script de deploy vive en el servidor**, no en la CI | La CI queda reducida a «conectarse y ejecutar». Cambiar el procedimiento no obliga a tocar el workflow |
| **El servidor hace `git pull`**, la CI no copia archivos | Lo publicado es siempre un commit identificable: `git log -1` en el servidor dice qué está en producción |
| **`git pull --ff-only`** | Nunca un merge automático en producción |
| **Respaldo de la base antes de migrar** | Revertir el código no revierte una migración destructiva; el respaldo sí |
| **La API se despliega antes que la interfaz** | Así nunca hay una interfaz nueva llamando a una API vieja |
| **gunicorn escucha en un socket local**, no en un puerto | El backend no es alcanzable sin pasar por Nginx, que pone HTTPS, límites y cabeceras |
| **La clave de la CI solo puede ejecutar el deploy** | Si se filtra, lo peor que permite es publicar este proyecto; no da acceso al servidor |
| **Host, usuario y clave como secretos de GitHub** | El repositorio es público: el workflow no expone dónde ni cómo se entra al servidor |
| **Los secretos de la aplicación viven solo en el servidor** | La CI no necesita conocerlos; hay un solo lugar donde cambiarlos |

---

## 5. Variables de entorno

La lista completa, con su propósito y dónde vive cada una, está en
[`variables_entorno.md`](variables_entorno.md). Ninguna variable secreta pasa por la CI.

---

## 6. Alta inicial

Se hace una sola vez y la ejecuta el docente, porque requiere privilegios en el servidor. En orden:

1. Verificación previa: que el dominio, la carpeta, la base y el socket no estén en uso por otro
   proyecto del servidor.
2. Base de datos y usuario propios del proyecto, con permisos solo sobre esa base.
3. Clave de despliegue de solo lectura para que el servidor pueda clonar el repositorio.
4. Entorno virtual con Python 3.11, dependencias, archivo `.env`, migraciones y estáticos.
5. Unidad systemd de gunicorn.
6. Configuración de Nginx para los dos subdominios, solo con HTTP; el certificado lo agrega
   Certbot después.
7. Certificados TLS.
8. Script de deploy y clave restringida de la CI.
9. Primer deploy y verificación.

---

## 7. Verificación después de cada deploy

- [ ] La interfaz responde 200
- [ ] `GET /api/health/` responde 200 con la base conectada
- [ ] Una ruta interna de la interfaz, recargada, no da 404
- [ ] El inicio de sesión funciona y la consola del navegador no muestra errores de CORS
- [ ] El admin de Django carga con estilos
- [ ] Un usuario con rol empleado no puede abrir `/empleados`

---

## 8. Rollback

| Qué falló | Cómo se revierte |
|-----------|------------------|
| La interfaz | El script guarda las diez últimas compilaciones; se restaura la anterior, sin reiniciar nada |
| La API, sin migraciones | Volver al commit anterior y reiniciar el servicio |
| La API, con migraciones | Revertir la migración si es reversible; si no, restaurar el respaldo que el script tomó antes de migrar |

> **Revertir el código no revierte la base.** Por eso el respaldo previo a cada migración no es
> opcional.

---

## 9. Problemas frecuentes de este stack

| Síntoma | Causa probable |
|---------|----------------|
| `blocked by CORS policy` en la consola | El dominio de la interfaz no está en `CORS_ALLOWED_ORIGINS` |
| Falla solo el inicio de sesión (POST) | Falta el origen en `CSRF_TRUSTED_ORIGINS` |
| La interfaz llama a `localhost:8000` en producción | `VITE_API_URL` no existía al momento del build |
| 502 después de un deploy | gunicorn no arrancó: error en el `.env` o en una migración |
| Los datos cifrados se leen como texto ilegible | `FIELD_ENCRYPTION_KEY` distinta de la que los cifró |
| Se hizo deploy y se ve la versión anterior | Faltó reiniciar gunicorn, o caché del navegador |

---

*Última actualización: 2026-09-28*
