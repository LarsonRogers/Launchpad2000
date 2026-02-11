# Launchpad2000 Codebase Operations Summary

This document summarizes how Launchpad2000 works end-to-end so troubleshooting can focus on the right layer quickly.

## 1) Runtime Layers and Data Flow

Launchpad2000 is a three-layer system:

1. **Ableton Remote Script (Python, repo root)**
   - Controls Launchpad behavior, mode switching, and MIDI I/O.
   - Captures LED output state and exposes OSD data.
2. **M4L bridge object (`M4LInterface`)**
   - Serves as a data boundary between Python and Max for Live.
   - Exposes mode text/IDs, labels, and color arrays.
3. **Max/JWeb OSD UI (`osd_bridge.js` + `launchpad_grid.html`)**
   - Discovers `M4LInterface` via LiveAPI.
   - Routes `mode_id` to prebuilt JSON snapshots.
   - Pushes labels and real-time RGB updates to the browser grid.

At runtime, the main loop is:

- Python updates `_osd` values (`mode`, `mode_id`, `attributes`, `pad_colors`, `button_colors`).
- Python calls `_osd.update()`, which fires the `updateML` listener in Max.
- `osd_bridge.js` observer callback reads all fields from `M4LInterface`.
- Bridge sends:
  - **layout snapshot** (`loadSnapshot`) when mode/template changes
  - **color deltas** (`setPadColor` and/or `padColorsDict`) as LEDs change
- `launchpad_grid.html` applies labels/colors to `t*`, `g**`, and `s*` elements.

## 2) Python Side: Launchpad Script Responsibilities

### Entry point and hardware capabilities

- `__init__.py` exposes `create_instance()` and maps the script class to `Launchpad` for Ableton discovery.
- `get_capabilities()` defines Novation device IDs, model names, and MIDI port flags used by Live.

### Main controller (`Launchpad.py`)

`Launchpad` does two key jobs:

1. **Core LP95 behavior** (buttons, matrix, mode components, hardware init)
2. **OSD telemetry capture/export** (what this fork adds)

Important behavior:

- During `init()`, it constructs `M4LInterface`, stores hardware model (`mk1`/`mk2`/`mk3`/`lpx`), and wires `MainSelectorComponent`.
- `_send_midi()` is overridden; successful outbound messages are parsed by `_update_pad_colors_from_midi()`.
- Parsed LED events update:
  - `self._osd.pad_colors[0..63]` for grid pads
  - `self._osd.button_colors[0..15]` for top + side round buttons
- Updates are batched via `_schedule_pad_colors_update()` and flushed by `_flush_pad_colors_update()` to avoid spamming listeners.

### Mode routing from components

Each mode component sets **both**:

- user-facing `osd.mode` text
- canonical `osd.mode_id` slug

Examples:

- Session (`session`)
- Mixer (`mixer`)
- User1/User2 (`user1`, `user2`)
- Instrument variants (`instrument`, `instrument_scale`, `instrument_quick_scale`)
- Drum step-seq variants (`drum_stepseq_combined`, `drum_stepseq_multinote`, `drum_stepseq_scale`)
- Melodic step-seq (`melodic_stepseq`)
- Pro Session submodes (arm/solo/mute/tempo/etc.) are resolved dynamically in `SpecialProSessionComponent._resolve_pro_mode_id()`.

## 3) M4L Bridge Contract (`M4LInterface.py`)

`M4LInterface` is intentionally simple: it stores current OSD state and exposes a single trigger property (`updateML`) for Max listeners.

Key exposed fields:

- `mode`, `mode_id`
- `info[2]`
- `attributes[8]`, `attribute_names[8]`
- `hardware_model`
- `screenshots_dir`
- `pad_colors[64]`
- `button_colors[16]`

`update()` invokes the listener callback, which is the bridge into `osd_bridge.js`.

## 4) Max JS Bridge (`M4L_Devices/js/osd_bridge.js`)

### Discovery and observation

- On `loadbang()`, bridge loads palette data, initializes dicts, locates Launchpad control surface + `M4LInterface`, then starts boot tasks.
- `locate_l95()` scans control surfaces for component type `M4LInterface`.
- Once found, it installs a LiveAPI observer on property `updateML`.

### Pull/update cycle

In `update()` the bridge reads, every callback:

- `mode`, `mode_id`
- `info`, `attributes`, `attribute_names`
- `hardware_model`
- `pad_colors`, `button_colors`

It then:

- resolves a final mode slug (`resolve_mode_id`, with string fallback if needed)
- debounces mode asset/layout work (Task ~50ms)
- pushes label text to legacy Max text UI boxes
- pushes snapshot + color updates to JWeb outlet

### Template routing and snapshots

- `manifest.json` maps `mode_id -> template_id`.
- Bridge loads template JSON from `osd_maps/json_templates/*.json`.
- Snapshot schema is fixed:
  - `t` = top row (8)
  - `g` = 8x8 grid
  - `s` = side row (8)

### Color conversion path

- For MK2+/X/MiniMK3, velocity is mapped via `mk2_palette.json`.
- For MK1 fallback, velocity groups map to red/amber/green shades.
- The bridge tracks last velocity arrays and only emits changed cells.

Outputs to JWeb include:

- `loadSnapshot <dict-name>`
- `setTitle <mode-name>`
- `setPadColor <id> <r> <g> <b>`
- `padColorsDict <dict-name>` (bulk dict)

## 5) JWeb Renderer (`osd_maps/ui_templates/launchpad_grid.html`)

The HTML defines Launchpad-like cells:

- `t0..t7` (top round)
- `g00..g77` (8x8 grid)
- `s0..s7` (side round)

Inlet handlers:

- `loadSnapshot(dictName)` -> apply labels + base cell classes/colors
- `setTitle(title)`
- `setPadColor(id,r,g,b)` for per-cell RGB overlays
- `padColorsDict(dictName)` for bulk RGB refreshes

The renderer supports both:

- class-based colors (`red`, `amber`, `green`) from templates
- RGB colors from live LED telemetry

It also reports its rendered size back to Max via `window.max.outlet('resize', w, h)` and sends `ready` on startup.

## 6) Template Pipeline

Source + generated assets:

- Source tables: `osd_maps/html_templates/*.html`
- Normalized JSON templates: `osd_maps/json_templates/*.json`
- Routing manifest: `osd_maps/generated_templates/manifest.json`

Scripts:

- `normalize_osd_templates.py` parses HTML tables, strips note/tooltip text, and emits normalized `{t,g,s}` JSON payloads.
- `validate_template_manifest.py` checks route integrity and strict schema shape (`t=8`, `g=8x8`, `s=8`).

## 7) Troubleshooting by Layer (Quick Triaging)

### If UI does not update at all

1. Verify Live selected control surface is `Launchpad2000`.
2. Confirm `locate_l95()` found `M4LInterface` (bridge status logs in Max).
3. Confirm `updateML` observer fires.

### If mode labels change but colors do not

1. Check Python `_send_midi()` -> `_update_pad_colors_from_midi()` path.
2. Verify `pad_colors` / `button_colors` arrays are non-empty in bridge `update()`.
3. Confirm JWeb receives `setPadColor` or `padColorsDict` inlets.

### If wrong template loads

1. Compare emitted `mode_id` from Python component with `manifest.routing.by_mode_id`.
2. Check fallback path in `resolve_mode_id()` for string mismatch behavior.

### If only Pro Session variants are wrong

1. Inspect state flags used in `_resolve_pro_mode_id()`.
2. Ensure expected modifier button state is active when OSD refresh occurs.

## 8) Practical Mental Model

- **Python decides state** (mode + LEDs).
- **M4LInterface transports state**.
- **osd_bridge.js translates + routes state**.
- **JWeb renders state**.

So for bugs, start where the symptom appears, then step one layer upstream:

- Render issue -> JWeb
- Wrong template/route -> bridge + manifest
- Wrong mode/colors emitted -> Python component logic
