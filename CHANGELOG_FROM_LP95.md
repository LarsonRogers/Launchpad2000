# CHANGELOG_FROM_LP95

## 2026-02-09 - Initial Launchpad2000 Fork Setup

- File changed: `__init__.py`
- Change type: Entry-point update for fork identity
- Details:
  - Updated import alias from `Launchpad` to `Launchpad2000`:
    - `from .Launchpad import Launchpad as Launchpad2000`
  - Updated `create_instance()` to return `Launchpad2000(c_instance)`.
  - No file moves or Python logic rewrites; only entry-point naming for fork clarity when installed as `Launchpad2000`.

### Fork Baseline Metadata

- Upstream project: `hdavid/Launchpad95` (GPL-3.0)
- Local repository root commit (oldest available): `f800574fe70dc967929ffa8c3af9bc2c4fe40e32` (`2012-11-26`, `initial commit of Launchpad95`)
- Note: an `upstream` git remote is not configured in this local checkout yet, so no remote merge-base hash is recorded here.

## 2026-02-09 - Add `mode_id` to M4LInterface and OSD mode emitters

- File changed: `M4LInterface.py`
- Change type: Additive M4LInterface property extension
- Details:
  - Added `self.mode_id = ''` in `__init__`, following the existing direct-attribute pattern used for `self.mode`.

- File changed: `SpecialSessionComponent.py`
- Details:
  - Added `self._osd.mode_id = "session"` next to `self._osd.mode = "Session"` in `_update_OSD()`.

- File changed: `InstrumentControllerComponent.py`
- Details:
  - Added `self._osd_mode_id_backup = "instrument"` state field.
  - Added backup/restore for `mode_id` during temporary scale overlay:
    - `self._osd_mode_id_backup = self._osd.mode_id`
    - `self._osd.mode_id = "instrument_scale"`
    - `self._osd.mode_id = self._osd_mode_id_backup`
  - Added `self._osd.mode_id = "instrument_quick_scale"` next to `self._osd.mode = "Instrument (quick scale)"`.
  - Added `self._osd.mode_id = "instrument"` next to `self._osd.mode = "Instrument"`.

- File changed: `DeviceControllerComponent.py`
- Details:
  - Added `self._osd.mode_id = "device_controller"` next to `self._osd.mode = "Device Controller"` in `_update_OSD()`.

- File changed: `DeviceControllerStripServer.py`
- Details:
  - Added `self._parent._osd.mode_id = "device_controller"` next to `self._parent._osd.mode = "Device Controller"` in `_custom_update_OSD()`.

- File changed: `SpecialMixerComponent.py`
- Details:
  - Added `self._osd.mode_id = "mixer"` next to `self._osd.mode = "Mixer"` in `_update_OSD()`.

- File changed: `MainSelectorComponent.py`
- Details:
  - Added `self._osd.mode_id = "user1"` next to `self._osd.mode = "User 1"`.
  - Added `self._osd.mode_id = "user2"` next to `self._osd.mode = "User 2"`.

- File changed: `StepSequencerComponent.py`
- Details:
  - Added `self._osd.mode_id = "drum_stepseq_multinote"` next to `self._osd.set_mode('Drum Step Sequencer (multinote)')`.
  - Added `self._osd.mode_id = "drum_stepseq_combined"` next to `self._osd.set_mode('Drum Step Sequencer')`.
  - Added `self._osd.mode_id = "drum_stepseq_scale"` next to `self._osd.set_mode('Scale')`.

- File changed: `StepSequencerComponent2.py`
- Details:
  - Added `self._osd.mode_id = "melodic_stepseq"` next to `self._osd.set_mode('Melodic Step Sequencer')`.

## 2026-02-09 - Fix OSD template normalization label leakage

- File changed: `osd_maps/scripts/normalize_osd_templates.py`
- Change type: Parser fix for note-tooltip exclusion
- Details:
  - Replaced note suppression from a tag-name stack (`_note_stack`) to depth tracking (`_note_depth`) so nested tags inside `<div class="note">` / `<div class="noteTop">` do not prematurely re-enable text capture.
  - Added `VOID_TAGS` handling to avoid depth drift on void elements like `<br>`.
  - Reset note depth at cell close (`</td>`/`</th>`) to prevent leakage across malformed cell content.
  - Added `handle_startendtag` no-op for explicit self-closing tags.

- Regenerated templates in `osd_maps/json_templates/` using:
  - `python3 osd_maps/scripts/normalize_osd_templates.py`
- Verification:
  - All 17 JSON templates present.
  - No snapshot label exceeds 20 characters.

## 2026-02-09 - Add `pad_colors[0..63]` bridge data and MIDI capture hook

- File changed: `M4LInterface.py`
- Change type: Additive M4LInterface data extension
- Details:
  - Added `self.pad_colors = [0 for _ in range(64)]` to expose a 64-pad row-major LED velocity buffer for Max/JWeb consumers.

- File changed: `Launchpad.py`
- Change type: Additive MIDI observation hook
- Details:
  - Added `_pad_index_from_note(note)` helper to map Launchpad grid note numbers to row-major pad indices:
    - MK1 note layout (`row * 16 + col`)
    - MK2/MK3/LPX note layout (`81..88`, `71..78`, ... `11..18`)
  - Added `_update_pad_colors_from_midi(midi_bytes)` helper to watch outgoing note-on LED messages (`0x90`) and store velocity values into `self._osd.pad_colors[index]`.
  - Updated `_send_midi(...)` to call `_update_pad_colors_from_midi(midi_bytes)` only after successful MIDI send.
  - Added a debounced update scheduler:
    - `_schedule_pad_colors_update()` coalesces repeated LED changes into one scheduled update tick.
    - `_flush_pad_colors_update()` performs the actual `self._osd.update()`.
  - This preserves live updates while reducing high-frequency UI update pressure.

## 2026-02-09 - Fix M4LInterface disconnect listener field name

- File changed: `M4LInterface.py`
- Change type: Listener cleanup bug fix
- Details:
  - Fixed `disconnect()` to clear `self._updateML_listener` (actual field in use) instead of the misspelled/non-existent `self._updateM4L_listener`.

## 2026-02-09 - Add Phase 2.5 pad mapping validator

- File changed: `osd_maps/scripts/validate_pad_mapping.py`
- Change type: Additive validation script
- Details:
  - Added a dedicated mapping validator that checks:
    - `launchpad_grid.html` exposes all 64 expected pad IDs (`g00..g77`).
    - `osd_bridge.js` uses row/column to DOM ID mapping in `gRC` format.
    - MK1 and MK2-family note-to-index conversion formulas are internally consistent for all 64 pads.
  - Script exits non-zero on mapping errors to support CI/manual validation in Phase 2.5.

## 2026-02-09 - Guard OSD availability during early hardware challenge

- File changed: `Launchpad.py`
- Change type: Additive startup guard
- Details:
  - Initialized `self._osd = None` in `__init__` so `_update_pad_colors_from_midi()` can safely run during the early `_send_challenge()` path before `init()` creates the M4LInterface instance.

## 2026-02-09 - Add screenshots_dir to M4LInterface for OSD bridge

- File changed: `M4LInterface.py`
- Change type: Additive property for LiveAPI consumers
- Details:
  - Added `self.screenshots_dir = ''` in `__init__` so Max JS can query the property without LiveAPI errors (used by `osd_bridge.js`).

## 2026-02-09 - Expose hardware_model for palette selection

- File changed: `M4LInterface.py`
- Change type: Additive property for LiveAPI consumers
- Details:
  - Added `self.hardware_model = ''` in `__init__` to expose the detected Launchpad model to Max JS.

- File changed: `Launchpad.py`
- Change type: Additive hardware metadata
- Details:
  - Set `self._osd.hardware_model` during `init()` based on detected hardware flags (`mk1`/`mk2`/`mk3`/`lpx`).

## 2026-02-09 - Improve pad mapping for instrument mode LEDs

- File changed: `Launchpad.py`
- Change type: Additive mapping cache
- Details:
  - Added `self._note_to_pad_index` cache and prefilled it for grid buttons at init.
  - Added `_update_note_to_pad_index()` and used it in `_pad_index_from_note()` to map dynamic identifiers.

- File changed: `ConfigurableButtonElement.py`
- Change type: Additive identifier hook
- Details:
  - Overrode `set_identifier()` to update the control surface note→pad mapping when identifiers change (e.g., instrument mode).

## 2026-02-09 - Add Pro Session mode_id routing for OSD

- File changed: `SpecialProSessionComponent.py`
- Change type: Additive OSD mode updates
- Details:
  - Added `_resolve_pro_mode_id()` to map pro-session submodes.
  - Added `_update_OSD()` override to set `mode`/`mode_id` when pro session is active.

## 2026-02-09 - Improve OSD mode accuracy and LED clearing

- File changed: `SpecialProSessionComponent.py`
- Change type: Adjust pro-session submode selection
- Details:
  - Restrict submode `mode_id` selection to active button presses only (avoid sticky launch quantization/record-mode states).

- File changed: `MainSelectorComponent.py`
- Change type: Additive OSD refresh
- Details:
  - Call `_session._update_OSD()` after session setup to ensure OSD reflects pro-session toggle state.

- File changed: `Launchpad.py`
- Change type: Additive LED state handling
- Details:
  - Process note-off messages (or note-on velocity 0) in `_update_pad_colors_from_midi()` to clear stale pad colors between modes.

## 2026-02-10 - Use static vs dynamic pad maps to prevent cross-mode bleed

- File changed: `Launchpad.py`
- Change type: Additive mapping selection
- Details:
  - Added `_use_dynamic_note_map()` to enable dynamic note-to-pad mapping only when the instrument controller is active.
  - `_pad_index_from_note()` now selects between `_dynamic_note_to_pad_index` and `_static_note_to_pad_index` before falling back to legacy mapping.
  - `_update_note_to_pad_index()` now updates the dynamic map alongside the legacy cache.

## 2026-02-10 - Track top/side LED colors and clear instrument bleed

- File changed: `M4LInterface.py`
- Change type: Additive UI state
- Details:
  - Added `button_colors` array (16 slots: top row + side column) for OSD color updates.

- File changed: `Launchpad.py`
- Change type: Additive LED capture and reset
- Details:
  - Captured top/side LED colors from outgoing MIDI (CC + side-note LEDs) into `button_colors`.
  - Added `clear_pad_colors()` to reset OSD colors and dynamic map when leaving instrument mode.
  - Ignore unmapped notes in dynamic (instrument) mode to prevent session LED overlap.
  - Use channel-aware dynamic mapping so instrument notes and UI overlays do not collide.
  - Added a note-only fallback map for dynamic notes and avoid overwriting it with non-feedback channel 15.
  - Added `clear_pad_grid_colors()` to clear grid colors without touching button colors.
  - Prefer the note-only dynamic map before channel-aware lookup to keep instrument pads aligned when channel metadata is missing or inconsistent.
  - Added a matrix scan fallback to resolve dynamic note→pad mapping when cached maps are out of sync.
  - Treat channel 15 (non-feedback) LED updates as static grid notes to align instrument UI with device output.
  - Match matrix scan by both note and channel and prefer channel-aware mapping before note-only fallback.
  - Added direct pad color updates from grid buttons and skip note-mapped updates in instrument mode.

- File changed: `ConfigurableButtonElement.py`
- Change type: Additive OSD updates
- Details:
  - When a grid button sends an integer LED value, update the OSD pad color directly using the pad index.

- File changed: `ConfigurableButtonElement.py`
- Change type: Additive note mapping metadata
- Details:
  - Pass the current MIDI channel to the control surface when identifiers change so note-to-pad mapping can be channel-aware.

- File changed: `MainSelectorComponent.py`
- Change type: Additive mode cleanup
- Details:
  - Track instrument controller active state and clear OSD pad/button colors when instrument mode is disabled.
  - Clear OSD pad/button colors when instrument mode is enabled to avoid mixed view with previous mode.
  - Use `clear_pad_grid_colors()` so top/side button colors remain intact.

- File changed: `M4L_Devices/js/osd_bridge.js`
- Change type: Additive UI syncing
- Details:
  - Read `button_colors` from LiveAPI and apply to top/side buttons in the grid UI.
  - Clear template colors (t/s/g) on snapshot load to avoid stale color bleed between modes.
  - Reapply current pad/button colors immediately after snapshot load to prevent the grid from reverting to grey.
  - Do not force template colors to black (remove `color` from snapshot cells) so live pad colors are not wiped after label loads.
  - Keep top/side template colors (t/s) while stripping grid colors (g), so button labels can show intended colors even when hardware LEDs are not updating.

## 2026-02-10 - Add instrument note overlay and pad_rgb mirror

- File changed: `Launchpad.py`
- Change type: Additive LED overlay tracking
- Details:
  - Added `_pad_base_colors`, `_pad_override_active`, `_pad_override_colors` buffers to preserve layout colors in instrument mode.
  - `clear_pad_colors()` now resets the base/override buffers alongside the LiveAPI arrays.
  - `_update_pad_color_from_index()` stores base values and avoids overwriting active note overlays.
  - `_update_pad_colors_from_midi()` now applies temporary overrides for instrument-mode note feedback (note-on/off) and restores the base color after note-off.
  - Added `_update_button_color_from_index()` helper and `_lp_button_index` assignments for top/side buttons so UI button LEDs update without relying on MIDI echo.

- File changed: `ConfigurableButtonElement.py`
- Change type: Additive OSD updates
- Details:
  - When a button has `_lp_button_index`, integer LED updates are forwarded to the control surface to update `button_colors`.

- File changed: `M4L_Devices/js/osd_bridge.js`
- Change type: Additive dictionary mirroring
- Details:
  - Added a `pad_rgb` dictionary mirror (`g00::r/g/b`, `t0::r/g/b`, `s0::r/g/b`) to satisfy `dictwrap pad_rgb` consumers and eliminate missing-dict console errors.

## 2026-02-10 - Precreate pad dictionaries for Max dictwrap

- File changed: `M4L_Devices/js/osd_bridge.js`
- Change type: Additive dictionary creation
- Details:
  - Pre-create per-pad dictionaries (`g00..g77`, `t0..t7`, `s0..s7`) on load to avoid `dictwrap` errors when patchers access them before LED updates.
  - Populate per-pad dicts with `r/g/b` values alongside the existing `osd_pad_colors` and `pad_rgb` dicts.
