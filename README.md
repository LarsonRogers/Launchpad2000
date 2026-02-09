# Launchpad2000

Launchpad2000 is a fork of [hdavid/Launchpad95](https://github.com/hdavid/Launchpad95) with additive OSD and Max for Live integration work, while preserving LP95 core behavior.

## Overview

- Base project: Launchpad95 (improved Novation Launchpad remote scripts)
- Fork goals:
  - Stable OSD bridge (`osd_bridge.js`)
  - JWeb grid renderer support
  - `mode_id` and `pad_colors` exposure via M4L interface
- Licensing remains aligned with upstream GPL-3.0 expectations

## Install as `Launchpad2000` in Ableton Live

1. Clone or download this repository.
2. Rename the folder to `Launchpad2000`.
3. Copy it into Ableton's `MIDI Remote Scripts` directory.
4. Restart Ableton Live.
5. In `Preferences -> Link/Tempo/MIDI`, select `Launchpad2000` as the Control Surface.

## Git Remotes

- `origin`: `https://github.com/LarsonRogers/Launchpad2000.git`
- `upstream`: `https://github.com/hdavid/Launchpad95.git`

## Manual Integration Guide (Max/Ableton Tasks)

Most remaining work is runtime integration and validation in Max/Ableton/hardware.

## 1. Build `Launchpad2000_Grid.amxd` in Max

Goal: create `M4L_Devices/Launchpad2000_Grid.amxd` and wire `osd_bridge.js` to `launchpad_grid.html`.

1. Create a new Max for Live MIDI Effect device.
2. Save it as `M4L_Devices/Launchpad2000_Grid.amxd`.
3. Add objects:
   - `live.thisdevice`
   - `js osd_bridge.js`
   - `jweb @url launchpad_grid.html`
   - `print osd_bridge`
4. Wire:
   - `live.thisdevice` bang output -> `js osd_bridge.js` input
   - `js osd_bridge.js` outlet 0 -> `jweb` input
   - `js osd_bridge.js` outlet 1 -> `jweb` input
   - `js osd_bridge.js` outlet 2 -> `print osd_bridge`
5. Verify these paths resolve:
   - `M4L_Devices/js/osd_bridge.js`
   - `osd_maps/ui_templates/launchpad_grid.html`
   - `osd_maps/palettes/mk2_palette.json`
   - `osd_maps/generated_templates/manifest.json`
6. Reload the device and confirm the Max Console shows bridge status without recurring errors.

## 2. Verify Script Discovery in Ableton

Goal: confirm the fork is discovered as `Launchpad2000`.

1. Ensure folder name is exactly `Launchpad2000`.
2. Place folder in the Ableton MIDI Remote Scripts directory.
3. Restart Ableton Live.
4. Open `Preferences -> Link/Tempo/MIDI`.
5. Select `Launchpad2000` from the Control Surface dropdown.
6. Confirm Launchpad initializes and baseline LP95 functionality still works.

## 3. Runtime Validation in Live

Run these tests in sequence.

### A. Template Rendering Coverage (17 templates)

1. Trigger each supported LP95 mode.
2. Confirm grid/title updates for each mode switch.
3. Confirm no missing labels, no tooltip leakage, no malformed cells.

Pass criteria:
- All templates render without JS errors.
- Layout remains stable under rapid mode switching.

### B. Mode Switch Latency

1. Switch across Session, Mixer, Instrument, Device Controller, User1/User2, and Step Sequencer modes.
2. Observe visual update delay.

Pass criteria:
- Mode transition appears immediate and remains under ~100 ms.

### C. Pad Color Mirroring

1. Trigger LED changes from LP95 workflows (clips, sequencer states, mute/solo/arm states).
2. Confirm matching grid-pad color updates in JWeb.

Pass criteria:
- Pad updates are live and continuous.
- MK2+/X/Mini MK3 colors are visually consistent with hardware intent.

### D. Legacy OSD + New Grid Coexistence

1. Load original `Launchpad95OSDHelper.amxd`.
2. Load `Launchpad2000_Grid.amxd` simultaneously.
3. Switch modes and operate normally.

Pass criteria:
- No crashes.
- No listener storms.
- No stuck or frozen UI state.

### E. Graceful Degradation

1. Load the grid device while Launchpad2000 control surface is not active.
2. Observe bridge behavior.

Pass criteria:
- Device does not hard-fail.
- Status output indicates waiting/retry behavior instead of exceptions.

### F. Frozen Device Check

1. Freeze/package `Launchpad2000_Grid.amxd` in Max.
2. Reopen in Live.

Pass criteria:
- `launchpad_grid.html` loads.
- Bridge still routes mode and pad updates.

## 4. LP95 Regression Checks

Verify additive changes did not alter upstream behavior.

- Session launch behavior unchanged
- Mixer controls unchanged
- Instrument quick-scale and scale overlays unchanged
- Device Controller behavior unchanged
- Step Sequencer workflows unchanged

Pass criteria:
- No behavior regressions versus baseline LP95.

## 5. Troubleshooting Checklist

1. If OSD does not update, verify `Launchpad2000` is selected as control surface in Live.
2. If grid renders but colors do not change, verify `pad_colors` updates propagate from Python to M4LInterface.
3. If no template loads, verify `osd_maps/generated_templates/manifest.json` path and route keys.
4. If JWeb is blank, verify `launchpad_grid.html` path and that `window.max.outlet('ready')` fires.
5. If mode routing is incorrect, verify Python `mode_id` emitters and manifest route mapping.

## 6. Manual Sign-off

- [ ] `Launchpad2000` appears in Ableton control surface list
- [ ] LP95 baseline behavior preserved
- [ ] `Launchpad2000_Grid.amxd` built and wired
- [ ] 17 templates render correctly
- [ ] Mode switch latency < 100 ms
- [ ] Pad colors mirror LED state
- [ ] Coexistence with legacy OSD verified
- [ ] Frozen device loads HTML and routes updates

## Original Launchpad95 Reference

- Legacy manual/download link from upstream context:
  - `http://motscousus.com/stuff/2011-07_Novation_Launchpad_Ableton_Live_Scripts/`
