import re
from html.parser import HTMLParser

from striver_tracker.utils import clean_heading_text, slugify


class SheetHTMLExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.current_unit = ""
        self.current_chapter = ""
        self._heading_tag = ""
        self._heading_text = []
        self._heading_has_unit = False
        self._heading_has_chapter = False
        self._capture_unit_tag = ""
        self._capture_chapter_tag = ""
        self._capture_unit_text = []
        self._capture_chapter_text = []
        self._capture_paragraph = False
        self._paragraph_text = []
        self._pending_unit = ""
        self._in_table = False
        self._in_tr = False
        self._in_cell = False
        self._in_a = False
        self._cells = []
        self._cell_text = []
        self._cell_links = []
        self._anchor_text = []
        self._anchor_href = ""

    def handle_starttag(self, tag, attrs):
        if tag in {"h1", "h2", "h3", "h4"}:
            self._heading_tag = tag
            self._heading_text = []
            self._heading_has_unit = False
            self._heading_has_chapter = False
        if tag == "table":
            self._in_table = True
            if self._pending_unit:
                self.current_unit = self._pending_unit
                self.current_chapter = ""
                self._pending_unit = ""
        if tag == "tr":
            self._in_tr = True
            self._cells = []
        if self._in_tr and tag in {"td", "th"}:
            self._in_cell = True
            self._cell_text = []
            self._cell_links = []
        if tag == "p" and not self._in_table and not self._in_tr and not self._in_cell:
            self._capture_paragraph = True
            self._paragraph_text = []
        if self._in_cell and tag == "a":
            self._in_a = True
            self._anchor_text = []
            attrs_map = dict(attrs)
            self._anchor_href = attrs_map.get("href", "")
        attrs_map = dict(attrs)
        class_attr = attrs_map.get("class", "")
        if tag in {"span", "div"} and "tuf-accordion-title" in class_attr:
            self._capture_unit_tag = tag
            self._capture_unit_text = []
        if tag == "button" and "tuf-subrow-btn" in class_attr:
            self._capture_chapter_tag = tag
            self._capture_chapter_text = []

    def handle_data(self, data):
        if self._capture_paragraph:
            self._paragraph_text.append(data)
            return
        if self._capture_unit_tag:
            self._capture_unit_text.append(data)
            return
        if self._capture_chapter_tag:
            self._capture_chapter_text.append(data)
            return
        if self._heading_tag:
            self._heading_text.append(data)
            return
        if self._in_a:
            self._anchor_text.append(data)
        elif self._in_cell:
            self._cell_text.append(data)

    def handle_endtag(self, tag):
        if tag == "table":
            self._in_table = False
        if tag == "p" and self._capture_paragraph:
            heading = " ".join(part.strip() for part in self._paragraph_text if part.strip())
            heading = clean_heading_text(heading)
            if heading:
                self._pending_unit = heading
            self._capture_paragraph = False
            self._paragraph_text = []
        if tag == self._capture_unit_tag and self._capture_unit_tag:
            heading = " ".join(part.strip() for part in self._capture_unit_text if part.strip())
            heading = clean_heading_text(heading)
            if heading:
                self.current_unit = heading
                self.current_chapter = ""
                if self._heading_tag:
                    self._heading_has_unit = True
            self._capture_unit_tag = ""
            self._capture_unit_text = []
        if tag == self._capture_chapter_tag and self._capture_chapter_tag:
            heading = " ".join(part.strip() for part in self._capture_chapter_text if part.strip())
            heading = clean_heading_text(heading)
            if heading:
                self.current_chapter = heading
                if self._heading_tag:
                    self._heading_has_chapter = True
            self._capture_chapter_tag = ""
            self._capture_chapter_text = []
        if tag in {"h1", "h2", "h3", "h4"} and tag == self._heading_tag:
            heading = " ".join(part.strip() for part in self._heading_text if part.strip())
            heading = clean_heading_text(heading)
            if heading and not self._heading_has_unit and not self._heading_has_chapter:
                if tag in {"h1", "h2"}:
                    self.current_unit = heading
                    self.current_chapter = ""
                elif tag == "h3":
                    if not self.current_unit:
                        self.current_unit = heading
                    else:
                        self.current_chapter = heading
                else:
                    if not self.current_unit:
                        self.current_unit = heading
                    else:
                        self.current_chapter = heading
            self._heading_tag = ""
            self._heading_text = []
            return

        if tag == "a" and self._in_a:
            text = "".join(self._anchor_text).strip()
            self._cell_links.append({"href": self._anchor_href, "text": text})
            self._in_a = False
            self._anchor_text = []
            self._anchor_href = ""
        if tag in {"td", "th"} and self._in_cell:
            text = " ".join(part.strip() for part in self._cell_text if part.strip())
            self._cells.append({"text": text.strip(), "links": self._cell_links})
            self._in_cell = False
            self._cell_text = []
            self._cell_links = []
        if tag == "tr" and self._in_tr:
            if any(cell["text"] or cell["links"] for cell in self._cells):
                self.rows.append(
                    {
                        "cells": self._cells,
                        "unit": self.current_unit,
                        "chapter": self.current_chapter,
                    }
                )
            self._in_tr = False
            self._cells = []


def parse_html_lessons(html_text, default_unit=None, default_chapter=None):
    parser = SheetHTMLExtractor()
    parser.feed(html_text)
    lessons = []

    order = 1
    for row in parser.rows:
        cells = row["cells"]
        header_text = " ".join(cell["text"] for cell in cells).lower()
        if ("problem" in header_text and "status" in header_text) or (
            "problem" in header_text and "difficulty" in header_text
        ):
            continue

        all_links = []
        for cell in cells:
            all_links.extend(cell["links"])

        title = ""
        for link in all_links:
            if link["text"] and link["text"].strip().lower() != "solve":
                title = link["text"].strip()
                break
        if not title and cells:
            title = cells[1]["text"] if len(cells) > 1 else cells[0]["text"]
        title = title.strip()
        if not title:
            continue

        unit = row["unit"] or default_unit or "Imported"
        chapter = row["chapter"] or default_chapter or "General"
        difficulty = cells[-1]["text"].strip() if cells else ""

        leetcode_url = ""
        youtube_url = ""
        solve_url = ""
        resource_url = ""
        for link in all_links:
            href = link["href"] or ""
            if "leetcode.com" in href:
                leetcode_url = href
                break
        for link in all_links:
            href = link["href"] or ""
            if "youtu.be" in href or "youtube.com" in href:
                youtube_url = href
                break
        if not leetcode_url:
            for link in all_links:
                if link["text"].strip().lower() == "solve":
                    solve_url = link["href"]
                    break
        for link in all_links:
            href = link["href"] or ""
            if href and href not in {leetcode_url, solve_url, youtube_url}:
                resource_url = href
                break

        lesson_id = f"sheet-{slugify(unit)}-{slugify(chapter)}-{slugify(title)}"
        lessons.append(
            {
                "id": lesson_id,
                "title": title,
                "unit": unit,
                "chapter": chapter,
                "kind": "sheet",
                "source": "html",
                "leetcode_url": leetcode_url or "",
                "youtube_url": youtube_url or "",
                "resource_url": resource_url,
                "difficulty": difficulty,
                "order": order,
            }
        )
        order += 1

    return lessons
