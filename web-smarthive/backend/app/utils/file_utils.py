from pathlib import Path


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".mp4",
    ".mov",
    ".webm",
}


def safe_extension(filename: str) -> str:
    extension = Path(filename).suffix.lower()
    return extension if extension in ALLOWED_EXTENSIONS else ".bin"

