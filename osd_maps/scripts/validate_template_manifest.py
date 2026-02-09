#!/usr/bin/env python3
import argparse
import json
import os
from collections import defaultdict


def load_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def is_cell_payload(cell):
    return isinstance(cell, dict) and "label" in cell and "color" in cell


def validate_snapshot_shape(template_id, snapshot, errors):
    if not isinstance(snapshot, dict):
        errors.append("%s: snapshot is not an object" % template_id)
        return

    top = snapshot.get("t")
    grid = snapshot.get("g")
    side = snapshot.get("s")

    if not isinstance(top, list) or len(top) != 8:
        errors.append("%s: snapshot.t must have exactly 8 cells" % template_id)
    else:
        for i, cell in enumerate(top):
            if not is_cell_payload(cell):
                errors.append("%s: snapshot.t[%d] is not a {label,color} object" % (template_id, i))

    if not isinstance(grid, list) or len(grid) != 8:
        errors.append("%s: snapshot.g must have exactly 8 rows" % template_id)
    else:
        for r, row in enumerate(grid):
            if not isinstance(row, list) or len(row) != 8:
                errors.append("%s: snapshot.g[%d] must have exactly 8 cells" % (template_id, r))
                continue
            for c, cell in enumerate(row):
                if not is_cell_payload(cell):
                    errors.append("%s: snapshot.g[%d][%d] is not a {label,color} object" % (template_id, r, c))

    if not isinstance(side, list) or len(side) != 8:
        errors.append("%s: snapshot.s must have exactly 8 cells" % template_id)
    else:
        for i, cell in enumerate(side):
            if not is_cell_payload(cell):
                errors.append("%s: snapshot.s[%d] is not a {label,color} object" % (template_id, i))


def main():
    parser = argparse.ArgumentParser(
        description="Validate template manifest routing and snapshot schema ({t:8, g:8x8, s:8})."
    )
    parser.add_argument(
        "--manifest",
        default=os.path.join("osd_maps", "generated_templates", "manifest.json"),
        help="Path to manifest.json",
    )
    parser.add_argument(
        "--templates-dir",
        default=os.path.join("osd_maps", "json_templates"),
        help="Directory containing JSON templates",
    )
    args = parser.parse_args()

    errors = []
    warnings = []

    manifest = load_json(args.manifest)
    templates = manifest.get("templates", {})
    routes = manifest.get("routing", {}).get("by_mode_id", {})

    if not isinstance(templates, dict):
        raise SystemExit("manifest.templates must be an object")
    if not isinstance(routes, dict):
        raise SystemExit("manifest.routing.by_mode_id must be an object")

    route_targets = defaultdict(list)
    for mode_id, template_id in routes.items():
        route_targets[template_id].append(mode_id)
        if template_id not in templates:
            errors.append("routing.by_mode_id[%s] references unknown template id %s" % (mode_id, template_id))

    files_on_disk = {}
    for name in sorted(os.listdir(args.templates_dir)):
        if not name.lower().endswith(".json"):
            continue
        path = os.path.join(args.templates_dir, name)
        data = load_json(path)
        template_id = data.get("id")
        if not template_id:
            errors.append("%s: missing template id" % name)
            continue
        files_on_disk[template_id] = {
            "path": path,
            "data": data,
        }
        validate_snapshot_shape(template_id, data.get("snapshot"), errors)

    for template_id, info in templates.items():
        rel = info.get("file", "")
        expected_path = rel
        if not os.path.isabs(expected_path):
            expected_path = os.path.normpath(expected_path)
        if not os.path.exists(expected_path):
            errors.append("template %s points to missing file: %s" % (template_id, rel))
        if template_id not in files_on_disk:
            errors.append("template %s is not present in templates-dir payloads" % template_id)
        if template_id not in route_targets:
            errors.append("template %s has no route in routing.by_mode_id" % template_id)

    for template_id in files_on_disk.keys():
        if template_id not in templates:
            warnings.append("json template id %s exists on disk but is not declared in manifest.templates" % template_id)

    print("manifest_templates:", len(templates))
    print("routes:", len(routes))
    print("json_templates_on_disk:", len(files_on_disk))
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
