from pathlib import Path


ALLOWED_CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
}


def safe_extension(filename: str) -> str | None:
    extension = Path(filename).suffix.lower()
    return extension if extension in ALLOWED_CONTENT_TYPES else None
