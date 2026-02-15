# CHANGELOG_FROM_LP95

## 2026-02-14 - Stabilize Instrument OSD LED mirror in Max bridge

- File changed: `Launchpad.py`
- Change type: Instrument-mode MK1 pad mapping hardening
- Details:
  - In `_update_pad_colors_from_midi(...)`, added an Instrument MK1 fast-path that maps note LEDs directly to static MK1 grid indices (`0..7,16..23,...`) and bypasses dynamic note-map fallback cache lookups.
  - This prevents stale dynamic remap bleed from writing Instrument LED updates to incorrect pad indices.
  - Added channel-15 static-grid fallback in dynamic note mapping (notably for MK2/MK3/LPX feedback paths) so note LEDs that arrive on channel 15 still resolve to a pad index.
  - Added a second static-grid fallback for MK2/MK3/LPX when dynamic lookup fails entirely (before dropping the LED update), covering physical-grid feedback note IDs.
  - Added targeted debug logs for active-note propagation:
    - `LP2000 HW MODEL ...` during init to confirm runtime hardware classification.
    - `LP2000 ACTIVE NOTE MAP ...` in `_update_pad_colors_from_midi(...)` (note/channel/index/velocity, MK2 flag).
    - `LP2000 ACTIVE NOTE MISS ...` when a non-zero dynamic note LED cannot be mapped to a pad index.
    - `LP2000 ACTIVE PAD WRITE ...` in `_update_pad_color_from_index(...)` when Instrument mode writes a non-zero velocity.
  - Fixed `_use_dynamic_note_map()` gating to treat active Instrument `mode_id` as authoritative and to resolve `USER_MODES_1[sub_index] == "instrument"` instead of assuming a fixed sub-index value. This keeps Instrument LED updates on the dynamic mapping path.
  - Added dynamic feedback mirror path from inbound MIDI:
    - New `receive_midi(...)` hook calls `_mirror_dynamic_feedback_from_input(...)` before delegating to `ControlSurface.receive_midi(...)`.
    - `_mirror_dynamic_feedback_from_input(...)` resolves incoming note/channel to pad index via dynamic note maps and applies note-on/note-off state as pad overrides in Instrument mode.
    - Added `_set_pad_feedback_override(...)` to store/clear temporary active-note overlays and restore base pad color on note-off.
    - Added `_instrument_feedback_velocity()` to map active-note overlay color to current feedback velocity skin entries.
    - Added `LP2000 ACTIVE NOTE MAP ... src=input` log line for inbound mapped feedback events.
  - Added active-note source tagging for Instrument mode:
    - `src=output` logging on mapped dynamic output LED messages (including MK1 fast-path and dynamic resolution path).
    - `src=output` tagging on dynamic map misses.
  - Added API fallback path for active-note highlighting when Live bypasses script input:
    - Installed `current_song_time` listener in `Launchpad` init.
    - Added `_update_active_notes_from_api()` to read currently playing clip notes on the Instrument track and derive active pad indices from the dynamic note map.
    - Added temporary overlay application/removal for API-active pads via `_set_pad_feedback_override(...)`.
    - Added `LP2000 ACTIVE NOTE MAP src=api ...` diagnostic when API active-pad set changes.
    - Added cleanup for listeners and clip bindings in `disconnect()`.

- File changed: `M4LInterface.py`
- Change type: Additive M4LInterface property extension
- Details:
  - Added `active_note_source` property (`none|input|output|api`) so bridge/JWeb can report which boundary currently drives active-note mapping.

- File changed: `ConfigurableButtonElement.py`
- Change type: Instrument dynamic-mode cache contamination guard
- Details:
  - Added `_should_precache_pad_mirror()` and gated pre-send pad cache writes in:
    - `send_value(...)`,
    - `_do_send_on_value(...)`,
    - `_do_send_off_value(...)`.
  - In dynamic Instrument mapping, pad cache pre-writes are skipped so cache mirrors actual outgoing/incoming LED state rather than stale pre-send values.

- File changed: `M4L_Devices/js/osd_bridge.js`
- File changed: `M4L_Devices/Launchpad2000_Grid/resources/osd_bridge.js`
- Change type: OSD bridge cache + LiveAPI list normalization fix
- Details:
  - Added `normalize_velocity_list(...)` to coerce `pad_colors` (64) and `button_colors` (16) into fixed-length numeric arrays, handling LiveAPI metadata/prefix atoms robustly.
  - Updated `update(...)` to use normalized arrays before writing `last_pad_colors` / `last_button_colors` and before pushing to JWeb.
  - Added `reset_velocity_cache()` and called it in `send_snapshot_to_jweb(...)` after loading a new snapshot so template repaint cannot suppress LED re-application due stale "already-sent" velocity cache.
  - Replaced continuous force repaint with proper cache invalidation:
    - mode/submode repaint signature tracking (`mode_id` + mode text for Instrument/StepSeq whitelist),
    - one-shot `reset_velocity_cache()` when signature changes, then normal diffing resumes.
  - Hardened repaint signatures against transient `mode=0` / blank mode text by retaining the last non-empty mode text, preventing false invalidation cycles like `instrument|` that could momentarily zero UI colors.
  - Hardened mode resolution against transient LiveAPI `mode_id` blanks by keeping the last canonical `mode_id` instead of immediately falling back to mode-string parsing.
  - Temporary stopgap: Step Sequencer modes were added to the repaint-signature whitelist alongside Instrument modes.
  - Added targeted JS diagnostics in `update(...)`:
    - `LP2000 OSD TRACE invalidate sig=...` when cache invalidation triggers,
    - `LP2000 OSD TRACE mode_id=... pads=... top=...` probe values from `pad_colors`/`button_colors` after `updateML` (plus hardware model, max velocity, and pad deltas).
    - OSD probe line now includes `src=...` from `M4LInterface.active_note_source` on every logged update.
  - Added mode stabilization in bridge mode routing (`settle_mode_id`): new mode_id must appear in two consecutive updates before switching, preventing one-frame bleed into session/device while Instrument remains active.
  - Added hold-frame color protection: when a candidate mode_id is being held (not yet stable), bridge now reuses last stable pad/button arrays and ignores the transient frame payload (`hold_colors`), preventing one-frame state bleed into Instrument.
  - Set `LOG_ENABLED = 1` in `osd_bridge.js` for this debugging cycle so probe lines are written to `L95_log.txt` without manual toggling.
  - Fixed `osd_bridge.js` file logging to append reliably (`readwrite` + seek EOF). This avoids single-line overwrite behavior seen in `L95_log.txt`.
  - Extended `osd_bridge.js` logging to also append to the shared Remote Scripts `log.txt` path (plus OneDrive/Documents variant), so Python and Max bridge traces can be viewed in one place.
  - This targets Instrument-mode OSD divergence where hardware LEDs changed but JWeb retained template/stale cells.

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

## 2026-02-14 - Fix Instrument OSD LED mirror divergence and add trace logging

- File changed: `Launchpad.py`
- Change type: Instrument-mode cache path correction + additive diagnostics
- Details:
  - Added a temporary 30-second LED trace window in `_send_midi()` (active when `Settings.LOGGING` is enabled and instrument dynamic mapping is active):
    - logs outgoing bytes, message type/channel, whether cache update path was called, and pad/button cache delta counts.
  - In `_update_pad_colors_from_midi()` dynamic (instrument) branch:
    - removed channel-gated override/base split that treated many instrument LED updates as transient overlays.
    - removed the unconditional fallback disable that prevented note-only fallback in dynamic note mapping.
    - now mirrors each mapped dynamic note LED message directly to the pad cache via `_update_pad_color_from_index(...)`.
    - clears stale per-pad override flags before applying the mirrored value.
  - Added `import time` for bounded trace timing.

## 2026-02-14 - Enable debug log file by default

- File changed: `Settings.py`
- Change type: Default debug behavior
- Details:
  - Set `LOGGING = True` so `Log.py` writes `log.txt` by default without requiring manual flag changes.

## 2026-02-14 - Add multi-path log file fallbacks

- File changed: `Log.py`
- Change type: Additive logging reliability
- Details:
  - Added fallback log targets:
    - `~/Documents/Ableton/User Library/Remote Scripts/log.txt`
    - `~/OneDrive/Documents/Ableton/User Library/Remote Scripts/log.txt`
    - script-local `log.txt` in the loaded Remote Script folder
  - Added safe append/write helpers so logging failures at one path do not block writes to others.
  - Startup log separator and runtime `log(...)` entries now write to all configured targets.

## 2026-02-14 - Normalize LiveAPI list parsing in OSD bridge

- Files changed:
  - `M4L_Devices/js/osd_bridge.js`
  - `M4L_Devices/Launchpad2000_Grid/resources/osd_bridge.js`
- Change type: Additive bridge parsing hardening
- Details:
  - Updated `api_get_list(...)` to normalize LiveAPI responses that can arrive as:
    - array-like atom lists
    - scalar values
    - encoded strings
  - Added optional removal of a leading property-name token (when present in LiveAPI responses).
  - This keeps `pad_colors` and `button_colors` indexing aligned for JWeb rendering.

## 2026-02-14 - Extend instrument LED trace at cache write boundary

- File changed: `Launchpad.py`
- Change type: Additive diagnostics
- Details:
  - Added trace lines in `_update_pad_color_from_index(...)` and `_update_button_color_from_index(...)` while the 30-second instrument trace window is active.
  - Logs include cache index/value writes (`pad_cache`, `button_cache`) to verify whether note/button activity reaches `M4LInterface` arrays even when outgoing MIDI message traces are sparse.

## 2026-02-10 - Precreate pad dictionaries for Max dictwrap

- File changed: `M4L_Devices/js/osd_bridge.js`
- Change type: Additive dictionary creation
- Details:
  - Pre-create per-pad dictionaries (`g00..g77`, `t0..t7`, `s0..s7`) on load to avoid `dictwrap` errors when patchers access them before LED updates.
  - Populate per-pad dicts with `r/g/b` values alongside the existing `osd_pad_colors` and `pad_rgb` dicts.
  - Force dictionary creation at script load (not just `loadbang`) so patcher dictwrap objects can bind immediately.
  - Add a short JWeb boot retry task that re-sends snapshot/pad colors until the UI is ready, so the grid doesn't start grey.
  - During JWeb boot retries, call `update()` to pull fresh pad/button colors from LiveAPI before re-sending.
  - Ensure the initial `ensure_pad_dict()` call occurs after pad dict names are defined, preventing unnamed dict creation.

## 2026-02-10 - Refresh OSD state after init, gate instrument overlays

- File changed: `Launchpad.py`
- Change type: Additive OSD refresh
- Details:
  - Added a delayed `_refresh_osd_state()` after init to force a resend of LED states, helping the JWeb grid populate when it loads after the control surface.
  - In instrument mode, only apply note overlays when the incoming LED velocity exceeds the base layout value; if the value drops to the base, clear the overlay. This avoids layout bleed from conflicting note messages.
  - Treat instrument base-layout LEDs as channel `base_channel + 4` and route those to the base layer while leaving feedback channels for the active-note overlay.
  - Cache outgoing LED values even before `M4LInterface` exists, so the grid can populate immediately after the device UI loads.

## 2026-02-11 - Fix instrument dynamic pad-color mapping fallback ambiguity

- File changed: `Launchpad.py`
- Change type: Additive dynamic resolution hardening + gated diagnostics
- Details:
  - Added `_allow_dynamic_note_only_fallback(channel)` and `_debug_dynamic_note_resolution(...)`.
  - Added `self._dynamic_note_map_debug = False` (off by default) to keep dynamic mapping diagnostics fully gated unless explicitly enabled.
  - In dynamic note mapping paths (`_pad_index_from_note` and `_update_pad_colors_from_midi`), changed resolution order to:
    - channel-aware cache lookup (`(note, channel)` key) first
    - channel-aware matrix lookup (`note + channel`) second
  - note-only fallbacks only when channel metadata is unavailable
  - This prevents incorrect note-only fallback hits when Instrument mode intentionally duplicates note identifiers across channels.
  - Non-dynamic/static pad mapping behavior is unchanged, preserving upstream LP95 mode behavior outside Launchpad2000's additive OSD/dynamic mapping extensions.

## 2026-02-11 - Refine dynamic fallback gating to preserve OSD rendering

- File changed: `Launchpad.py`
- Change type: Additive ambiguity-aware fallback gate
- Details:
  - Added `_is_dynamic_note_ambiguous(note)` to detect when a note maps to multiple pad indices in the current dynamic cache/matrix.
  - Updated `_allow_dynamic_note_only_fallback(...)` to allow note-only fallback when channel is missing/unparseable OR when the note is unambiguous.
  - This keeps strict channel-first behavior for ambiguous Instrument-note cases while restoring safe fallback behavior for unique-note paths, preventing blank OSD grids when strict channel matching is unavailable.

## 2026-02-11 - Improve button LED mirroring and instrument note feedback visibility

- File changed: `ConfigurableButtonElement.py`
- Change type: Additive button-color forwarding
- Details:
  - In `_do_send_on_value()` / `_do_send_off_value()`, when on/off states are integer MIDI values, mirror those values to OSD caches (`_update_button_color_from_index` / `_update_pad_color_from_index`) before forwarding MIDI.
  - This improves reliability of top/side button color mirroring for controls that use direct integer on/off values.

- File changed: `Launchpad.py`
- Change type: Additive dynamic feedback fallback refinement
- Details:
  - In `_update_pad_colors_from_midi()`, resolve `non_feedback_channel` before dynamic fallback decisions.
  - Keep base-layout (`non_feedback_channel`) path channel-aware for dynamic note resolution.

## 2026-02-11 - Refine startup top/side colors and dynamic channel-map stability

- File changed: `M4L_Devices/Launchpad2000_Grid/resources/osd_bridge.js`
- Change type: Additive snapshot handling fix
- Details:
  - Updated `snapshot_labels_only()` to preserve top/side template cell colors (`t`/`s`) while still stripping grid (`g`) colors.
  - This restores expected initial coloring for top/side controls before live LED state arrives.

- File changed: `ConfigurableButtonElement.py`
- Change type: Additive dynamic mapping synchronization
- Details:
  - Added `set_channel()` override to refresh `_update_note_to_pad_index(...)` using the current identifier whenever a button's channel changes.
  - This keeps dynamic `(note, channel)` pad mappings aligned when instrument channel assignments change without identifier changes.

- File changed: `Launchpad.py`
- Change type: Dynamic fallback rollback
- Details:
  - Removed feedback-channel-specific note-only fallback in `_update_pad_colors_from_midi()`.
  - This prevents reintroducing wrong-pad mappings in ambiguous duplicate-note instrument layouts while retaining strict channel-first resolution.

## 2026-02-11 - Fix startup button wipe and dynamic overlay suppression

- File changed: `M4L_Devices/Launchpad2000_Grid/resources/osd_bridge.js`
- Change type: Additive startup guard
- Details:
  - Added `button_nonzero_seen[]` tracking in `push_button_colors_to_jweb()`.
  - Skip initial zero button-color writes until a button has emitted a nonzero LED value at least once, preventing startup template colors from being immediately wiped to grey.

- File changed: `Launchpad.py`
- Change type: Dynamic map/overlay correction
- Details:
  - Added `_dynamic_pad_index_to_note_key` bookkeeping to prune stale `(note, channel)` keys when a pad's dynamic mapping changes.
  - Reset this bookkeeping in `clear_pad_colors()`.
  - In dynamic feedback overlay handling, removed `val <= base_val` suppression so nonzero played/held-note feedback is always visible and still restored on note-off.

## 2026-02-11 - Instrument channel-strict overlay resolution and template-preserving buttons

- File changed: `Launchpad.py`
- Change type: Dynamic mapping strictness refinement
- Details:
  - In `_update_pad_colors_from_midi()` dynamic branch, disable note-only fallback whenever a MIDI channel is present.
  - Keep resolution channel-aware (`(note, channel)` map + matrix channel match) to prevent wrong-pad overlays in instrument views.

- File changed: `M4L_Devices/Launchpad2000_Grid/resources/osd_bridge.js`
- Change type: Button color override refinement
- Details:
  - In `push_button_colors_to_jweb()`, ignore zero button-color updates (only mirror nonzero values).
  - Prevents Live's zeroed button arrays from wiping top/side template colors (e.g. right-side top buttons) during instrument mode transitions.

## 2026-02-11 - Stabilize top-button startup colors and keep instrument clear grid-scoped

- File changed: `Launchpad.py`
- Change type: Additive grid-clear refinement
- Details:
  - Updated `clear_pad_grid_colors()` to clear only the 8x8 pad grid state/dynamic mappings and leave top/side button color state intact.
  - This prevents Instrument-mode transitions from blanking top-button colors in the OSD.

- Files changed: `M4L_Devices/js/osd_bridge.js`, `M4L_Devices/Launchpad2000_Grid/resources/osd_bridge.js`
- Change type: Additive startup zero-gating correction
- Details:
  - Restored `button_nonzero_seen[]` gating in `push_button_colors_to_jweb()`: ignore zero writes only before a button has ever emitted nonzero.
  - After first nonzero, allow both nonzero and zero updates so per-button cache does not get stuck and mode transitions can repaint correctly.
