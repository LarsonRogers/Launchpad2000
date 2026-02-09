# OSD map templates

## Sources

The HTML tables in `osd_maps/html_templates/` are **authoritative layout + label sources** only. They are not rendered at runtime.

## Normalized JSON templates

Run the normalization script to generate JSON snapshots from the HTML sources:

```sh
python3 osd_maps/scripts/normalize_osd_templates.py
```

The output in `osd_maps/json_templates/` is the canonical data that runtime code should load.

## Rendering

All rendering must target `osd_maps/ui_templates/launchpad_osd_base_template.html` by applying the JSON snapshots (labels + colors) to its cells.
