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
