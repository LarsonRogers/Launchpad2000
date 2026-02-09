{
  "patcher": {
    "fileversion": 1,
    "appversion": {
      "major": 8,
      "minor": 6,
      "revision": 0,
      "architecture": "x64"
    },
    "classnamespace": "box",
    "rect": [0, 0, 720, 480],
    "bglocked": 0,
    "openinpresentation": 1,
    "default_fontsize": 12.0,
    "default_fontface": 0,
    "default_fontname": "Arial",
    "gridonopen": 1,
    "gridsize": [15.0, 15.0],
    "gridsnaponopen": 1,
    "toolbarvisible": 1,
    "boxanimatetime": 200,
    "imprint": 0,
    "enablehscroll": 1,
    "enablevscroll": 1,
    "boxes": [
      {
        "box": {
          "id": "c1",
          "maxclass": "comment",
          "patching_rect": [20, 20, 400, 20],
          "text": "Modern Launchpad OSD (self-contained)"
        }
      },
      {
        "box": {
          "id": "t_debug",
          "maxclass": "toggle",
          "patching_rect": [20, 60, 20, 20],
          "presentation": 1,
          "presentation_rect": [20, 20, 20, 20]
        }
      },
      {
        "box": {
          "id": "c_debug",
          "maxclass": "comment",
          "patching_rect": [45, 60, 120, 20],
          "text": "Debug IDs",
          "presentation": 1,
          "presentation_rect": [45, 20, 120, 20]
        }
      },
      {
        "box": {
          "id": "m_debug",
          "maxclass": "message",
          "patching_rect": [20, 90, 80, 20],
          "text": "debug_ids $1"
        }
      },
      {
        "box": {
          "id": "t_overlay",
          "maxclass": "toggle",
          "patching_rect": [20, 130, 20, 20],
          "presentation": 1,
          "presentation_rect": [20, 50, 20, 20]
        }
      },
      {
        "box": {
          "id": "c_overlay",
          "maxclass": "comment",
          "patching_rect": [45, 130, 160, 20],
          "text": "Live LED overlay",
          "presentation": 1,
          "presentation_rect": [45, 50, 160, 20]
        }
      },
      {
        "box": {
          "id": "m_overlay",
          "maxclass": "message",
          "patching_rect": [20, 160, 80, 20],
          "text": "overlay $1"
        }
      },
      {
        "box": {
          "id": "t_mk2",
          "maxclass": "toggle",
          "patching_rect": [20, 200, 20, 20],
          "presentation": 1,
          "presentation_rect": [20, 80, 20, 20]
        }
      },
      {
        "box": {
          "id": "c_mk2",
          "maxclass": "comment",
          "patching_rect": [45, 200, 200, 20],
          "text": "Render MK2 palette (exact)",
          "presentation": 1,
          "presentation_rect": [45, 80, 200, 20]
        }
      },
      {
        "box": {
          "id": "m_mk2",
          "maxclass": "message",
          "patching_rect": [20, 230, 90, 20],
          "text": "mk2_exact $1"
        }
      },
      {
        "box": {
          "id": "js_ctrl",
          "maxclass": "js",
          "patching_rect": [300, 60, 220, 20],
          "text": "controller.js"
        }
      },
      {
        "box": {
          "id": "jweb",
          "maxclass": "jweb",
          "patching_rect": [300, 100, 380, 340],
          "presentation": 1,
          "presentation_rect": [20, 120, 660, 320],
          "name": "osd_web"
        }
      }
    ],
    "lines": [
      {"patchline": {"source": ["t_debug", 0], "destination": ["m_debug", 0]}},
      {"patchline": {"source": ["m_debug", 0], "destination": ["js_ctrl", 0]}},
      {"patchline": {"source": ["t_overlay", 0], "destination": ["m_overlay", 0]}},
      {"patchline": {"source": ["m_overlay", 0], "destination": ["js_ctrl", 0]}},
      {"patchline": {"source": ["t_mk2", 0], "destination": ["m_mk2", 0]}},
      {"patchline": {"source": ["m_mk2", 0], "destination": ["js_ctrl", 0]}}
    ]
  }
}
