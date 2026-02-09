# CLAUDE.md — Launchpad2000

> **For AI coding agents (Claude Code, ChatGPT Codex, and others):**
> This file is the canonical project instruction manual. Read it before making any changes.
> Claude Code reads this file automatically. Codex agents: see also `AGENTS.md` which
> redirects here. All three docs (`CLAUDE.md`, `CLAUDE_CODE_STYLE_GUIDE.md`,
> `IMPLEMENTATION_PLAN.md`) are platform-neutral — follow them regardless of which
> AI agent or IDE you're running in.
>
> **For the developer:** This is your architecture reference and the single source of
> truth for project constraints, file structure, and workflow.

<!--
AGENT COMPATIBILITY NOTE:
- Claude Code: reads CLAUDE.md automatically on /init
- ChatGPT Codex: reads AGENTS.md automatically, which redirects here
- Other agents (Cursor, Windsurf, Aider, etc.): should be pointed to this file
All instructions in this file apply equally to all agents. Do not write code that
assumes a specific agent is executing it.
-->

---

## What This Project Is

**Launchpad2000** is a GitHub fork of **hdavid/Launchpad95** (GPL-3.0) that adds:
- A refactored, stable OSD bridge (`osd_bridge.js`)
- A live JWeb grid renderer showing real-time pad colors and mode labels
- `mode_id` as a proper M4LInterface property (no more fragile string matching)
- `pad_colors` data for live LED state mirroring

Users install this as `Launchpad2000` in Ableton's MIDI Remote Scripts. It coexists
alongside an unmodified Launchpad95 install — the user selects which to use in
Live's Preferences → Link/Tempo/MIDI.

### Lineage
- **Upstream**: [hdavid/Launchpad95](https://github.com/hdavid/Launchpad95) (GPL-3.0)
- **Predecessor OSD**: [LarsonRogers/Launchpad98](https://github.com/LarsonRogers/Launchpad98)
- **This project**: Fork of LP95 with integrated OSD as a first-class feature

### Why a Fork (not an overlay)
Launchpad98 was a drop-in overlay — fragile, couldn't add M4LInterface properties,
version mismatch headaches. As a fork we can add `mode_id`, `pad_colors`, fix bugs
directly, and still pull upstream updates from hdavid when Ableton ships breaking changes.

---

## Git / Fork Workflow

This repo is a **GitHub fork** of `hdavid/Launchpad95`. The Python files live at the
repo root in their original LP95 directory structure — this is critical for clean
three-way merges when pulling upstream changes.

```bash
# Remotes
origin    → github.com/LarsonRogers/Launchpad2000   (our fork)
upstream  → github.com/hdavid/Launchpad95            (hdavid's original)

# Pulling upstream updates
git fetch upstream
git checkout -b upstream-sync
git merge upstream/master        # three-way merge — our additive changes auto-resolve
# test in Ableton
git checkout master && git merge upstream-sync
```

**Why this works**: Our Python changes are additive (adding `self._osd.mode_id = "session"`
next to existing `self._osd.mode = "Session"` lines). Git's three-way merge handles this
cleanly. If we'd moved files into a `Launchpad2000/` subfolder, every merge would see
deletes + creates and lose the merge intelligence.

**Install instruction for users**: Clone/download this repo → rename the folder to
`Launchpad2000` → place in Ableton's MIDI Remote Scripts directory.

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│  Ableton Live                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Launchpad2000 (MIDI Remote Script — Python)              │ │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │ │
│  │  │ LP95 Core       │  │ M4LInterface (enhanced)      │  │ │
│  │  │ (forked, all    │──│ exposes: mode, mode_id, info,│  │ │
│  │  │  components)    │  │ attributes, attribute_names,  │  │ │
│  │  │                 │  │ pad_colors (NEW)              │  │ │
│  │  └─────────────────┘  └──────────────┬───────────────┘  │ │
│  └──────────────────────────────────────│────────────────────┘ │
│                                         │                      │
│  ┌──────────────────────────────────────▼────────────────────┐ │
│  │ M4L Device: Launchpad2000 Grid (.amxd)                    │ │
│  │  ┌──────────────┐  ┌───────────────────────────────────┐  │ │
│  │  │ osd_bridge.js│  │ JWeb Grid Renderer                │  │ │
│  │  │ (Max js obj) │  │ launchpad_grid.html               │  │ │
│  │  │ LiveAPI +    │──│ • applySnapshot() for mode labels │  │ │
│  │  │ mode routing │  │ • setPadColor() for live LED state│  │ │
│  │  │ + pad colors │  │ • MK1/MK2+ RGB palette support    │  │ │
│  │  └──────────────┘  └───────────────────────────────────┘  │ │
│  │  ┌──────────────┐  ┌───────────────────────────────────┐  │ │
│  │  │ layout_      │  │ Dict: osd_state                   │  │ │
│  │  │ engine.js    │  │ (single source of truth)          │  │ │
│  │  └──────────────┘  └───────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ M4L Device: Launchpad95OSDHelper.amxd  [hdavid's original] │ │
│  │  LP95's built-in OSD — ships unchanged with the fork       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Constraints (DO NOT VIOLATE)

1. **Preserve LP95 file structure at repo root** — Python files stay where LP95 put them.
   Do NOT move them into a subfolder. This is required for clean upstream merges.
2. **Additive changes only** to forked Python files — add `mode_id`/`pad_colors` lines
   next to existing code. Never delete or rearrange LP95's original logic.
3. **LP95 behavior preserved** — all original functionality must work identically.
4. **GPL-3.0** — all code must remain GPL-3.0 compatible.
5. **Cross-platform** — must work on Windows and macOS.
6. **Document every Python change** in `CHANGELOG_FROM_LP95.md`.

---

## File Structure

```
/                                      # ← REPO ROOT (= LP95's original root)
│                                      #   When installed, this folder is renamed
│                                      #   to "Launchpad2000" in MIDI Remote Scripts
│
│  # ── LP95 Python files (ORIGINAL LOCATIONS, do not move) ──
├── __init__.py                        # Entry point (forked: updated for Launchpad2000)
├── Launchpad95.py                     # Main script (forked: class name may be updated)
├── MainSelectorComponent.py           # Forked: adds mode_id emission
├── M4LInterface.py                    # Forked: adds mode_id + pad_colors properties
├── InstrumentControllerComponent.py   # Forked: adds mode_id
├── DeviceControllerComponent.py       # Forked: adds mode_id
├── DeviceControllerStripServer.py     # Forked: adds mode_id
├── SpecialMixerComponent.py           # Forked: adds mode_id
├── SpecialSessionComponent.py         # Forked: adds mode_id
├── StepSequencerComponent.py          # Forked: adds mode_id
├── StepSequencerComponent2.py         # Forked: adds mode_id
├── Settings.py                        # Unmodified (LED velocity mappings, note layouts)
├── ConfigurableButtonElement.py       # Unmodified
├── ... (remaining LP95 .py files)     # Unmodified unless noted in CHANGELOG
│
│  # ── OSD additions (NEW, Launchpad2000-only) ──
├── M4L_Devices/
│   ├── Launchpad2000_Grid.amxd        # NEW: JWeb grid device (Phase 2 — built in Max)
│   └── js/
│       ├── osd_bridge.js              # Max JS: discovery + mode routing + grid data
│       └── layout_engine.js           # Max JS: vertical stack layout computation
│
│  # ── LP95 original M4L device (comes with the fork, unchanged) ──
├── M4LDevice/
│   └── Launchpad95OSDHelper.amxd      # hdavid's original OSD helper (ships as-is)
│
├── osd_maps/
│   ├── html_templates/                # AUTHORITATIVE: HTML tables from LP95 docs
│   ├── json_templates/                # CANONICAL: normalized {t,g,s} snapshots
│   ├── generated_templates/
│   │   └── manifest.json              # mode_id → template routing
│   ├── palettes/
│   │   └── mk2_palette.json           # velocity (0-127) → [R,G,B]
│   ├── scripts/
│   │   └── normalize_osd_templates.py # HTML→JSON pipeline
│   └── ui_templates/
│       └── launchpad_grid.html        # JWeb grid renderer
│
├── Reference_materials/
│   ├── M4LDevice/
│   │   └── L95_ext.js                 # Launchpad98 bridge script (REFERENCE ONLY)
│   └── LPC_Live_3_prototypes/         # Prototype devices from earlier development
│       ├── Launchpad95_OSD.amxd/      # JWeb grid prototype (controller.js, renderer.js)
│       ├── Modern_Launchpad_OSD.amxd/ # Earlier iteration
│       └── src/                       # Loose maxpat files, layout_engine.js
│       # NOTE: These prototypes contain useful code to cannibalize
│       # (LP95 discovery, template loading, JWeb communication, palette handling)
│       # but are NOT working devices. Build new devices in Max from scratch.
│
│  # ── Project docs ──
├── CLAUDE.md                          # THIS FILE
├── CLAUDE_CODE_STYLE_GUIDE.md         # Max/M4L coding rules for LLM agents
├── IMPLEMENTATION_PLAN.md             # Phased execution plan
├── Ableton_Live_12_M4L_OSD_Style_Guide.md  # Three-layer architecture spec
├── CHANGELOG_FROM_LP95.md             # Every change vs. upstream LP95
├── LICENSE                            # GPL-3.0
├── README.md
│
│  # ── LP95 original extras (unchanged) ──
└── web/                               # LP95's documentation website
```

**The rule**: everything at the repo root that came from LP95 stays exactly where LP95
put it. Our additions go in clearly separated directories (`M4L_Devices/`, `osd_maps/`,
`Reference_materials/`, docs).

---

## The OSD Grid Data Model

### Snapshot Schema
```json
{
  "id": "session_mode",
  "name": "Session Mode",
  "snapshot": {
    "t": [ {"label":"...", "color":"..."}, ... ],   // 8 top buttons
    "g": [ [ {"label":"...", "color":"..."}, ...8 ], ...8 rows ],  // 8×8 grid
    "s": [ {"label":"...", "color":"..."}, ... ]    // 8 side buttons
  }
}
```

### Color System
- **MK1**: 4 colors → CSS classes: `red`, `amber`, `green`, `` (off)
- **MK2+**: 128-color RGB palette indexed by MIDI velocity → `mk2_palette.json`

### Mode ID Routing
Python emits `mode_id` directly via M4LInterface. JS reads it as primary source,
with string-match fallback for robustness.

| mode_id | LP95 mode string | Template JSON |
|---------|-----------------|---------------|
| `session` | `"Session"` | `session_mode.json` |
| `instrument` | `"Instrument"` | `instrument_controller_mode_table.json` |
| `instrument_quick_scale` | `"Instrument (quick scale)"` | `quick_scale_modes_modus.json` |
| `instrument_scale` | `"Instrument - Scale"` | `scale_edition_mode_table.json` |
| `device_controller` | `"Device Controller"` | `device_controller_mode.json` |
| `mixer` | `"Mixer"` | `mixer_mode.json` |
| `user1` | `"User 1"` | `user1_mode.json` |
| `user2` | `"User 2"` | `user2_mode.json` |
| `drum_stepseq_combined` | `"Drum Step Sequencer"` | `drum_step_sequencer_mode_combined_mode.json` |
| `drum_stepseq_multinote` | `"Drum Step Sequencer (multinote)"` | `drum_step_sequencer_mode_multinote_mode.json` |
| `drum_stepseq_scale` | `"Scale"` (from StepSeq) | `quick_scale_modes_modus.json` |
| `melodic_stepseq` | `"Melodic Step Sequencer"` | `melodic_step_sequencer.json` |
| `melodic_stepseq_scale` | (scale within melodic) | `root_note_table.json` |

## Enhanced M4LInterface Properties (NEW)

Upstream LP95 exposes: `mode`, `info[0..1]`, `attributes[0..7]`, `attribute_names[0..7]`

**Launchpad2000 adds:**
- `mode_id` — canonical slug for mode routing
- `pad_colors[0..63]` — (Phase 2) current pad LED velocities, row-major

---

## Known Issues (to be resolved)

1. **normalize_osd_templates.py** — tooltip text leaks into labels. 7/17 templates affected.
2. **L95_ext.js (reference)** — 12 duplicate function defs. Cleaned up in `osd_bridge.js`.
3. **resolve_mode_id()** — incomplete. Replaced by Python-side `mode_id` + JS fallback.

---

## Technology Stack

- **Python** — LP95 control surface (Ableton's `_Framework`)
- **Max for Live** — .amxd devices, .maxpat patchers
- **Max JS** (`js` object) — ES5 only, NOT Node.js. See `CLAUDE_CODE_STYLE_GUIDE.md`.
- **JWeb** — Chromium (CEF) inside Max. Async communication via `window.max.*`
- **HTML/CSS/JS** — grid renderer in JWeb (modern JS OK here)

---

## References

- [Max JS LiveAPI docs](https://docs.cycling74.com/max8/vignettes/jsliveapi)
- [Adam Murray's JS Live API tutorials (Live 12)](https://adammurray.link/max-for-live/js-in-live/)
- [JWeb ↔ Max communication](https://docs.cycling74.com/userguide/web_browser/)
- [M4L Production Guidelines](https://github.com/Ableton/maxdevtools/blob/main/m4l-production-guidelines/m4l-production-guidelines.md)
- [Launchpad95 upstream](https://github.com/hdavid/Launchpad95)
- [Launchpad98 predecessor](https://github.com/LarsonRogers/Launchpad98)

---

## Related Docs

| Doc | Purpose |
|-----|---------|
| `AGENTS.md` | Entry point for ChatGPT Codex (redirects to CLAUDE.md) |
| `IMPLEMENTATION_PLAN.md` | Phased execution plan with agent prompts |
| `CLAUDE_CODE_STYLE_GUIDE.md` | Max JS, JWeb, LiveAPI, Python coding rules |
| `Ableton_Live_12_M4L_OSD_Style_Guide.md` | Three-layer architecture spec |
| `CHANGELOG_FROM_LP95.md` | Every change vs. upstream LP95 |
