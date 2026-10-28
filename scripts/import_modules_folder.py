"""Import every supported document from a folder into the persistent module library."""

from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from openjarvis.server.modules_routes import ModuleImportBody, _extract_text, import_text

SUPPORTED = {".txt", ".md", ".csv", ".pdf", ".docx"}


async def main(folder: Path) -> None:
    for file in sorted(folder.iterdir()):
        if not file.is_file() or file.suffix.lower() not in SUPPORTED:
            print(f"Skipped unsupported file: {file.name}")
            continue
        data = file.read_bytes()
        content = _extract_text(data, file.name)
        result = await import_text(ModuleImportBody(
            title=file.stem,
            subject="algorithms",
            content=content,
            source_filename=file.name,
        ))
        print(f"Imported {result['id']}: {result['title']} ({len(content)} chars)")
        print(f"  Topics: {', '.join(result['topics'])}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", nargs="?", default=r"C:\Users\Kyle\Downloads\MEMORY_MODULES")
    args = parser.parse_args()
    asyncio.run(main(Path(args.folder)))
