#!/usr/bin/env python3
"""Builds the static site into _site/ (same script for GitHub Pages and local preview).

Lesson pages and game/ are written as page bodies (no doctype/head), so they are wrapped here;
shared/ is copied as is. Usage: python tools/build-site.py [output-dir]
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEAD = (
    "<!doctype html>\n"
    '<html lang="uk">\n'
    "<head>\n"
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
)


def build(out: Path) -> None:
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    shutil.copy(ROOT / "site" / "index.html", out / "index.html")
    if (ROOT / "shared").is_dir():
        shutil.copytree(ROOT / "shared", out / "shared")

    pages = sorted(p for p in ROOT.glob("lesson-*") if p.is_dir()) + [ROOT / "game"]
    for page in pages:
        src = page / "index.html"
        if not src.is_file():
            continue
        dest = out / page.name
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "index.html").write_bytes(HEAD.encode("utf-8") + src.read_bytes())


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_site"
    build(target)
    print("built", target)
