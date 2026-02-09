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
