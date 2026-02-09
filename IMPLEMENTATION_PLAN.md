# IMPLEMENTATION_PLAN.md — Launchpad2000

<!--
AGENT COMPATIBILITY: This plan applies to ALL AI coding agents. The "Claude Code
Prompts" section contains suggested prompts — they work with any agent that can
read files and edit code. Adapt the phrasing if needed for your platform, but
follow the same sequence and constraints.
-->

## Overview

Two phases:
- **Phase 1**: Set up the fork, add `mode_id`, refactor JS + data pipeline
- **Phase 2**: Build JWeb live grid renderer, wire up pad color data

This is a **GitHub fork** of hdavid/Launchpad95. LP95 Python files stay at the repo
root in their original locations for clean upstream merges. Our additions go in
separate directories (`M4L_Devices/`, `osd_maps/`, etc.).

---

## Phase 1: Fork Setup, Refactor, Stability

### 1.0 — Set Up the Fork

**Actions**:
1. Fork `hdavid/Launchpad95` on GitHub → `LarsonRogers/Launchpad2000`
2. `git remote add upstream https://github.com/hdavid/Launchpad95.git`
3. Update `__init__.py` to reference the correct class for Ableton discovery as
   "Launchpad2000" (the folder name at install time determines what Ableton displays,
   but `__init__.py` may need a class name or module reference update)
4. Create `CHANGELOG_FROM_LP95.md` — initial entry documenting the fork point
   (upstream commit hash, date)
5. Create `.gitignore` additions for `*.pyc`, `.DS_Store`, etc. if LP95 doesn't
   have them
6. Move existing Launchpad2000 prototype files (`osd_maps/`, `M4L_Devices/`,
   reference materials) into the repo alongside the LP95 files
7. Verify in Ableton: rename the repo folder to `Launchpad2000`, place in MIDI
   Remote Scripts, confirm it appears in preferences and all LP95 functions work

### 1.1 — Add `mode_id` to M4LInterface (Python)

Add `mode_id` as a new M4LInterface property, following LP95's existing pattern for
`mode`. Then add `self._osd.mode_id = "<slug>"` in every component that sets `mode`.

| File | ~Line | Existing code | Add after |
|------|-------|--------------|-----------|
| `M4LInterface.py` | (init) | `self._mode = ""` | `self._mode_id = ""` (+ getter/setter) |
| `SpecialSessionComponent.py` | ~51 | `self._osd.mode = "Session"` | `self._osd.mode_id = "session"` |
| `InstrumentControllerComponent.py` | ~438 | `self._osd.mode = "Instrument"` | `self._osd.mode_id = "instrument"` |
| `InstrumentControllerComponent.py` | ~436 | `self._osd.mode = "Instrument (quick scale)"` | `self._osd.mode_id = "instrument_quick_scale"` |
| `InstrumentControllerComponent.py` | ~212 | `self._osd.mode = ... + ' - Scale'` | `self._osd.mode_id = "instrument_scale"` |
| `DeviceControllerComponent.py` | ~166 | `self._osd.mode = "Device Controller"` | `self._osd.mode_id = "device_controller"` |
| `DeviceControllerStripServer.py` | ~661 | `self._parent._osd.mode = "Device Controller"` | `self._parent._osd.mode_id = "device_controller"` |
| `SpecialMixerComponent.py` | ~75 | `self._osd.mode = "Mixer"` | `self._osd.mode_id = "mixer"` |
| `MainSelectorComponent.py` | ~336 | `self._osd.mode = "User 1"` | `self._osd.mode_id = "user1"` |
| `MainSelectorComponent.py` | ~370 | `self._osd.mode = "User 2"` | `self._osd.mode_id = "user2"` |
| `StepSequencerComponent.py` | ~182 | `self._osd.set_mode('Drum Step Sequencer (multinote)')` | `self._osd.mode_id = "drum_stepseq_multinote"` |
| `StepSequencerComponent.py` | ~184 | `self._osd.set_mode('Drum Step Sequencer')` | `self._osd.mode_id = "drum_stepseq_combined"` |
| `StepSequencerComponent.py` | ~659 | `self._osd.set_mode('Scale')` | `self._osd.mode_id = "drum_stepseq_scale"` |
| `StepSequencerComponent2.py` | ~790 | `self._osd.set_mode('Melodic Step Sequencer')` | `self._osd.mode_id = "melodic_stepseq"` |

**Critical**: Each change is ONE additive line next to existing code. No rearranging,
no deleting. Document every change in `CHANGELOG_FROM_LP95.md`.

### 1.2 — Refactor L95_ext.js → osd_bridge.js

Take `reference_materials/L95_ext.js` (the Launchpad98 bridge script) and create a
clean `M4L_Devices/js/osd_bridge.js`.

**Primary reference**: `reference_materials/Launchpad95OSDHelper.amxd` is the best
working example — study its patcher structure and JS wiring in Max before starting.
`reference_materials/Launchpad98OSD.amxd` is the device that `L95_ext.js` was built for.

**Prototype reference**: `reference_materials/LPC_Live_3_prototypes/controller.js`
and `reference_materials/LPC_Live_3_prototypes/Modern_Launchpad_OSD.amxd/resources/controller.js`
have useful patterns (retry logic, template caching, palette loading) but are not
working devices.

**1.2a — Deduplicate**: Remove all 12 first-definition duplicates. Keep DEBUG OVERRIDES
versions. Remove the markers.

**1.2b — Mode routing**: Read `mode_id` from M4LInterface directly. Keep string-match
fallback (`resolve_mode_id_from_string()`) for robustness only.

**1.2c — Consolidate**: Refactor `att_0..att_7` / `att_n_0..att_n_7` into arrays.

**1.2d — Harden**: Null checks on `getnamed()`, try/catch on LiveAPI, debounce mode
switches (50ms Task), gate logging behind `var LOG_ENABLED = 0;`.

### 1.3 — Fix normalize_osd_templates.py

Fix the `_note_stack` tooltip leak. Visible label = text outside `<div class="note">`
and `<div class="noteTop">` only. Regenerate all 17 JSON templates. Verify no label
exceeds ~20 characters.

### 1.4 — Documentation

- Update `CHANGELOG_FROM_LP95.md` with all Phase 1 Python changes
- Update `README.md` with install instructions (fork + rename)
- Verify `manifest.json` routing matches all mode_ids

---

## Phase 2: JWeb Live Grid Renderer

### Device Strategy

**What we're building**: `Launchpad2000_Grid.amxd` — a new M4L device built in Max.

**What already exists and works**:
- `MaLDevice/Launchpad95OSDHelper.amxd` — hdavid's original OSD helper. Ships with
  the fork unchanged. Users can keep using this.
- The Launchpad98 device (in the separate Launchpad98 repo) — the working screenshot
  OSD. NOT included in this repo. Users who want it can install it separately.

**What exists as reference code** (in `reference_materials/`):
- `L95_ext.js` — Launchpad98's bridge script. Best reference for LP95 discovery,
  mode observation, and attribute handling.
- `Launchpad95OSDHelper.amxd` — hdavid's WORKING OSD helper. The gold standard.
  Open it in Max to study patcher structure, JS wiring, and LiveAPI usage.
- `Launchpad98OSD.amxd` — the device that L95_ext.js was built for.
- `LPC_Live_3_prototypes/Modern_Launchpad_OSD.amxd/resources/controller.js` — prototype
  with LP95 discovery, template loading, JWeb communication, palette handling. Code
  to learn from and cannibalize, but the device itself doesn't work reliably.
- `LPC_Live_3_prototypes/Modern_Launchpad_OSD.amxd/resources/renderer.js` — prototype
  JWeb renderer with resize handling, pad color rendering, MK2 palette support.

**Build approach**: Create the .amxd patcher in Max. Write `osd_bridge.js` and
`launchpad_grid.html` as code files (Claude Code can do this). Wire them together
in Max manually.

### 2.1 — Create the M4L Device

The .amxd patcher must be built in the Max editor (Claude Code cannot create .amxd files).
Claude Code creates the JS and HTML files; the developer wires them in Max.

**Files Claude Code creates:**
- `M4L_Devices/js/osd_bridge.js` — Max JS (already started in Phase 1.2)
- `osd_maps/ui_templates/launchpad_grid.html` — JWeb renderer

**Developer builds in Max:**
- `M4L_Devices/Launchpad2000_Grid.amxd` — MIDI effect device with:
  ```
  [live.thisdevice] → [bang] → [js osd_bridge.js]
                                    │
                      outlet 0 ──→ mode/snapshot ──→ [jweb @url launchpad_grid.html]
                      outlet 1 ──→ pad colors ────→ [jweb]
                      outlet 2 ──→ status ─────────→ [print osd_bridge]
  ```

**Reference for wiring**: The prototype at
`reference_materials/LPC_Live_3_prototypes/Modern_Launchpad_OSD.amxd/Modern_Launchpad_OSD.maxpat`
shows one approach. The working `reference_materials/Launchpad95OSDHelper.amxd`
is the best model — open it in Max to see how hdavid wired the JS and LiveAPI.

### 2.2 — launchpad_grid.html

Based on `osd_maps/ui_templates/launchpad_osd_base_template.html`, plus patterns from
the prototype `renderer.js` in `Reference_materials/LPC_Live_3_prototypes/`:

1. `window.max.bindInlet("loadSnapshot", dictName)` → getDict → applySnapshot
2. `window.max.bindInlet("setTitle", title)` → update mode title
3. `window.max.bindInlet("setPadColor", id, r, g, b)` → update single pad
4. Extend `setColor()` to accept CSS class names OR `[r,g,b]` for MK2+
5. `window.max.outlet("ready")` on load
6. Resize reporting (pattern from prototype renderer.js: measure `.wrap`, outlet dimensions)

### 2.3 — Add `pad_colors` to M4LInterface (Python)

Add `pad_colors` — 64-element array of current pad LED velocities (row-major).
Hook into `_send_midi` to capture LED state. Trigger M4L update on change.

This is another additive Python change — document in `CHANGELOG_FROM_LP95.md`.

### 2.4 — Wire Up osd_bridge.js for Pad Colors

On `pad_colors` update: read velocities, convert to RGB via `mk2_palette.json`,
batch into Dict snapshot, send to JWeb.

### 2.5 — Pad-to-Grid Mapping

```
Top row:     CC 104-111  →  t0-t7
Grid:        Note 0-7    →  g00-g07  (row 0)
             Note 16-23  →  g10-g17  (row 1)
             ...
             Note 112-119 → g70-g77  (row 7)
Side:        Note 8,24,40,56,72,88,104,120  → s0-s7
```

Use LP95's `Settings.py` for definitive note/CC assignments.

---

## Agent Prompts (for Claude Code, Codex, or any AI coding agent)

### Phase 1 (in order)

```
1. "Update __init__.py so this fork can be discovered as 'Launchpad2000'
   when the folder is renamed. Check what __init__.py currently references
   and what needs to change. Do NOT move any files — just update the
   entry point. Create CHANGELOG_FROM_LP95.md with the initial fork entry."

2. "Add mode_id as a new property to M4LInterface.py following the existing
   pattern for 'mode'. Then add self._osd.mode_id = '<slug>' next to every
   self._osd.mode = or self._osd.set_mode() call in the codebase. Here is
   the complete mapping: [paste table from 1.1]. Each change is ONE additive
   line. Document every change in CHANGELOG_FROM_LP95.md."

3. "Create M4L_Devices/js/osd_bridge.js by refactoring
   reference_materials/L95_ext.js (the Launchpad98 bridge script).
   The best working OSD device is reference_materials/Launchpad95OSDHelper.amxd
   (hdavid's original) — study its approach as the gold standard.
   Also read reference_materials/LPC_Live_3_prototypes/Modern_Launchpad_OSD.amxd/
   resources/controller.js for useful patterns (retry logic, template caching).
   Refactor tasks:
   - Remove all 12 duplicate function definitions (keep second versions)
   - Read mode_id from M4LInterface first, string-match fallback only
   - Refactor att_0..att_7 into arrays
   - Add null checks, try/catch, 50ms debounce, gated logging
   - Follow CLAUDE_CODE_STYLE_GUIDE.md (ES5, post() not console.log)"

4. "Fix osd_maps/scripts/normalize_osd_templates.py: tooltip text from
   <div class='note'> and <div class='noteTop'> leaks into visible labels.
   7 of 17 templates affected. Fix the parser so visible label = only text
   outside note divs. Regenerate all JSON templates. Verify no label > 20 chars."

5. "Review all changes: osd_bridge.js, all modified .py files, all JSON
   templates. Check for: unused variables, unreachable code, missing error
   handling, mode_ids that don't match manifest.json, any altered LP95 behavior."
```

### Phase 2 (in order)

```
1. "Create osd_maps/ui_templates/launchpad_grid.html based on
   launchpad_osd_base_template.html. Also read the prototype renderer at
   reference_materials/LPC_Live_3_prototypes/Modern_Launchpad_OSD.amxd/resources/renderer.js
   for patterns (resize reporting, palette handling, pad color rendering).
   Add window.max.bindInlet handlers for loadSnapshot, setTitle, setPadColor.
   Extend setColor for MK2+ RGB. Emit window.max.outlet('ready') on load."

2. "Add pad_colors[0..63] to M4LInterface.py. Hook into _send_midi to
   capture LED velocities. Document in CHANGELOG_FROM_LP95.md."

3. "Add pad color observation to osd_bridge.js. Also read the prototype
   controller at reference_materials/LPC_Live_3_prototypes/Modern_Launchpad_OSD.amxd/
   resources/controller.js for patterns (palette loading, template caching,
   LP95 discovery with retry). Read pad_colors, convert velocity→RGB via
   mk2_palette.json, batch into Dict, send to JWeb."

4. "Create manifest.json routing table. Verify every JSON template has a
   route. Write a validation script that checks snapshot schema
   ({t: 8, g: 8×8, s: 8}) for all templates."
```

---

## Success Criteria

### Phase 1
- [ ] Fork set up, upstream remote configured
- [ ] Ableton discovers "Launchpad2000" when folder is renamed
- [ ] All LP95 functionality identical to upstream
- [ ] `mode_id` emitted for every mode in every component
- [ ] `osd_bridge.js`: zero duplicates, complete mode routing, error handling
- [ ] All 17 JSON templates: clean labels, valid schema
- [ ] `CHANGELOG_FROM_LP95.md` documents every Python change
- [ ] `git merge upstream/master` runs cleanly (test with a dry run)

### Phase 2
- [ ] JWeb grid renders all 17 templates correctly
- [ ] Mode changes propagate in < 100ms
- [ ] `pad_colors` updates when LP95 sets LED state
- [ ] Velocity → RGB matches actual Launchpad colors
- [ ] Grid device + legacy OSD can run simultaneously
- [ ] Graceful degradation if Launchpad2000 script not loaded
- [ ] Frozen .amxd loads HTML correctly

---

**End of Implementation Plan**
