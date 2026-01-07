from striver_tracker.config import ALGOMASTER_GROUPS
from striver_tracker.utils import slugify


def classify_linked_list_chapter(title):
    name = str(title).lower()
    if any(key in name for key in ["reverse", "swap", "k-group", "k group", "reorder"]):
        return "Reversal & Reordering"
    if any(
        key in name
        for key in ["cycle", "middle", "nth", "happy", "intersection", "palindrome"]
    ):
        return "Two Pointers & Cycles"
    if any(key in name for key in ["copy", "random", "flatten", "design"]):
        return "Design & Copy"
    return "Core & Structure"


def apply_sheet_grouping(lessons, sheet_id):
    if sheet_id != "algomaster":
        return lessons, False
    updated = []
    changed = False
    for lesson in lessons:
        unit = lesson.get("unit", "")
        chapter = lesson.get("chapter") or "General"
        mapped = ALGOMASTER_GROUPS.get(unit)
        if mapped:
            new_unit, new_chapter = mapped
        else:
            new_unit, new_chapter = unit, chapter
        if new_unit == "Linked List":
            chapter_override = classify_linked_list_chapter(lesson.get("title", ""))
            if chapter_override:
                new_chapter = chapter_override
        if new_unit != unit or new_chapter != chapter:
            changed = True
            new_id = (
                f"sheet-{slugify(new_unit)}-{slugify(new_chapter)}-"
                f"{slugify(lesson['title'])}"
            )
            lesson = {**lesson, "unit": new_unit, "chapter": new_chapter, "id": new_id}
        updated.append(lesson)
    return updated, changed
