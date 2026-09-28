# Cómo se trabaja en este repositorio

> Documento dirigido a quien estudia este proyecto. Explica el método: por qué la documentación
> existe antes que el código, cómo se organizan los commits y cómo se trabaja con un agente de
> inteligencia artificial sin perder el control del proyecto.

---

## 1. Primero se documenta, después se programa

El primer commit de este repositorio no contiene código. Contiene la visión del sistema, sus
requisitos, su arquitectura, las reglas de seguridad y los permisos del agente. La razón es
práctica: **un agente de IA, igual que un integrante nuevo del equipo, produce lo que se le
describe**. Sin una descripción escrita, cada sesión parte de cero y cada decisión se vuelve a
discutir.

| Documento | Pregunta que responde |
|-----------|-----------------------|
| [`CLAUDE.md`](../CLAUDE.md) | Qué se construye, con qué y bajo qué reglas |
| [`project_spec.md`](project_spec.md) | Qué debe hacer el sistema, con sus reglas de negocio |
| [`architecture.md`](architecture.md) | Cómo está organizado por dentro y por qué |
| [`authentication.md`](authentication.md) | Quién puede hacer qué |
| [`agent_permissions.json`](agent_permissions.json) | Qué puede hacer el agente sin preguntar, qué debe consultar y qué tiene prohibido |
| [`project_status.md`](project_status.md) | Dónde quedó el trabajo y qué sigue |
| [`changelog.md`](changelog.md) | Qué cambió, cuándo y en qué commit |

La documentación **no se escribe una vez**: se corrige cada vez que una decisión cambia. Un
documento desactualizado es peor que uno inexistente, porque se le cree.

---

## 2. El trabajo con el agente de IA

`CLAUDE.md` es el documento que el agente lee al comenzar cada sesión. Contiene lo mismo que se
le explicaría a una persona que se incorpora al proyecto: el problema, el stack, las convenciones,
lo que nunca debe hacer y dónde buscar el detalle.

El agente trabaja bajo tres condiciones:

1. **Reglas escritas, no recordadas.** Si una regla no está en un documento, no existe.
2. **Límites explícitos.** `agent_permissions.json` separa lo que hace solo —probar, hacer commit—
   de lo que requiere confirmación —publicar, crear el repositorio— y de lo prohibido —saltarse
   una verificación, reescribir el historial.
3. **Revisión humana.** El docente revisa, decide y es responsable del resultado. El agente propone
   y ejecuta; no decide qué se publica.

Es el mismo criterio que exigen las guías de la asignatura: **la herramienta de IA se usa, pero su
resultado se comprende, se valida y se justifica**.

---

## 3. Commits pequeños y legibles

Cada commit hace **una sola cosa**, y su título la declara:

```
tipo(scope): descripción
```

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| `feat` | Funcionalidad nueva | `feat(empleados): cifrar dirección, teléfono y salario` |
| `fix` | Corrección de un error | `fix(registros): impedir horas en fechas futuras` |
| `test` | Pruebas | `test(api): verificar permisos de los tres roles` |
| `refactor` | Cambio interno sin cambiar el comportamiento | `refactor(reportes): extraer la clase base Exportador` |
| `docs` | Documentación | `docs(arquitectura): justificar el campo cifrado` |
| `chore` | Mantenimiento | `chore(deps): actualizar Django a 5.2.7` |
| `security` | Mejora de seguridad | `security(auth): limitar intentos de inicio de sesión` |

**Por qué pequeños.** Un commit que agrega un modelo, su vista, sus estilos y corrige un error de
otra parte no se puede revisar, no se puede revertir sin perder lo demás y no explica nada. Cinco
commits pequeños cuentan la historia del cambio.

El historial se lee así:

```bash
git log --oneline            # la historia en una línea por commit
git show <hash>              # qué cambió exactamente en un commit
```

---

## 4. El changelog con identificador de commit

Cada cambio relevante se registra en [`changelog.md`](changelog.md) junto al identificador corto
de su commit:

```markdown
- `[a1b2c3d]` feat(empleados): cifrar dirección, teléfono y salario
```

Con ese identificador, cualquiera puede ir del registro al código exacto que introdujo el cambio.
Es **trazabilidad**: la misma que el caso EcoTech exige para las horas trabajadas, aplicada al
propio desarrollo.

---

## 5. Sesiones que se pueden retomar

Todo trabajo se interrumpe. El método asegura que se pueda retomar sin reconstruir el contexto de
memoria:

| Al comenzar | Al terminar |
|-------------|-------------|
| Leer [`project_status.md`](project_status.md) | Dejar el código funcionando, nunca a medias |
| Revisar los últimos commits | Registrar los commits en el changelog |
| Continuar desde el último punto de control | Actualizar el estado del proyecto |

---

## 6. Seguridad desde el primer commit

El repositorio es público y el sistema corre en un servidor real. Las reglas de
[`seguridad_publicacion.md`](seguridad_publicacion.md) se aplican desde el primer commit, con
verificaciones automáticas que rechazan un commit si contiene credenciales o datos del servidor.
La seguridad que se agrega al final siempre llega tarde.

---

## 7. Cómo recorrer este repositorio

1. Leer `README.md` y `CLAUDE.md`.
2. Recorrer `git log --oneline` desde el primer commit: la historia está en orden.
3. Elegir un commit de funcionalidad y abrirlo con `git show`: ver qué archivos tocó y por qué.
4. Contrastar ese commit con su entrada en `changelog.md` y con el hito de `project_status.md`.
5. Buscar en el código cada concepto de la tabla «Relación con la asignatura» del `README.md`.

---

*Prof. Rubén Schnettler · INACAP Valparaíso · 2026*
