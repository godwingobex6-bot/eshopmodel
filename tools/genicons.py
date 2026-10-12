#!/usr/bin/env python3
"""Génère les icônes PWA de NUANCE (monogramme N, style de la marque)."""
from PIL import Image, ImageDraw, ImageFont
import os

INK = (29, 26, 20, 255)          # #1D1A14
CREAM = (247, 244, 238, 255)     # #F7F4EE
ACCENT = (192, 90, 43, 255)      # #C05A2B
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icons')
os.makedirs(OUT, exist_ok=True)

FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
]
font_path = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)


def rounded_rect(d, box, radius, fill):
    d.rounded_rectangle(box, radius=radius, fill=fill)


def make_icon(size, maskable=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if maskable:
        # Plein cadre : iOS/Android appliquent eux-mêmes le masque.
        d.rectangle([0, 0, size, size], fill=INK)
    else:
        pad = size // 32
        rounded_rect(d, [pad, pad, size - pad, size - pad], radius=size * 0.22, fill=INK)

    d = ImageDraw.Draw(img)
    # Barre signature en bas de l'icône
    bar_w = size * 0.34
    bar_h = max(2.0, size * 0.018)
    d.rounded_rectangle(
        [(size - bar_w) / 2, size * 0.845, (size + bar_w) / 2, size * 0.845 + bar_h],
        radius=bar_h / 2, fill=ACCENT)
    letter_ratio = 0.52 if maskable else 0.58
    f = ImageFont.truetype(font_path, int(size * letter_ratio)) if font_path else ImageFont.load_default()
    text = 'N'
    bbox = d.textbbox((0, 0), text, font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1] - size * 0.01), text, font=f, fill=CREAM)

    # Point accent à droite de la lettre, signature de la marque
    dot_r = size * 0.035
    cx, cy = (size + w) / 2 + dot_r * 2.6, (size - h) / 2 + h * 0.16
    d.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=ACCENT)

    return img


for s in (192, 512):
    make_icon(s).save(os.path.join(OUT, f'icon-{s}.png'), optimize=True)
    make_icon(s, maskable=True).save(os.path.join(OUT, f'icon-maskable-{s}.png'), optimize=True)

make_icon(180, maskable=True).save(os.path.join(OUT, 'apple-touch-icon.png'), optimize=True)
print('Icônes générées dans', os.path.abspath(OUT))
