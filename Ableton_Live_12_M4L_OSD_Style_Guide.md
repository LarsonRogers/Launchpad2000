
# Ableton Live 12 OSD & Max for Live Style / Architecture Guide

This document defines **architecture, coding conventions, UI patterns, and performance rules**
for building **Ableton Live 12 On‑Screen Display (OSD)** systems and **Max for Live (M4L)** devices.

It is written to be directly consumable by **LLM coding agents (e.g. Codex)** as a governing
specification.

---

## 0. Core Goals & Design Principles

### Primary Objectives
1. Deterministic UI behavior
2. Fast iteration and modularity
3. Robust Live API handling
4. Low CPU and UI overhead
5. Stable performance under stress

### Explicit Non‑Goals
- Heavy custom vector rendering
- Complex UI frameworks unless necessary
- Unbounded dynamic object creation
- Poll‑driven Live API designs

---

## 1. Project Structure & Naming Conventions

### File Layout
```
/MyDevice/
 ├─ MyDevice.amxd
 ├─ mod_ui_host.maxpat
 ├─ mod_layout.maxpat
 ├─ mod_state.maxpat
 ├─ mod_live_api.maxpat
 ├─ mod_osd_router.maxpat
 ├─ ui_section_*.maxpat
 ├─ /media/
 │   └─ *.png
 ├─ /js/
 │   └─ *.js
 └─ /dict/
     └─ *.json
```

### Naming Prefixes
| Category | Prefix |
|--------|--------|
| UI | `ui_` |
| State | `st_` |
| Layout | `ly_` |
| Live API | `la_` |
| Routing | `rt_` |
| Debug | `dbg_` |

### Scripting Name Convention (Mandatory)
```
category__module__role
```

Examples:
- `sec__mode_guide__root`
- `host__window__thispatcher`
- `ly__engine__js`

---

## 2. Canonical Architecture (Three‑Layer Model)

### Layer A — State
- Single source of truth
- Dict‑serializable
- Stores visibility, mode, sizing, Live selection state

### Layer B — Layout Engine
- Pure function
- No Live API calls
- Outputs rects and container size

### Layer C — UI Renderer
- Applies rects
- Toggles visibility
- Resizes device or window

---

## 3. Messaging Design

### Unified Internal Message Bus
Prefer **dict‑based** messaging.

Standard operations:
- `set`
- `toggle`
- `merge`
- `recompute`
- `apply`

UI → Intent → State → Layout → Render

No UI element directly mutates layout or window size.

---

## 4. Section / Component Model

### Rules
- Each collapsible UI region = **one bpatcher**
- Sections report preferred size
- Host owns visibility and placement

### Section Contract
Each section must support:
- `get_size`
- `set_width`
- `theme`
- Emit size‑changed notifications

---

## 5. UI & OSD Visual Style

### Layout Defaults
- Outer padding: 12–16 px
- Section gap: 8–12 px
- Internal padding: 6–10 px

### Typography
- Title: 14–16
- Body: 11–12
- Micro: 10 (sparingly)

### Interaction
- Immediate feedback
- No modal blocking
- Mode changes < 50ms perceived

---

## 6. Visibility & Space Collapsing

### Correct Pattern
- Hide/show **bpatchers**, not individual UI elements
- Trigger layout recompute on visibility change

### Anti‑Pattern
- Using `hidden 1` on individual UI objects without relayout

---

## 7. Dynamic Resizing Rules

### Two Sizes
1. Device UI presentation size
2. Floating window size

### Rules
- Width drives layout
- Height is computed
- Enforce min/max constraints
- One resize pipeline only

---

## 8. Layout Engine Specification

### Inputs
- container_width
- padding
- gap
- ordered sections[]

### Outputs
- rects per section
- container_height

### Vertical Stack Algorithm
```
y = padding
for section in sections:
  if visible:
    h = preferred_height(width)
    rect = (x, y, w, h)
    y += h + gap
container_height = y + padding
```

Cache results aggressively.

---

## 9. Live API Integration (Live 12)

### Golden Rules
- Event‑driven observers
- No blind polling
- All errors handled gracefully
- Centralized Live API module only

### Required Safeguards
- `change`
- `speedlim`
- Observer lifecycle management

---

## 10. JavaScript Usage (Max js)

### Appropriate Uses
- Layout computation
- Dict helpers
- Mode → asset mapping

### Rules
- Pure functions
- Deterministic output
- No timing‑dependent logic
- Debug logging gated by flag

---

## 11. Asset Management

### Naming
```
osd_mode_<id>_<name>_w###_h###.png
```

### Mapping (Single Source of Truth)
```json
{
  "modes": {
    "1": { "name": "Session", "asset": "osd_mode_01_session.png" }
  }
}
```

Missing assets must not break layout.

---

## 12. Update Scheduling

### UI Frame Rule
- Consolidate UI updates
- Use `deferlow`
- One layout apply per tick max

---

## 13. Performance Constraints

### Forbidden
- Polling < 250ms
- Unbounded console output
- Multiple competing metros

### Required
- Change detection
- Throttled UI updates
- Cached layout results

---

## 14. Testing Checklist

### Stability
- Duplicate device stress test
- Save / reload
- Track deletion safety
- Disable / enable behavior

### Visual
- No gaps after collapse
- No overlap
- Readable at all widths

---

## 15. Max Patcher Conventions

- Left‑to‑right flow
- Encapsulation via bpatchers
- Clear commenting
- Dedicated debug zone

Include version metadata in device.

---

## 16. Codex Editing Rules (Hard Constraints)

1. Do not rename scripting names
2. New UI = new bpatcher
3. No new metro without justification
4. All layout changes go through layout engine
5. No Live API calls outside `mod_live_api`
6. Visibility changes must trigger relayout
7. Declare preferred size behavior for all UI

---

## 17. Canonical Flow

```
UI Event
 → State Update
 → Layout Compute
 → UI Apply
```

Width change always precedes height computation.

---

## 18. Recommended Defaults

- Min width: 420
- Default width: 560
- Padding: 12
- Gap: 10
- Title font: 15
- Layout throttle: deferlow
- Live UI update rate: <= 30 fps

---

**End of Specification**
