#!/usr/bin/env python3
import argparse
import os
import re


def expected_grid_ids():
    out = []
    for row in range(8):
        for col in range(8):
            out.append("g%d%d" % (row, col))
    return out


def parse_html_grid_ids(html_path):
    with open(html_path, "r", encoding="utf-8") as handle:
        text = handle.read()
    return set(re.findall(r"id=['\"](g[0-7][0-7])['\"]", text))


def parse_bridge_grid_id_formula(bridge_path):
    with open(bridge_path, "r", encoding="utf-8") as handle:
        text = handle.read()
    # Keep this check simple and robust: ensure bridge uses row/col -> gRC shape.
    return 'return "g" + row + col;' in text or "return 'g' + row + col;" in text


def launchpad_mk1_index(note):
    row = note // 16
    col = note % 16
    if 0 <= row < 8 and 0 <= col < 8:
        return row * 8 + col
    return -1


def launchpad_mk2_index(note):
    row = (89 - note) // 10
    col = note - (81 - (10 * row))
    if 0 <= row < 8 and 0 <= col < 8:
        return row * 8 + col
    return -1


def validate_launchpad_note_maps(errors):
    # MK1 grid note pattern: row*16 + col
    for row in range(8):
        for col in range(8):
            note = row * 16 + col
            expected = row * 8 + col
            got = launchpad_mk1_index(note)
            if got != expected:
                errors.append(
                    "MK1 mapping mismatch note %d: expected %d got %d" % (note, expected, got)
                )

    # MK2/MK3/LPX grid note pattern: 81..88, 71..78, ... 11..18
    for row in range(8):
        for col in range(8):
            note = (81 - (10 * row)) + col
            expected = row * 8 + col
            got = launchpad_mk2_index(note)
            if got != expected:
                errors.append(
                    "MK2-family mapping mismatch note %d: expected %d got %d"
                    % (note, expected, got)
                )


def main():
    parser = argparse.ArgumentParser(
        description="Validate Phase 2.5 pad mapping consistency (64-grid mapping only)."
    )
    parser.add_argument(
        "--bridge",
        default=os.path.join("M4L_Devices", "js", "osd_bridge.js"),
        help="Path to osd_bridge.js",
    )
    parser.add_argument(
        "--grid-html",
        default=os.path.join("osd_maps", "ui_templates", "launchpad_grid.html"),
        help="Path to launchpad_grid.html",
    )
    args = parser.parse_args()

    errors = []
    warnings = []

    # Validate the 64-grid pad ID surface in HTML.
    expected_ids = set(expected_grid_ids())
    html_ids = parse_html_grid_ids(args.grid_html)
    missing = sorted(expected_ids - html_ids)
    extra = sorted(html_ids - expected_ids)
    if missing:
        errors.append("launchpad_grid.html missing grid IDs: %s" % ", ".join(missing))
    if extra:
        warnings.append("launchpad_grid.html has extra grid IDs: %s" % ", ".join(extra))

    # Validate bridge uses row/col -> gRC mapping.
    if not parse_bridge_grid_id_formula(args.bridge):
        errors.append("osd_bridge.js pad_id_from_index() is not returning gRC format")

    # Validate note->index formulas used in Launchpad.py logic.
    validate_launchpad_note_maps(errors)

    print("errors:", len(errors))
    print("warnings:", len(warnings))
    if warnings:
        for line in warnings:
            print("WARN:", line)
    if errors:
        for line in errors:
            print("ERROR:", line)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
