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
