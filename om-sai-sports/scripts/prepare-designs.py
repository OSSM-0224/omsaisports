#!/usr/bin/env python3
"""Prepare jersey artwork for the website.

How to add designs:
  1. Drop front and back composite images into design-sources/incoming/.
     PNG, JPG and WEBP are supported. The file name becomes the design id.
  2. Run: python scripts/prepare-designs.py
  3. The script writes:
       - optimized WebP thumbnails to public/thumbnails/ (alpha preserved)
       - a front-only 3D texture to public/designs/textures/
       - a matching entry in public/designs/manifest.json

The original high resolution files stay in design-sources/ and never ship
to the browser. Existing designs with a curated 3D texture keep that texture.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is required. Install it with: python -m pip install Pillow")


ROOT = Path(__file__).resolve().parents[1]
SOURCE_FOLDERS = (
    ROOT / "design-sources" / "thumbnail-originals",
    ROOT / "design-sources" / "incoming",
)
THUMB_DIR = ROOT / "public" / "thumbnails"
TEXTURE_DIR = ROOT / "public" / "designs" / "textures"
MANIFEST_PATH = ROOT / "public" / "designs" / "manifest.json"
MAX_THUMB_WIDTH = 960
TEXTURE_SIZE = 1400
WEBP_QUALITY = 82
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}


def slugify(value: str) -> str:
    value = re.sub(r"\.[^.]+$", "", value)
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "design"


def title_from_slug(slug: str) -> str:
    """sahs1 -> SAHS 01, new-design-072 -> New Design 072."""
    words: list[str] = []
    for token in slug.split("-"):
        match = re.fullmatch(r"([a-z]+)(\d+)", token)
        if match:
            letters, digits = match.groups()
            label = letters.upper() if len(letters) <= 4 else letters.title()
            words.append(f"{label} {int(digits):02d}")
        elif token.isdigit():
            words.append(f"{int(token):02d}")
        elif len(token) <= 4:
            words.append(token.upper())
        else:
            words.append(token.title())
    return " ".join(words)


def infer_category(path: Path) -> str:
    parts = {part.lower() for part in path.parts}
    if "ganpati" in parts or "devi" in parts or "festival" in parts:
        return "festival"
    if "commercial" in parts:
        return "commercial"
    return "sports"


def collect_sources() -> list[Path]:
    found: list[Path] = []
    for folder in SOURCE_FOLDERS:
        if not folder.exists():
            continue
        found.extend(
            path for path in sorted(folder.iterdir())
            if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
        )
    return found


def save_transparent_webp(image: Image.Image, output: Path, quality: int) -> None:
    """Save an RGBA image as WebP, keeping transparent areas transparent.

    Fully transparent pixels get their RGB zeroed so no pale halo leaks into
    the dark jersey cards when the browser composites the cutout.
    """
    rgba = image.convert("RGBA")
    red, green, blue, alpha = rgba.split()
    black = Image.new("L", rgba.size, 0)
    clean_alpha = alpha.point(lambda value: 255 if value > 8 else 0)
    rgba = Image.merge(
        "RGBA",
        (
            Image.composite(red, black, clean_alpha),
            Image.composite(green, black, clean_alpha),
            Image.composite(blue, black, clean_alpha),
            clean_alpha,
        ),
    )
    rgba.save(output, "WEBP", quality=quality, method=6)


def make_3d_texture(source: Path, design_id: str) -> str:
    """Crop the front half of a front+back composite onto a square canvas."""
    TEXTURE_DIR.mkdir(parents=True, exist_ok=True)
    output = TEXTURE_DIR / f"{design_id}.webp"

    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGBA")
        width, height = image.size
        front = image.crop((0, 0, width // 2, height))

        opaque = front.getchannel("A").getbbox()
        if opaque:
            pad = 24
            padded = (
                max(0, opaque[0] - pad),
                max(0, opaque[1] - pad),
                min(front.width, opaque[2] + pad),
                min(front.height, opaque[3] + pad),
            )
            front = front.crop(padded)

        front.thumbnail((TEXTURE_SIZE, TEXTURE_SIZE), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (TEXTURE_SIZE, TEXTURE_SIZE), (0, 0, 0, 0))
        canvas.paste(
            front,
            ((TEXTURE_SIZE - front.width) // 2, (TEXTURE_SIZE - front.height) // 2),
        )
        save_transparent_webp(canvas, output, quality=86)

    return f"/designs/textures/{design_id}.webp"


def main() -> None:
    if not MANIFEST_PATH.exists():
        sys.exit(f"Missing manifest: {MANIFEST_PATH}")

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    designs = manifest.setdefault("designs", [])
    by_id = {design["id"]: design for design in designs}
    THUMB_DIR.mkdir(parents=True, exist_ok=True)

    added = 0
    updated_thumbs = 0
    added_textures = 0

    for source in collect_sources():
        design_id = slugify(source.name)
        thumb_path = THUMB_DIR / f"{design_id}.webp"
        thumb_url = f"/thumbnails/{design_id}.webp"

        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGBA")
            if image.width > MAX_THUMB_WIDTH:
                height = round(image.height * MAX_THUMB_WIDTH / image.width)
                image = image.resize((MAX_THUMB_WIDTH, height), Image.Resampling.LANCZOS)
            save_transparent_webp(image, thumb_path, quality=WEBP_QUALITY)

        design = by_id.get(design_id)
        if design:
            if design.get("thumb") != thumb_url:
                design["thumb"] = thumb_url
                updated_thumbs += 1
            if not design.get("image"):
                design["image"] = make_3d_texture(source, design_id)
                added_textures += 1
            continue

        texture_url = make_3d_texture(source, design_id)
        entry = {
            "id": design_id,
            "title": title_from_slug(design_id),
            "category": infer_category(source),
            "tag": "Jersey Design",
            "image": texture_url,
            "thumb": thumb_url,
            "accent": "#ff5a00",
            "madeFor": "Custom",
            "seasonYear": str(datetime.now().year),
            "jerseyNumber": f"{len(designs) + 1:02d}",
            "colors": ["#ff5a00", "#f4efe6"],
            "specs": ["Custom design", "Sublimation print"],
            "isNew": True,
        }
        designs.append(entry)
        by_id[design_id] = entry
        added += 1

    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Added {added} design(s), updated {updated_thumbs} thumbnail path(s).")
    print(f"Generated {added_textures} 3D texture(s). Manifest now has {len(designs)} design(s).")


if __name__ == "__main__":
    main()
