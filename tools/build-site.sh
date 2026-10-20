#!/usr/bin/env bash
# Builds the static site into _site/ (same script for GitHub Pages and local preview).
# Lesson pages and game/ are written as page bodies (no doctype/head), so wrap them here.
# Usage: bash tools/build-site.sh [output-dir]
set -euo pipefail
cd "$(dirname "$0")/.."

out="${1:-_site}"
rm -rf "$out"
mkdir -p "$out"
cp site/index.html "$out/index.html"
[ -d shared ] && cp -r shared "$out/shared"

for dir in lesson-*/ game/; do
  name="${dir%/}"
  [ -f "$name/index.html" ] || continue
  mkdir -p "$out/$name"
  {
    printf '%s\n' '<!doctype html>' '<html lang="uk">' '<head>' \
      '<meta charset="utf-8">' \
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    cat "$name/index.html"
  } > "$out/$name/index.html"
done
