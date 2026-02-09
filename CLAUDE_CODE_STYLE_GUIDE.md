# CLAUDE_CODE_STYLE_GUIDE.md — Max for Live & Max JS Coding Rules

<!--
AGENT COMPATIBILITY: This guide applies to ALL AI coding agents (Claude Code,
ChatGPT Codex, Cursor, etc.). The rules here are runtime constraints of the
Max for Live environment, not preferences — violating them produces broken code.
-->

This guide covers the Max for Live runtime, common pitfalls, and hard constraints.
It supplements `Ableton_Live_12_M4L_OSD_Style_Guide.md`.

**Project model**: GitHub fork of hdavid/Launchpad95. LP95 Python files stay at repo
root in their original locations. Our additions live in `M4L_Devices/`, `osd_maps/`, etc.

---

## 1. Max JS (`js` object) — NOT Node.js

The `js` object in Max uses its own embedded engine. Critically different from Node/browser.

### Language: ES5 Only (unless V8 explicitly enabled)
No `let`, `const`, arrow functions, template literals, `class`, `Promise`, destructuring,
`for...of`, `Map`/`Set`. Write `var`, `function`, string concatenation.

### Available Globals
```javascript
post("msg");              // Max console (NOT console.log)
error("msg");             // Max console error
outlet(n, value);         // Send to outlet n
new Dict("name");         // Max named dictionary
new LiveAPI(cb, "path");  // Live Object Model
new Task(fn, this);       // Scheduled callback (replaces setTimeout)
new File(path, mode);     // File I/O
new Folder(path);         // Directory listing
autowatch = 1;            // Auto-reload on save (ALWAYS SET)
```

### NOT Available
```javascript
console.log()     // → post()
require()          // No modules
import/export     // No ES6 modules
setTimeout()      // → new Task()
fetch()           // No HTTP
window/document   // No DOM (JWeb territory)
```

### LiveAPI Rules
```javascript
// ❌ Global scope — WILL FAIL
var api = new LiveAPI("live_set");

// ✅ After initialization
function bang() {
    var api = new LiveAPI("live_set");
}

// ✅ Observer with callback
function bang() {
    var api = new LiveAPI(function(args) {
        post("changed:", args[0], args[1], "\n");
    }, "live_set tracks 0");
    api.property = "mute";
}

// ⚠️ CLEANUP: set api.property = "" before discarding
// Otherwise: memory leak + ghost callbacks
```

### Task, Dict
```javascript
// Task (replaces setTimeout)
var t = new Task(function() { post("tick\n"); }, this);
t.interval = 100; t.repeat(10);

// Dict
var d = new Dict("osd_state");
d.get("mode::active_id");       // :: for nested keys
d.set("mode::active_id", "session");
```

---

## 2. JWeb ↔ Max Communication

JWeb = Chromium (CEF) inside Max. Modern JS OK inside JWeb.
Communication is **asynchronous**.

```javascript
// Max → JWeb
window.max.bindInlet("updateMode", function(modeId) { ... });
window.max.getDict("osd_state", function(dict) { ... });  // async callback!

// JWeb → Max
window.max.outlet("ready");
window.max.outlet("modeChanged", "session");
```

### Critical Rules
- **Async only** — cannot sync read/write between Max and JWeb
- **Frozen .amxd** — HTML may not load. Keep HTML adjacent to device or use `executejavascript`
- **Debug**: JWeb port 9222 → `chrome://inspect`

---

## 3. File Editing Rules

### Claude Code CAN Edit
- `.js` (Max JS, JWeb JS)
- `.json` (Dict data, templates, manifests)
- `.html` / `.css` (JWeb content)
- `.py` (LP95 Python — **additive changes only**, document in CHANGELOG)
- `.md` (documentation)
- Build/tool scripts

### Claude Code CANNOT Edit
- `.amxd` (binary header + JSON — edit in Max GUI only)
- `.maxpat` (edit in Max GUI only; reading for understanding is OK)
- Files inside a frozen .amxd

### Prototype Reference Code
`reference_materials/` contains working devices and earlier prototypes:
- `Launchpad95OSDHelper.amxd` — hdavid's WORKING OSD helper. The gold standard.
  Open in Max to study patcher structure, JS wiring, LiveAPI usage.
- `L95_ext.js` — Launchpad98 bridge script. Primary source for osd_bridge.js refactor.
- `Launchpad98OSD.amxd` — the device that L95_ext.js modifies.
- `LPC_Live_3_prototypes/Modern_Launchpad_OSD.amxd/resources/controller.js` —
  LP95 discovery, retry logic, template caching, palette loading
- `LPC_Live_3_prototypes/Modern_Launchpad_OSD.amxd/resources/renderer.js` —
  JWeb resize reporting, pad color rendering, MK2 palette support
Read these before writing `osd_bridge.js` and `launchpad_grid.html`. Adapt patterns
to the current architecture, don't copy blindly.

---

## 4. Live API Integration

### Observer-Driven, Never Poll
```javascript
// ❌ Polling
var metro = new Task(function() {
    var api = new LiveAPI("live_set");
    api.get("tempo");
}, this);
metro.interval = 100; metro.repeat(-1);

// ✅ Observe
var api = new LiveAPI(function(args) {
    var tempo = args[1];
}, "live_set");
api.property = "tempo";
```

### Control Surface Discovery
```javascript
function locateLaunchpad2000() {
    var api = new LiveAPI();
    for (var i = 0; i < 16; i++) {
        api.goto("control_surfaces " + i);
        if (!api.type) continue;
        if (api.type.toLowerCase().indexOf("launchpad") === -1) continue;
        var count = api.getcount("components");
        for (var j = 0; j < count; j++) {
            api.goto("control_surfaces " + i + " components " + j);
            if (api.type === "M4LInterface") {
                return { surface: i, component: j };
            }
        }
    }
    return null;
}
```

### Boot Retry Pattern
```javascript
var bootTask = null, bootAttempts = 0;
function loadbang() {
    bootTask = new Task(function() {
        bootAttempts++;
        var found = locateLaunchpad2000();
        if (found || bootAttempts >= 12) {
            bootTask.cancel();
            if (!found) error("Launchpad2000 not found\n");
        }
    }, this);
    bootTask.interval = 200;
    bootTask.repeat(12);
}
```

---

## 5. Performance Rules

### Forbidden
- Polling LiveAPI < 250ms
- `post()` in hot paths
- Creating new LiveAPI objects per update
- Multiple competing Tasks for same purpose
- Unbounded console output

### Required
- Gate logging: `if (LOG_ENABLED) post(...);`
- `deferlow` before UI updates in patchers
- Throttle mode changes (`speedlim` or 50ms debounce)
- Cache layout — recompute only on input change
- Batch JWeb pad color updates into single Dict snapshot

---

## 6. Python (Forked LP95 Scripts)

### Modification Rules
- **Additive only** — add lines next to existing code, never delete/rearrange
- **Document every change** in `CHANGELOG_FROM_LP95.md` (file, line, rationale)
- **LP95 behavior unchanged** — our changes ADD (mode_id, pad_colors), never ALTER
- **M4LInterface is the bridge** — all new data goes through M4LInterface properties
- **Agent-agnostic** — these rules apply whether you're Claude Code, Codex, Cursor,
  or a human. The constraints come from the runtime, not the tool.

### M4LInterface Extension Pattern
```python
# In M4LInterface.py __init__:
self._mode_id = ""
# Add getter/setter following LP95's existing pattern for 'mode'

# In each component:
self._osd.mode_id = "session"   # add NEXT TO existing self._osd.mode = "Session"
self._osd.update()
```

### Key Files
| File | Role |
|------|------|
| `__init__.py` | Entry point: `def create_instance(c_instance)` |
| `Launchpad95.py` | Main script, sets up all components |
| `M4LInterface.py` | Bridge to M4L (**our primary extension point**) |
| `MainSelectorComponent.py` | Mode switching logic |
| `Settings.py` | Launchpad model settings, note/CC maps, LED velocities |
| `StepSequencerComponent.py` | Drum step seq (combined + multinote) |
| `StepSequencerComponent2.py` | Melodic step sequencer |

### Python Pitfalls
- LP95 uses BOTH `osd.mode = "..."` AND `osd.set_mode("...")` — add `mode_id` next
  to whichever pattern each file uses
- `_Framework` imports are Ableton-internal — don't try to import outside Ableton
- Folder name = Ableton discovery name. Internal class name can be anything.

---

## 7. Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Max JS | `snake_case.js` | `osd_bridge.js` |
| HTML/JWeb | `snake_case.html` | `launchpad_grid.html` |
| JSON template | `snake_case.json` | `session_mode.json` |
| Python | `CamelCase.py` (LP95 convention) | `MainSelectorComponent.py` |
| Max patcher | `snake_case.maxpat` | `ui_section_mode_guide.maxpat` |
| mode_id slugs | `lowercase_underscored` | `drum_stepseq_combined` |
| Max scripting names | `category__module__role` | `sec__mode_guide__root` |

---

## 8. Testing Checklist

### After Any Change
1. Rename repo folder to `Launchpad2000`, verify Ableton discovery
2. Mode switch through ALL modes — not just the one you edited
3. Test OSD window open AND closed
4. Check Ableton's `Log.txt` for `RemoteScriptError`

### After Python Changes
5. Verify `mode_id` emitted for every mode
6. Verify LP95 core behavior unchanged (pads, faders, mode nav)
7. Run `git merge upstream/master --no-commit` to verify merge cleanliness

### After JWeb/Template Changes
8. Test in Max's JWeb (not standalone browser)
9. Verify `window.max` communication
10. Regenerate JSON templates, verify schema ({t:8, g:8×8, s:8})

---

## 9. Common Pitfalls

1. **Duplicate function defs** — Max JS uses last definition only
2. **LiveAPI IDs ephemeral** — never store across sessions
3. **JWeb async** — `getDict` returns via callback, not return value
4. **Frozen .amxd** — test early, HTML files may not load
5. **Max console spam** — `post()` in loops stutters Live
6. **bpatcher sizing** — content change ≠ auto-resize
7. **Moving LP95 files** — breaks upstream merge. NEVER relocate.
8. **`osd.mode` vs `osd.set_mode()`** — both patterns exist in LP95

---

**End of Style Guide**
