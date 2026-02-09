#!/usr/bin/env python3
import argparse
import json
import os
from html import unescape
from html.parser import HTMLParser
from typing import List, Optional

COLOR_CLASSES = {"red", "amber", "green"}


def normalize_label(text: str) -> str:
    cleaned = unescape(text).replace("\xa0", " ")
    cleaned = " ".join(cleaned.split())
    return cleaned


def slugify(name: str) -> str:
    base = os.path.splitext(os.path.basename(name))[0]
    slug = "".join(ch.lower() if ch.isalnum() else "_" for ch in base)
    slug = "_".join(filter(None, slug.split("_")))
    return slug


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.rows: List[dict] = []
        self._current_row: Optional[List[dict]] = None
        self._current_row_classes: List[str] = []
        self._current_cell: Optional[dict] = None
        self._current_cell_text: List[str] = []
        self._note_stack: List[str] = []

    def handle_starttag(self, tag: str, attrs):
        if tag == "tr":
            self._current_row = []
            self._current_row_classes = []
            for key, value in attrs:
                if key == "class" and value:
                    self._current_row_classes = value.split()
        elif tag in {"td", "th"}:
            if self._current_row is None:
                return
            classes = []
            for key, value in attrs:
                if key == "class" and value:
                    classes = value.split()
            self._current_cell = {
                "classes": classes,
                "text": "",
            }
            self._current_cell_text = []
        else:
            for key, value in attrs:
                if key == "class" and value:
                    classes = value.split()
                    if "note" in classes or "noteTop" in classes:
                        self._note_stack.append(tag)
                        break

    def handle_data(self, data: str):
        if self._current_cell is not None and not self._note_stack:
            self._current_cell_text.append(data)

    def handle_endtag(self, tag: str):
        if tag in {"td", "th"} and self._current_cell is not None and self._current_row is not None:
            raw_text = "".join(self._current_cell_text)
            self._current_cell["text"] = normalize_label(raw_text)
            self._current_row.append(self._current_cell)
            self._current_cell = None
            self._current_cell_text = []
        elif tag == "tr" and self._current_row is not None:
            self.rows.append({
                "classes": self._current_row_classes,
                "cells": self._current_row,
            })
            self._current_row = None
            self._current_row_classes = []
        elif self._note_stack and tag == self._note_stack[-1]:
            self._note_stack.pop()


def extract_color(classes: List[str]) -> str:
    for cls in classes:
        if cls in COLOR_CLASSES:
            return cls
    return ""


def cell_payload(cell: dict) -> dict:
    label = cell.get("text", "")
    color = extract_color(cell.get("classes", []))
    payload = {"label": label}
    if color:
        payload["color"] = color
    else:
        payload["color"] = ""
    return payload


def parse_table(html_text: str) -> dict:
    parser = TableParser()
    parser.feed(html_text)
    rows = parser.rows
    if not rows:
        return {"t": [], "g": [], "s": []}

    top_index = next((i for i, row in enumerate(rows) if "top" in row.get("classes", [])), None)
    top_row = rows[top_index] if top_index is not None else None
    grid_rows = [row for i, row in enumerate(rows) if i != top_index] if top_index is not None else rows

    top_cells = [cell_payload(cell) for cell in top_row.get("cells", [])][:8] if top_row else []
    while len(top_cells) < 8:
        top_cells.append({"label": "", "color": ""})

    grid = []
    side = []
    for row in grid_rows:
        cells = row.get("cells", [])
        side_cell = None
        for cell in cells:
            if "side" in cell.get("classes", []):
                side_cell = cell
                break
        if side_cell is None and len(cells) >= 9:
            side_cell = cells[-1]
        grid_cells = cells[:8]
        row_payload = [cell_payload(cell) for cell in grid_cells]
        while len(row_payload) < 8:
            row_payload.append({"label": "", "color": ""})
        grid.append(row_payload)

        if side_cell is None:
            side.append({"label": "", "color": ""})
        else:
            side.append(cell_payload(side_cell))

    while len(grid) < 8:
        grid.append([{"label": "", "color": ""} for _ in range(8)])
        side.append({"label": "", "color": ""})

    return {"t": top_cells, "g": grid[:8], "s": side[:8]}


def build_template(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as handle:
        html_text = handle.read()
    snapshot = parse_table(html_text)
    name = os.path.splitext(os.path.basename(path))[0]
    return {
        "id": slugify(name),
        "name": name,
        "snapshot": snapshot,
        "source": os.path.join("osd_maps", "html_templates", os.path.basename(path)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize OSD HTML templates into JSON snapshots.")
    parser.add_argument(
        "--input",
        default=os.path.join("osd_maps", "html_templates"),
        help="Input directory containing HTML tables.",
    )
    parser.add_argument(
        "--output",
        default=os.path.join("osd_maps", "json_templates"),
        help="Output directory for JSON templates.",
    )
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    html_files = [
        os.path.join(args.input, name)
        for name in sorted(os.listdir(args.input))
        if name.lower().endswith(".html")
    ]
    if not html_files:
        raise SystemExit(f"No HTML files found in {args.input}")

    for path in html_files:
        template = build_template(path)
        out_name = f"{template['id']}.json"
        out_path = os.path.join(args.output, out_name)
        with open(out_path, "w", encoding="utf-8") as handle:
            json.dump(template, handle, indent=2, ensure_ascii=False)
            handle.write("\n")


if __name__ == "__main__":
    main()
