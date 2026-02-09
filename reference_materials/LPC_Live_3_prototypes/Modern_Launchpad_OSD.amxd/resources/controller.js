autowatch = 1;
post("Modern_Launchpad_OSD: controller.js LOADED\n");

// Max JS controller for the Modern Launchpad OSD.
// - Loads HTML UI + template/palette data.
// - Finds the Launchpad95 OSD component via LiveAPI.
// - Streams template + LED overlay payloads into the embedded JWeb view.

var jweb = null;           // reference to the [jweb] UI object in the patcher
var osdApi = null;         // LiveAPI reference to the OSD component
var manifest = null;       // routing + template metadata
var palette = null;        // MK2 palette lookup (index -> [r,g,b])
var templates = {};        // in-memory cache of parsed templates
var resourcesPath = null;  // computed "resources/" path for this device
var repoTemplatesPath = null; // optional repo template path for dev builds
var lastTemplateKey = null;
var paletteSent = false;
var lastUpdateMs = 0;
var errorFlags = {};       // used to avoid spamming Max console
var retryTask = null;      // Task for retrying OSD discovery
var retryAttempts = 0;
var retryIntervalMs = 1000;
var maxRetryIntervalMs = 8000;

// UI rendering options we can toggle from Max.
var opts = {
  debugIds: false,
  overlay: true,
  mk2Exact: true,
};

// Avoid repeating the same error message multiple times.
function logOnce(key, message) {
  if (errorFlags[key]) return;
  errorFlags[key] = true;
  post(message + "\n");
}

function loadbang() {
  init();
}

// Bootstraps the UI and loads static resources once per device instance.
function init() {
  resolveResourcesPath();
  jweb = this.patcher.getnamed("osd_web");
  if (jweb) {
    jweb.message("read", resourcesPath + "launchpad_osd_base_template.html");
  } else {
    logOnce("no_jweb", "Modern_Launchpad_OSD: jweb named 'osd_web' not found.");
  }
  manifest = readJson(resourcesPath + "manifest.json");
  palette = readJson(resourcesPath + "mk2_palette.json");
  if (!manifest) {
    logOnce("manifest", "Modern_Launchpad_OSD: manifest.json missing or invalid.");
  }
  if (!palette) {
    logOnce("palette", "Modern_Launchpad_OSD: mk2_palette.json missing or invalid.");
  }
  startRetryingFindOSD();
}

// Compute absolute path to the device's "resources/" directory so
// all file reads work regardless of the device install location.
function resolveResourcesPath() {
  var patchPath = this.patcher.filepath || "";
  var lastSlash = Math.max(patchPath.lastIndexOf("/"), patchPath.lastIndexOf("\\"));
  var baseDir = patchPath;
  if (lastSlash >= 0) {
    baseDir = patchPath.slice(0, lastSlash + 1);
  }
  resourcesPath = baseDir + "resources/";
  resolveRepoTemplatesPath();
}

function resolveRepoTemplatesPath() {
  var markerPosix = "/devices/Modern_Launchpad_OSD.amxd/";
  var markerWin = "\\devices\\Modern_Launchpad_OSD.amxd\\";
  var idx = resourcesPath.indexOf(markerPosix);
  if (idx === -1) {
    idx = resourcesPath.indexOf(markerWin);
  }
  if (idx >= 0) {
    var repoRoot = resourcesPath.slice(0, idx + 1);
    repoTemplatesPath = repoRoot + "osd_maps/json_templates/";
  } else {
    repoTemplatesPath = null;
  }
}

// Synchronous JSON reader (Max JS File API has no async variant).
function readJson(path) {
  var f = new File(path, "read");
  if (!f.isopen) {
    return null;
  }
  var content = "";
  while (f.position < f.eof) {
    content += f.readstring(f.eof - f.position);
  }
  f.close();
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function readTemplateJson(filename) {
  var template = null;
  if (repoTemplatesPath) {
    template = readJson(repoTemplatesPath + filename);
  }
  if (!template) {
    template = readJson(resourcesPath + "osd_maps/json_templates/" + filename);
  }
  return template;
}

// Locate the Launchpad95 OSD component in the current Live set.
function findOSD() {
  try {
    var live = new LiveAPI("live_set");
    var count = live.getcount("control_surfaces");
    for (var i = 0; i < count; i++) {
      var csPath = "live_set control_surfaces " + i;
      var cs = new LiveAPI(csPath);
      var compCount = cs.getcount("components");
      for (var j = 0; j < compCount; j++) {
        var compPath = csPath + " components " + j;
        var comp = new LiveAPI(compPath);
        var name = comp.get("name");
        if (name && name[0] === "OSD") {
          osdApi = comp;
          osdApi.add_property_listener("updateML", "onUpdateML");
          stopRetryingFindOSD();
          return true;
        }
      }
    }
    logOnce("osd_not_found", "Modern_Launchpad_OSD: OSD component not found.");
  } catch (e) {
    logOnce("osd_error", "Modern_Launchpad_OSD: error finding OSD component.");
  }
  return false;
}

// Retry logic so we can attach to Launchpad95 if it appears after load.
function startRetryingFindOSD() {
  if (retryTask) return;
  retryTask = new Task(function () {
    if (osdApi) {
      stopRetryingFindOSD();
      return;
    }
    retryAttempts += 1;
    var found = findOSD();
    if (found) return;
    retryIntervalMs = Math.min(maxRetryIntervalMs, retryIntervalMs * 1.5);
    retryTask.interval = retryIntervalMs;
  }, this);
  retryTask.interval = retryIntervalMs;
  retryTask.repeat();
}

function stopRetryingFindOSD() {
  if (!retryTask) return;
  retryTask.cancel();
  retryTask = null;
}

// Manual trigger for rescanning control surfaces.
function rescan() {
  findOSD();
  if (!osdApi) {
    startRetryingFindOSD();
  }
}

// Responds to the OSD's update tick. Throttled to ~30 FPS to avoid UI spam.
function onUpdateML() {
  var now = new Date().getTime();
  if (now - lastUpdateMs < 33) {
    return;
  }
  lastUpdateMs = now;
  if (!osdApi) return;

  var modeId = getLiveProperty(osdApi, "mode_id");
  if (!modeId) {
    modeId = getLiveProperty(osdApi, "mode");
  }

  var hardware = getLiveProperty(osdApi, "hardware_model") || "mk1";
  var gridLeds = osdApi.get("grid_leds");
  if (!gridLeds || !gridLeds.length) {
    gridLeds = null;
  }

  // Map the current mode_id into a template entry (if any).
  var templateKey = null;
  if (manifest && manifest.routing && manifest.routing.by_mode_id) {
    templateKey = manifest.routing.by_mode_id[modeId];
  }

  // Load the template once and cache it for subsequent updates.
  var template = null;
  if (templateKey) {
    if (!templates[templateKey]) {
      var entry = manifest.templates[templateKey];
      if (entry && entry.file) {
        var filename = entry.file.split("/").pop();
        template = readTemplateJson(filename);
        if (template) {
          template.title = entry.title;
          templates[templateKey] = template;
        }
      }
    }
    template = templates[templateKey] || null;
  }

  if (!template) {
    template = blankTemplate();
  }

  // Only send a template when the mode changes; otherwise send LED overlays only.
  if (templateKey !== lastTemplateKey) {
    lastTemplateKey = templateKey;
  } else {
    template = null;
  }

  var payload = {
    template: template,
    grid_leds: gridLeds,
    hardware_model: hardware,
    opts: opts,
  };

  if (!paletteSent && palette) {
    payload.palette = palette;
    paletteSent = true;
  }

  sendToWeb(payload);
}

// Wrapper around LiveAPI.get that tolerates missing properties.
function getLiveProperty(api, prop) {
  try {
    var value = api.get(prop);
    if (value && value.length) {
      return value[0];
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Fallback template used when no matching template exists.
function blankTemplate() {
  var emptyCell = { label: "", color: "" };
  var grid = [];
  for (var r = 0; r < 8; r++) {
    var row = [];
    for (var c = 0; c < 8; c++) row.push(emptyCell);
    grid.push(row);
  }
  return {
    name: "Blank",
    title: "Blank",
    snapshot: {
      t: [emptyCell, emptyCell, emptyCell, emptyCell, emptyCell, emptyCell, emptyCell, emptyCell],
      g: grid,
      s: [emptyCell, emptyCell, emptyCell, emptyCell, emptyCell, emptyCell, emptyCell, emptyCell],
    },
  };
}

// Push a JSON payload into the embedded HTML UI.
function sendToWeb(payload) {
  if (!jweb) return;
  var json = JSON.stringify(payload);
  jweb.message("eval", "window.applyOSDState(" + json + ");");
}

// UI toggles exposed to Max message boxes.
function debug_ids(val) {
  opts.debugIds = val === 1;
  sendToWeb({ opts: opts });
}

function overlay(val) {
  opts.overlay = val === 1;
  sendToWeb({ opts: opts });
}

function mk2_exact(val) {
  opts.mk2Exact = val === 1;
  sendToWeb({ opts: opts });
}
