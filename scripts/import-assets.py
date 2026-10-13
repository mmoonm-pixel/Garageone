#!/usr/bin/env python3
"""Import the original Garage One logo and banners without modifying their bytes."""

from __future__ import annotations

import argparse
from io import BytesIO
from pathlib import Path, PurePosixPath
import stat
import sys
import tempfile
import warnings
import zipfile

from PIL import Image


REQUIRED = {
    "garage-hero-desktop.png": ("PNG", (1672, 941)),
    "garage-hero-mobile.png": ("PNG", (941, 1672)),
    "logo-garage-one.png": ("PNG", None),
}

MAX_FILE_BYTES = 32 * 1024 * 1024
MAX_ARCHIVE_BYTES = 128 * 1024 * 1024
MAX_ENTRIES = 1000
Image.MAX_IMAGE_PIXELS = 40_000_000


def inspect_archive(archive_path: Path) -> dict[str, tuple[bytes, str]]:
    """Validate the whole archive before writing any destination image."""
    result: dict[str, tuple[bytes, str]] = {}
    with zipfile.ZipFile(archive_path) as archive:
        entries = archive.infolist()
        if len(entries) > MAX_ENTRIES:
            raise ValueError(f"O ZIP excede o limite de {MAX_ENTRIES} entradas.")
        if sum(entry.file_size for entry in entries) > MAX_ARCHIVE_BYTES:
            raise ValueError("O ZIP excede o limite de 128 MiB descompactados.")
        seen_paths: set[str] = set()
        for entry in entries:
            path = PurePosixPath(entry.filename)
            if (
                not entry.filename
                or "\\" in entry.filename
                or path.is_absolute()
                or ".." in path.parts
                or any(":" in part for part in path.parts)
                or "\x00" in entry.filename
            ):
                raise ValueError(f"Caminho inseguro no ZIP: {entry.filename!r}")
            normalized = str(path)
            if normalized in seen_paths:
                raise ValueError(f"Entrada duplicada no ZIP: {entry.filename}")
            seen_paths.add(normalized)
            if stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError(f"Links simbólicos não são aceitos: {entry.filename}")
            if entry.is_dir():
                continue
            if entry.file_size > MAX_FILE_BYTES:
                raise ValueError(f"Arquivo excede 32 MiB: {entry.filename}")
            if entry.file_size > max(entry.compress_size, 1) * 250:
                raise ValueError(f"Taxa de compressão excessiva: {entry.filename}")
            name = path.name
            if name not in REQUIRED:
                continue
            if name in result:
                raise ValueError(f"Nome obrigatório ambíguo em múltiplas pastas: {name}")
            # Read only selected assets. ZipFile checks their CRC while reading.
            data = archive.read(entry)
            expected_format, expected_size = REQUIRED[name]
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(BytesIO(data)) as image:
                    image.verify()
                with Image.open(BytesIO(data)) as image:
                    image.load()
                    if image.format != expected_format:
                        raise ValueError(f"Formato de {name}: esperado {expected_format}, recebido {image.format}.")
                    if expected_size and image.size != expected_size:
                        raise ValueError(f"Dimensões de {name}: esperado {expected_size[0]}×{expected_size[1]}, recebido {image.width}×{image.height}.")
                    details = f"{image.width}×{image.height}, {len(data):,} bytes"
                    if name == "logo-garage-one.png":
                        alpha = image.convert("RGBA").getchannel("A")
                        transparent = alpha.getextrema()[0] < 255
                        details += f", transparência: {'sim' if transparent else 'não — verificar logo original'}"
            result[name] = (data, details)
    missing = set(REQUIRED) - result.keys()
    if missing:
        raise ValueError("Arquivos obrigatórios ausentes: " + ", ".join(sorted(missing)))
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa as nove imagens originais do ZIP para public/images, sem conversão nem alteração.")
    parser.add_argument("zip_path", type=Path, help="Caminho local do ZIP fornecido pelo usuário")
    parser.add_argument("--dry-run", action="store_true", help="Valida e informa dimensões sem copiar arquivos")
    args = parser.parse_args()
    destination = Path(__file__).resolve().parents[1] / "public" / "images"
    try:
        if args.zip_path.stat().st_size > MAX_ARCHIVE_BYTES:
            raise ValueError("O arquivo ZIP excede o limite de 128 MiB.")
        images = inspect_archive(args.zip_path)
        if not args.dry_run:
            destination.mkdir(parents=True, exist_ok=True)
            for name, (data, _) in images.items():
                # Atomic per-file replacement; never extract ZIP paths to disk.
                with tempfile.NamedTemporaryFile(dir=destination, delete=False) as temporary:
                    temporary_path = Path(temporary.name)
                    temporary.write(data)
                try:
                    temporary_path.chmod(0o644)
                    temporary_path.replace(destination / name)
                finally:
                    temporary_path.unlink(missing_ok=True)
        for name in REQUIRED:
            print(f"{name}: {images[name][1]}")
        print("Validação concluída." if args.dry_run else f"Imagens originais importadas em {destination}")
        return 0
    except (OSError, ValueError, zipfile.BadZipFile, RuntimeError, Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
        print(f"Erro: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
