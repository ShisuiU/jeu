#!/usr/bin/env python3
"""Intègre une illustration de héros (ou d'ennemi) dans le jeu.

Usage : python3 scripts/import-art.py <image.png> <id> [heroes|enemies]

Produit, en WebP optimisé :
  src/assets/<type>/<id>/full.webp      illustration complète (héros uniquement : fiche, accueil, dialogues)
  src/assets/<type>/<id>/portrait.webp  recadrage buste 3:4 (cartes, avatar, combat)
"""
import sys
from pathlib import Path
from PIL import Image

src, ident = sys.argv[1], sys.argv[2]
kind = sys.argv[3] if len(sys.argv) > 3 else 'heroes'
out = Path('src/assets') / kind / ident
out.mkdir(parents=True, exist_ok=True)
img = Image.open(src).convert('RGB')
w, h = img.size

if kind == 'heroes':  # les ennemis n'utilisent que le portrait
    full = img.copy()
    full.thumbnail((768, 1152), Image.LANCZOS)
    full.save(out / 'full.webp', 'WEBP', quality=80, method=6)

# Portrait : 80 % de la largeur, ratio 3:4, depuis le haut (tête dans le tiers supérieur).
cw = int(w * 0.8)
ch = int(cw * 4 / 3)
x0 = (w - cw) // 2
y0 = int(h * 0.02)
portrait = img.crop((x0, y0, x0 + cw, min(h, y0 + ch)))
portrait = portrait.resize((600, 800), Image.LANCZOS)
portrait.save(out / 'portrait.webp', 'WEBP', quality=80, method=6)

for f in sorted(out.iterdir()):
    print(f, f'{f.stat().st_size // 1024} Ko')
