# Seguridad de un repositorio público

> Este repositorio es público y el sistema que contiene está desplegado en un servidor real que
> aloja otros sitios. Este documento establece qué no se publica nunca, por qué, y cómo se
> verifica de forma automática antes de cada commit.

---

## 1. El principio

**Un repositorio público se escribe suponiendo que lo leerá quien quiera atacar el servidor.**
El código puede ser público sin riesgo; las credenciales y la descripción de cómo se entra al
servidor, no.

Borrar un dato sensible en un commit posterior **no lo elimina**: queda en el historial y
cualquiera puede recuperarlo. Por eso la verificación ocurre **antes** del commit, no después.

---

## 2. Lo que nunca se publica

| Categoría | Ejemplos | Dónde vive en su lugar |
|-----------|----------|------------------------|
| Credenciales | Contraseñas, `SECRET_KEY`, clave de cifrado, tokens | `.env` de cada entorno |
| Acceso al servidor | Dirección, usuario, puerto, nombres de claves SSH | Secretos de GitHub y carpeta privada |
| Rutas del servidor y de la máquina | Carpetas de instalación, directorios personales | Guía operativa privada |
| Configuración del servidor | Archivos de Nginx, unidad systemd, script de deploy | Carpeta privada |
| Documentos institucionales | Guías y rúbricas originales del caso | Se resumen con palabras propias |
| Datos personales | Nombres, RUT o correos de personas reales | Solo datos ficticios de demostración |

---

## 3. La separación en carpetas

```
ecotech_demo/
├── (todo lo versionado)     ← público
├── privado/                 ← nunca en git: guía de deploy real, credenciales, configuración del servidor
├── proyecto_generico/       ← nunca en git: kit de trabajo con el inventario del servidor
└── assets/                  ← nunca en git: documentos institucionales del caso
```

Las tres carpetas están en `.gitignore`. Un archivo que por error se prepare dentro de ellas no
llega al repositorio.

---

## 4. Las barreras automáticas

| Barrera | Cuándo actúa | Qué hace |
|---------|--------------|----------|
| `.gitignore` | Al preparar archivos | Excluye `.env`, carpetas privadas, claves y bases locales |
| Hook `pre-commit` | Antes de cada commit | Ejecuta `scripts/verificar_publicacion.sh`: busca claves privadas, tokens, contraseñas con valor, rutas personales y datos del servidor. **Si encuentra algo, rechaza el commit** |
| Hook `commit-msg` | Antes de cada commit | Exige el formato `tipo(scope): descripción` y un título de 72 caracteres como máximo |
| Secretos de GitHub | En la CI | El workflow de deploy no contiene dirección ni usuario: los recibe como secretos |

Los patrones propios del servidor —su dirección, su usuario— se leen desde un archivo de la
carpeta privada. Publicar la lista de lo que se oculta sería publicarlo.

### Activación de los hooks

Git no activa los hooks de un repositorio clonado por seguridad. Se activan una vez:

```bash
git config core.hooksPath .githooks
```

### Revisión completa a mano

```bash
bash scripts/verificar_publicacion.sh --todo
```

---

## 5. Lista de verificación antes de hacer público un cambio

- [ ] `git status` no muestra ningún `.env` ni nada dentro de `privado/`
- [ ] `git diff --cached` revisado línea por línea
- [ ] El hook `pre-commit` terminó con «sin datos sensibles»
- [ ] El mensaje del commit no menciona datos del servidor
- [ ] Los datos de ejemplo son ficticios

---

## 6. Si un secreto llega al repositorio

1. **Se da por comprometido.** No basta con borrarlo: ya está en el historial y posiblemente en
   copias ajenas.
2. **Se revoca y se reemplaza de inmediato**: nueva contraseña, nueva clave, nuevo token.
3. Recién después se evalúa limpiar el historial. Limpiarlo sin rotar el secreto no protege nada.

---

*Última actualización: 2026-09-28*
