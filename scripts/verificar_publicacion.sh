#!/usr/bin/env bash
#
# verificar_publicacion.sh — ecotech_demo
#
# Revisa lo que está en el área de preparación (git add) antes de cada commit
# y lo rechaza si contiene algo que no debe llegar a un repositorio público:
# claves privadas, contraseñas escritas en el código, rutas de la máquina de
# desarrollo o datos del servidor.
#
# Se ejecuta solo, desde .githooks/pre-commit. También se puede correr a mano:
#   bash scripts/verificar_publicacion.sh           # revisa lo preparado
#   bash scripts/verificar_publicacion.sh --todo    # revisa todo el repositorio
#
# Los patrones genéricos están aquí. Los propios del servidor (dirección,
# usuario, nombre del equipo) se leen de privado/patrones_prohibidos.txt, que
# no se versiona: publicar la lista de lo que se oculta sería publicarlo.
#
set -euo pipefail

RAIZ="$(git rev-parse --show-toplevel)"
PRIVADOS="${RAIZ}/privado/patrones_prohibidos.txt"

# Patrones genéricos: expresiones regulares extendidas (grep -E).
GENERICOS=(
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'        # claves privadas SSH o TLS
  'AKIA[0-9A-Z]{16}'                          # claves de acceso de AWS
  'ghp_[A-Za-z0-9]{36}'                       # tokens personales de GitHub
  '/Users/[a-z]+/'                            # rutas de la máquina de desarrollo
  '/home/[a-z]+/'                             # rutas de un servidor
  'ssh-(ed25519|rsa) AAAA'                    # claves públicas de acceso
  '(PASSWORD|SECRET_KEY|ENCRYPTION_KEY)=[^<$ ][^ ]{11,}'   # valores reales en .env copiados a otro archivo
  'django-insecure-'                          # la clave que genera startproject
  "SECRET_KEY *= *[\"'][^\"']{20,}"            # una clave escrita como texto en settings.py
)

if [[ "${1:-}" == "--todo" ]]; then
  ARCHIVOS=$(git -C "$RAIZ" ls-files)
else
  ARCHIVOS=$(git -C "$RAIZ" diff --cached --name-only --diff-filter=ACM)
fi

[[ -z "$ARCHIVOS" ]] && exit 0

PATRONES=("${GENERICOS[@]}")
if [[ -f "$PRIVADOS" ]]; then
  while IFS= read -r linea; do
    [[ -z "$linea" || "$linea" == \#* ]] && continue
    PATRONES+=("$linea")
  done < "$PRIVADOS"
else
  echo "⚠ No existe privado/patrones_prohibidos.txt: solo se revisan los patrones genéricos."
fi

# Este mismo script contiene los patrones como texto: se excluye de la revisión.
PROPIO="scripts/verificar_publicacion.sh"
HALLAZGOS=0

while IFS= read -r archivo; do
  [[ "$archivo" == "$PROPIO" ]] && continue
  [[ -f "${RAIZ}/${archivo}" ]] || continue
  for patron in "${PATRONES[@]}"; do
    if [[ "${1:-}" == "--todo" ]]; then
      coincidencias=$(grep -nE -e "$patron" "${RAIZ}/${archivo}" 2>/dev/null || true)
    else
      coincidencias=$(git -C "$RAIZ" show ":${archivo}" 2>/dev/null | grep -nE -e "$patron" || true)
    fi
    if [[ -n "$coincidencias" ]]; then
      echo "✗ ${archivo}: coincide con un patrón prohibido"
      echo "$coincidencias" | sed 's/^/    línea /' | cut -c1-120
      HALLAZGOS=$((HALLAZGOS + 1))
    fi
  done
done <<< "$ARCHIVOS"

if (( HALLAZGOS > 0 )); then
  echo
  echo "✗ Commit rechazado: ${HALLAZGOS} coincidencia(s). Este repositorio es público."
  echo "  Mueva el dato a privado/ o a un .env y vuelva a preparar el archivo."
  exit 1
fi

echo "✓ Verificación de publicación: sin datos sensibles."
