# AGENTS.md — Launchpad2000

> **This file exists for ChatGPT Codex compatibility.** Codex reads `AGENTS.md`
> automatically, just as Claude Code reads `CLAUDE.md`.
>
> All project instructions live in `CLAUDE.md` — that is the canonical source of
> truth. This file summarizes the essentials and tells you where to look.

## Before Writing Any Code

Read these files in order:

1. **`CLAUDE.md`** — Architecture, constraints, file structure, mode routing, Git
   workflow. This is the instruction manual for the entire project.
2. **`CLAUDE_CODE_STYLE_GUIDE.md`** — Hard runtime rules for Max JS (ES5 only),
   JWeb async communication, LiveAPI patterns, Python modification rules. Violating
   these produces broken code — they are not style preferences.
3. **`IMPLEMENTATION_PLAN.md`** — Phased execution plan with specific prompts and
   success criteria.

## Quick Constraints (read the full docs for details)

- **Max JS = ES5 only.** No `let`, `const`, arrow functions, template literals,
  `class`, `Promise`, destructuring. Use `var`, `function`, string concatenation.
- **Max JS ≠ Node.js.** No `console.log` (use `post()`), no `require()`, no
  `setTimeout` (use `new Task()`), no `fetch()`, no `window`/`document`.
- **LiveAPI: never in global scope.** Wait for `loadbang` or `live.thisdevice` bang.
- **LiveAPI: observer-driven, never poll.** Use `api.property = "name"` with callbacks.
- **JWeb ↔ Max: async only.** `window.max.getDict()` returns via callback.
- **Python changes: additive only.** Add lines next to existing LP95 code, never
  delete or rearrange. Document every change in `CHANGELOG_FROM_LP95.md`.
- **LP95 files stay at repo root.** Never move them — this breaks upstream merge.
- **Never edit .amxd or .maxpat files.** These are binary/JSON hybrids that must
  be edited in the Max GUI. Edit `.js`, `.json`, `.html`, `.py`, `.md` only.
- **Gate all debug output.** `if (LOG_ENABLED) post(...);` — never bare `post()`
  in hot paths.

## Project Summary

Launchpad2000 is a GitHub fork of `hdavid/Launchpad95` (GPL-3.0) that adds:
- `mode_id` as a proper M4LInterface property
- A JWeb live grid renderer with real-time pad colors
- A refactored, stable OSD bridge (`osd_bridge.js`)

The LP95 Python files live at the repo root in their original locations so that
`git merge upstream/master` works cleanly. Our additions live in separate
directories: `M4L_Devices/`, `osd_maps/`, `Reference_materials/`.

## File Editing Rules

| Can edit | Cannot edit |
|----------|------------|
| `.js` (Max JS, JWeb JS) | `.amxd` (edit in Max GUI) |
| `.json` (Dict data, templates) | `.maxpat` (edit in Max GUI) |
| `.html` / `.css` (JWeb content) | Files inside frozen .amxd |
| `.py` (additive changes only) | |
| `.md` (documentation) | |
