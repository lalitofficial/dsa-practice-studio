import re
from datetime import datetime, timezone


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def pretty_title(stem):
    cleaned = stem.replace("_", "-")
    parts = [p for p in re.split(r"[-\s]+", cleaned) if p]
    out = []
    for part in parts:
        if part.isdigit():
            out.append(part)
            continue
        if part.isupper() and len(part) <= 4:
            out.append(part)
            continue
        if any(ch.isdigit() for ch in part):
            out.append(part)
            continue
        out.append(part.capitalize())
    return " ".join(out)


def normalize_title(value):
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def clean_heading_text(value):
    cleaned = re.sub(r"\s+", " ", value).strip()
    cleaned = re.sub(r"\b\d+\s*/\s*\d+\b", "", cleaned)
    cleaned = re.sub(r"\b\d+%\b", "", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip(" -")
    return cleaned
