outlets = 3;
autowatch = 1;
var LOG_ENABLED = 1;
if (LOG_ENABLED) { post("OSD_BRIDGE_ACTIVE\n"); }

var l95_osd = null;
var updateML_handler = null;
var l95_osd_path = "";

var mode;
var info_0, info_1;
var att = [];
var att_n = [];

var header = null;
var mode_info_box = null;
var mode_guide_pic = null;
var mode_guide_label = null;
var mode_info_label = null;

var section_info_bp = null;
var section_guide_bp = null;
var section_modeinfo_bp = null;

var toggle_info = null;
var toggle_guide = null;
var toggle_modeinfo = null;

var ui_ready = 0;
var show_info_section = 1;
var show_guide_section = 1;
var show_modeinfo_section = 1;
var jweb_ready = 0;
var jweb_boot_task = null;
var jweb_boot_attempts = 0;
var jweb_boot_max = 12;
var jweb_boot_interval = 200;

var section_gap = 8;
var menu_height = 24;
var guide_label_height = 20;
var info_label_height = 20;

var info_base = null;
var info_scale = 1;
var info_content_w = 0;
var info_content_h = 0;

var screenshots_dir = "";
var last_mode_id = "";
var last_layout_mode_id = "";
var layout_dirty = 1;
var last_guide_rect = null;
var pending_mode_id = "";
var last_repaint_signature = "";
var last_probe_log_at = 0;
var last_mode_text = "";
var stable_mode_id = "session";
var candidate_mode_id = "";
var candidate_mode_hits = 0;
var last_probe_pad_values = null;
var mode_update_task = null;
var mk2_palette = null;
var hardware_model = "";
var pad_colors_dict_name = "osd_pad_colors";
var pad_colors_dict = null;
var pad_rgb_dict_name = "pad_rgb";
var pad_rgb_dict = null;
var pad_cell_dicts = null;
var pad_cell_dicts_ready = 0;
var pad_rgb_seeded = 0;
ensure_pad_dict();
var last_pad_velocities = [];
var last_button_velocities = [];
var last_pad_colors = null;
var last_button_colors = null;
var snapshot_dict_name = "osd_snapshot";
var snapshot_dict = null;
var snapshot_seeded = 0;
ensure_snapshot_dict();
var manifest_data = null;
var manifest_path = "";
var manifest_root = "";
var template_cache = {};
var last_snapshot_mode_id = "";

var MK1_OFF = { "0": 1, "4": 1 };
var MK1_RED_FULL = { "7": 1, "11": 1 };
var MK1_RED_DIM = { "6": 1, "5": 1, "10": 1, "9": 1 };
var MK1_GREEN_FULL = { "52": 1, "56": 1, "53": 1, "57": 1 };
var MK1_GREEN_DIM = { "36": 1, "20": 1, "40": 1, "24": 1 };
var MK1_AMBER_FULL = { "55": 1, "59": 1, "54": 1, "58": 1 };
var MK1_AMBER_DIM = { "38": 1, "21": 1, "42": 1, "25": 1, "37": 1, "41": 1, "39": 1, "43": 1, "22": 1, "26": 1, "23": 1, "27": 1 };
var MK1_COLOR_RED = [217, 75, 61];
var MK1_COLOR_GREEN = [45, 191, 110];
var MK1_COLOR_AMBER = [240, 164, 67];
var MK1_DIM_FACTOR = 0.55;

// Ensure pad dictionaries exist as soon as the script loads (before patcher access).
ensure_pad_dict();

var MODE_MAP = {
    "session": {
        "screenshot": "Session Mode.png",
        "w": 560,
        "h": 560,
        "info": "Session Mode\n- 8x8 grid launches clips; right column launches scenes.\n- Arrow buttons move scene/track banks.\n- Session button opens overview/zoom.\n- Standard clip colors and launch behavior."
    },
    "pro_session": {
        "screenshot": "Pro Session Mode.png",
        "w": 742,
        "h": 627,
        "info": "Pro Session Mode\n- Adds advanced functions to Session mode.\n- Hold side buttons for secondary actions.\n- Last row shows context tools (quantize/tempo/fixed length).\n- See sub-modes for specific workflows."
    },
    "pro_session_arm": {
        "screenshot": "Pro Session Mode_Arm.png",
        "w": 738,
        "h": 618,
        "info": "Pro Session - Arm/Record\n- Hold Record (scene button 8).\n- Last row arms tracks.\n- Record + pad arms track and launches clip.\n- Double press toggles auto record mode."
    },
    "pro_session_solo": {
        "screenshot": "Pro Session Mode_Solo.png",
        "w": 738,
        "h": 618,
        "info": "Pro Session - Solo\n- Hold Solo (scene button 7).\n- Last row solos tracks.\n- Solo + pad solos track and launches clip.\n- Double press toggles auto solo mode."
    },
    "pro_session_mute": {
        "screenshot": "Pro Session Mode_Mute.png",
        "w": 738,
        "h": 618,
        "info": "Pro Session - Mute\n- Hold Delete (scene button 6).\n- Last row mutes tracks.\n- Delete + pad deletes clip.\n- Shift + Delete clears devices."
    },
    "pro_session_fixed_length": {
        "screenshot": "Pro Session Mode_Fixed Clip Length Recording.png",
        "w": 741,
        "h": 616,
        "info": "Pro Session - Fixed Clip Length\n- Hold Double (scene button 5).\n- Toggle fixed-length recording.\n- Last row selects fixed clip lengths.\n- Double click toggles fixed length on/off."
    },
    "pro_session_record_quant": {
        "screenshot": "Pro Session Mode_Record Quantization.png",
        "w": 741,
        "h": 616,
        "info": "Pro Session - Record Quantization\n- Hold Quantize (scene button 4).\n- Last row selects record quantization.\n- Quantize + pad quantizes the clip."
    },
    "pro_session_metronome": {
        "screenshot": "Pro Session Mode_Metronome.png",
        "w": 739,
        "h": 618,
        "info": "Pro Session - Metronome/Tempo\n- Hold Tempo (scene button 3).\n- Toggle metronome and adjust tempo.\n- Tap tempo on the last row.\n- Shift + Tempo + Matrix can launch scenes."
    },
    "pro_session_launch_quant": {
        "screenshot": "Pro Session Mode_Launch Quantization.png",
        "w": 741,
        "h": 616,
        "info": "Pro Session - Launch Quantization\n- Hold Shift (scene button 2).\n- Last row selects launch quantization.\n- Shift + pad selects clip and shows details.\n- Double click shift hides detail view."
    },
    "pro_session_tempo": {
        "screenshot": "Pro Session Mode_Tempo.png",
        "w": 739,
        "h": 618,
        "info": "Pro Session - Tempo\n- Hold Tempo (scene button 3).\n- Tap tempo or adjust with pads.\n- Metronome toggle on last row."
    },
    "device_controller": {
        "screenshot": "Device Controller Mode.png",
        "w": 562,
        "h": 591,
        "info": "Device Controller Mode\n- 8 sliders control device parameters.\n- Top row selects device/bank.\n- Left/right move between banks.\n- Encoders map to device parameters."
    },
    "instrument": {
        "screenshot": "Instrument Controller Mode.png",
        "w": 652,
        "h": 559,
        "info": "Instrument Controller Mode\n- Grid plays notes based on selected scale.\n- Octave and scale controls on the side buttons.\n- Note Repeat and velocity tools available."
    },
    "instrument_scale": {
        "screenshot": "Instrument Controller Mode_Scale Edition Mode.png",
        "w": 672,
        "h": 559,
        "info": "Instrument - Scale Edit\n- Select scale, root note, and octave.\n- Toggle to exit scale edit and return to instrument mode."
    },
    "instrument_quick_scale": {
        "screenshot": "Instrument Controller Mode.png",
        "w": 652,
        "h": 559,
        "info": "Instrument - Quick Scale\n- Quick scale layout with immediate scale/root access.\n- Returns to standard instrument behavior when quick scale is disabled."
    },
    "quick_scale_root": {
        "screenshot": "Quick Scale Mode_Root Note.png",
        "w": 653,
        "h": 558,
        "info": "Quick Scale - Root Note\n- Quick access to root notes.\n- Press same key again to toggle major/minor.\n- Use circle-of-fifths shortcuts.\n- Toggle to switch to Mode selection."
    },
    "quick_scale_mode": {
        "screenshot": "Quick Scale Mode_Modus.png",
        "w": 662,
        "h": 557,
        "info": "Quick Scale - Mode\n- Select scale mode (major/minor/etc).\n- Use top two rows for quick mode changes.\n- Toggle to switch to Root or Note Repeat."
    },
    "quick_scale_repeat": {
        "screenshot": "Quick Scale Mode_Note Repeat.png",
        "w": 654,
        "h": 558,
        "info": "Quick Scale - Note Repeat\n- Enable/disable note repeat.\n- Set swing and repeat rate.\n- Useful for Drum Rack performance.\n- Toggle to return to Root/Mode."
    },
    "drum_stepseq_combined": {
        "screenshot": "Drum Step Sequencer Mode_Combined Mode.png",
        "w": 654,
        "h": 601,
        "info": "Drum Step Sequencer - Combined\n- 8x8 grid shows 2 bars and 8 lanes.\n- Toggle velocity, length, or mute lanes.\n- Use arrows to move pages.\n- Dedicated scale overlay from Scale button."
    },
    "drum_stepseq_multinote": {
        "screenshot": "Drum Step Sequencer Mode_Multinote Mode.png",
        "w": 653,
        "h": 602,
        "info": "Drum Step Sequencer - Multinote\n- 8x8 grid: one note per row.\n- Left/Right buttons change pages.\n- Scale overlay available from Scale button.\n- Lock/Quantize/Mute/Velocity tools remain."
    },
    "drum_stepseq_scale": {
        "screenshot": "Scale Mode.png",
        "w": 672,
        "h": 559,
        "info": "Drum Step Sequencer - Scale Overlay\n- Select scale, root note, and octave.\n- Release Scale to return to step sequencing.\n- Works with both Combined and Multinote."
    },
    "melodic_stepseq_scale": {
        "screenshot": "Scale Mode.png",
        "w": 672,
        "h": 559,
        "info": "Melodic Step Sequencer\n- Press User 2 until green.\n- 7x8 grid edits pitch/velocity/length/octave.\n- Last row selects the active page.\n- Double press last scene toggles mono/poly."
    },
    "melodic_stepseq": {
        "screenshot": "Melodic StepSequencer Mode.png",
        "w": 661,
        "h": 590,
        "info": "Melodic Step Sequencer\n- Press User 2 until green.\n- 7x8 grid edits pitch/velocity/length/octave.\n- Last row selects the active page.\n- Double press last scene toggles mono/poly."
    },
    "mixer": {
        "screenshot": "Mixer Mode.png",
        "w": 560,
        "h": 559,
        "info": "Mixer Mode\n- Side buttons select Volume/Pan/Send A/B.\n- Last rows handle Stop/Solo/Arm/Active.\n- Arrows move tracks/scenes.\n- Customize levels in Settings.py (VOLUME_LEVELS)."
    },
    "user1": {
        "screenshot": "User1 Mode.png",
        "w": 560,
        "h": 558,
        "info": "User 1 Mode\n- Plain MIDI user mode (if enabled).\n- Launchpad sends notes/CC without script mapping."
    },
    "user2": {
        "screenshot": "User2 Mode.png",
        "w": 561,
        "h": 559,
        "info": "User 2 Mode\n- Plain MIDI user mode (if enabled).\n- Launchpad sends notes/CC without script mapping."
    }
};

var anim_task = null;
var anim_start_w = 0;
var anim_start_h = 0;
var anim_target_w = 0;
var anim_target_h = 0;
var anim_step = 0;
var anim_steps = 4;

function sane_dim(v, fallback, minv, maxv) {
    if (v === undefined || v === null || isNaN(v) || !isFinite(v)) { return fallback; }
    if (v < minv) { return minv; }
    if (v > maxv) { return maxv; }
    return v;
}

function safe_item(arr, idx, fallback) {
    if (!arr || arr.length <= idx) { return fallback; }
    var v = arr[idx];
    return (v === undefined || v === null) ? fallback : v;
}

function safe_message(obj, cmd, value) {
    if (!obj) { return; }
    try { obj.message(cmd, value); } catch (e) { }
}

function api_get_list(api, property_name) {
    if (!api || !property_name) { return []; }
    try {
        var v = api.get(property_name);
        if (v === undefined || v === null) { return []; }
        var out = [];
        var i = 0;

        // LiveAPI can return array-like atoms, plain scalars, or encoded strings.
        if (typeof v === "string") {
            var s = v.replace(/[\[\],]/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
            if (s.length > 0) { out = s.split(" "); }
        } else if (v.length !== undefined) {
            for (i = 0; i < v.length; i++) { out.push(v[i]); }
        } else {
            out = [v];
        }

        // Some LiveAPI responses prefix the property name; drop it when present.
        if (out.length > 0) {
            var head = ("" + out[0]).toLowerCase();
            if (head === ("" + property_name).toLowerCase()) {
                out.shift();
            }
        }
        return out;
    } catch (e) {
        return [];
    }
}

function is_numeric_atom(value) {
    if (value === undefined || value === null) { return false; }
    var n = Number(value);
    return !isNaN(n) && isFinite(n);
}

function normalize_velocity_list(raw_values, expected_len, property_name) {
    if (!raw_values || expected_len <= 0) { return []; }
    var src = [];
    var i = 0;
    if (typeof raw_values === "string") {
        var text = raw_values.replace(/[\[\],]/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        if (text.length > 0) { src = text.split(" "); }
    } else if (raw_values.length !== undefined) {
        for (i = 0; i < raw_values.length; i++) {
            src.push(raw_values[i]);
        }
    } else {
        src = [raw_values];
    }
    if (src.length === 0) { return []; }

    // LiveAPI sometimes prepends a property token (or other metadata atom).
    while (src.length > expected_len) {
        var head = ("" + src[0]).toLowerCase();
        if (head === ("" + property_name).toLowerCase() || !is_numeric_atom(src[0])) {
            src.shift();
        } else {
            break;
        }
    }

    // If metadata still exists, keep the newest expected_len atoms.
    if (src.length > expected_len) {
        src = src.slice(src.length - expected_len);
    }
    if (src.length < expected_len) { return []; }

    var out = [];
    for (i = 0; i < expected_len; i++) {
        var vel = Number(src[i]);
        if (isNaN(vel) || !isFinite(vel)) { vel = 0; }
        vel = Math.max(0, Math.min(127, Math.round(vel)));
        out.push(vel);
    }
    return out;
}

function send_status(msg) {
    try { outlet(2, "status", msg); } catch (e) { }
}

function read_file_text(path) {
    var f = null;
    try {
        f = new File(path, "read");
        if (!f || !f.isopen) { return ""; }
        var out = "";
        while (f.position < f.eof) {
            out += f.readstring(f.eof - f.position);
        }
        f.close();
        return out;
    } catch (e) {
        try { if (f) { f.close(); } } catch (e2) { }
        return "";
    }
}

function read_json(path) {
    try {
        var text = read_file_text(path);
        if (!text || text.length === 0) { return null; }
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

function manifest_root_from_path(path) {
    if (!path || path.length === 0) { return ""; }
    var p = path.replace(/\\/g, "/");
    var idx = p.indexOf("/osd_maps/");
    if (idx >= 0) { return p.substring(0, idx); }
    idx = p.lastIndexOf("/");
    if (idx >= 0) { return p.substring(0, idx); }
    return "";
}

function resolve_manifest_path() {
    var base = get_base_dir();
    var candidates = [];
    if (base && base.length) {
        candidates.push(base + "/resources/manifest.json");
        candidates.push(base + "/resources/osd_maps/generated_templates/manifest.json");
        candidates.push(base + "/osd_maps/generated_templates/manifest.json");
        candidates.push(base + "/../osd_maps/generated_templates/manifest.json");
        candidates.push(base + "/../../osd_maps/generated_templates/manifest.json");
    }
    var repo = derive_repo_base();
    if (repo && repo.length) {
        candidates.push(repo + "/osd_maps/generated_templates/manifest.json");
    }
    for (var i = 0; i < candidates.length; i++) {
        var p = candidates[i].replace(/\\/g, "/");
        var data = read_json(p);
        if (data) { return { path: p, data: data }; }
    }
    return null;
}

function load_manifest() {
    if (manifest_data) { return manifest_data; }
    var resolved = resolve_manifest_path();
    if (resolved && resolved.data) {
        manifest_data = resolved.data;
        manifest_path = resolved.path || "";
        manifest_root = manifest_root_from_path(manifest_path);
        send_status("manifest_loaded");
        return manifest_data;
    }
    send_status("manifest_missing");
    return null;
}

function ensure_snapshot_dict() {
    if (!snapshot_dict) {
        snapshot_dict = new Dict(snapshot_dict_name);
    }
    seed_snapshot_dict();
}

function make_empty_snapshot_template() {
    var tpl = { id: "session", name: "Session Mode", snapshot: { t: [], g: [], s: [] } };
    var i = 0;
    for (i = 0; i < 8; i++) {
        tpl.snapshot.t.push({ label: "", color: "" });
        tpl.snapshot.s.push({ label: "", color: "" });
    }
    for (var r = 0; r < 8; r++) {
        var row = [];
        for (var c = 0; c < 8; c++) {
            row.push({ label: "", color: "" });
        }
        tpl.snapshot.g.push(row);
    }
    return tpl;
}

function seed_snapshot_dict() {
    if (snapshot_seeded) { return; }
    if (!snapshot_dict) { return; }
    try {
        snapshot_dict.parse(JSON.stringify(make_empty_snapshot_template()));
        snapshot_dict.set("updated_at", 0);
        snapshot_seeded = 1;
    } catch (e) { }
}

function resolve_template_file(file_path) {
    if (!file_path || file_path.length === 0) { return ""; }
    var p = file_path.replace(/\\/g, "/");
    if (p.indexOf(":") > 0 || p.charAt(0) === "/") { return p; }
    if (manifest_root && manifest_root.length) {
        return (manifest_root + "/" + p).replace(/\\/g, "/");
    }
    var base = get_base_dir();
    if (base && base.length) {
        return (base + "/" + p).replace(/\\/g, "/");
    }
    return p;
}

function load_template_for_mode(mode_id) {
    var manifest = load_manifest();
    if (!manifest || !manifest.routing || !manifest.routing.by_mode_id || !manifest.templates) { return null; }
    var key = manifest.routing.by_mode_id[mode_id] || manifest.routing.by_mode_id["session"] || "session_mode";
    var entry = manifest.templates[key];
    if (!entry || !entry.file) { return null; }
    var path = resolve_template_file(entry.file);
    if (!path || path.length === 0) { return null; }
    if (template_cache[path]) { return template_cache[path]; }
    var data = read_json(path);
    if (data) { template_cache[path] = data; }
    return data;
}

function strip_color(cell) {
    if (!cell || typeof cell !== "object") { return cell; }
    var out = {};
    for (var k in cell) {
        if (cell.hasOwnProperty(k) && k !== "color") {
            out[k] = cell[k];
        }
    }
    return out;
}

function snapshot_labels_only(template) {
    if (!template || !template.snapshot) { return template; }
    var snap = template.snapshot;
    var out_snap = {};
    if (snap.t && snap.t.length !== undefined) {
        var tops = [];
        for (var ti = 0; ti < snap.t.length; ti++) { tops.push(snap.t[ti]); }
        out_snap.t = tops;
    }
    if (snap.s && snap.s.length !== undefined) {
        var sides = [];
        for (var si = 0; si < snap.s.length; si++) { sides.push(snap.s[si]); }
        out_snap.s = sides;
    }
    if (snap.g && snap.g.length !== undefined) {
        var rows = [];
        for (var r = 0; r < snap.g.length; r++) {
            var row = snap.g[r];
            if (!row || row.length === undefined) { rows.push(row); continue; }
            var new_row = [];
            for (var c = 0; c < row.length; c++) {
                new_row.push(strip_color(row[c]));
            }
            rows.push(new_row);
        }
        out_snap.g = rows;
    }
    return {
        id: template.id,
        name: template.name,
        snapshot: out_snap
    };
}

function send_snapshot_to_jweb(mode_id) {
    if (!mode_id || mode_id.length === 0) { mode_id = "session"; }
    if (mode_id === last_snapshot_mode_id) { return; }
    var tpl = load_template_for_mode(mode_id);
    if (!tpl) { return; }
    tpl = snapshot_labels_only(tpl);
    ensure_snapshot_dict();
    try {
        snapshot_dict.parse(JSON.stringify(tpl));
        snapshot_dict.set("updated_at", new Date().getTime());
        last_snapshot_mode_id = mode_id;
        try { outlet(0, "loadSnapshot", snapshot_dict_name); } catch (e1) { }
        // Snapshot application repaints template defaults; force a full LED repaint after it.
        reset_velocity_cache();
        if (last_pad_colors) { push_pad_colors_to_jweb(last_pad_colors); }
        if (last_button_colors) { push_button_colors_to_jweb(last_button_colors); }
    } catch (e) {
        // ignore parse errors
    }
}

function resolve_palette_path() {
    var base = get_base_dir();
    var candidates = [];
    if (base && base.length) {
        candidates.push(base + "/resources/mk2_palette.json");
        candidates.push(base + "/resources/osd_maps/palettes/mk2_palette.json");
        candidates.push(base + "/../osd_maps/palettes/mk2_palette.json");
        candidates.push(base + "/osd_maps/palettes/mk2_palette.json");
    }
    var repo = derive_repo_base();
    if (repo && repo.length) {
        candidates.push(repo + "/osd_maps/palettes/mk2_palette.json");
    }
    for (var i = 0; i < candidates.length; i++) {
        var p = candidates[i].replace(/\\/g, "/");
        var data = read_json(p);
        if (data) { return { path: p, data: data }; }
    }
    return null;
}

function load_mk2_palette() {
    var resolved = resolve_palette_path();
    if (resolved && resolved.data) {
        mk2_palette = resolved.data;
        log("mk2 palette loaded: " + resolved.path);
        send_status("palette_loaded");
    } else {
        mk2_palette = null;
        log("mk2 palette not found");
        send_status("palette_missing");
    }
}

function normalize_hw_model(value) {
    if (value === undefined || value === null) { return ""; }
    var v = ("" + value).toLowerCase();
    if (v.indexOf("mk3") >= 0) { return "mk3"; }
    if (v.indexOf("lpx") >= 0 || v.indexOf("launchpad x") >= 0 || v === "x") { return "lpx"; }
    if (v.indexOf("mk2") >= 0) { return "mk2"; }
    if (v.indexOf("mk1") >= 0 || v.indexOf("classic") >= 0) { return "mk1"; }
    return v;
}

function set_hardware_model(value) {
    var hw = normalize_hw_model(value);
    if (hw && hw !== hardware_model) {
        hardware_model = hw;
        send_status("hardware_" + hw);
    }
}

function shade(rgb, factor) {
    return [
        Math.max(0, Math.min(255, Math.round(Number(rgb[0]) * factor))),
        Math.max(0, Math.min(255, Math.round(Number(rgb[1]) * factor))),
        Math.max(0, Math.min(255, Math.round(Number(rgb[2]) * factor)))
    ];
}

function mk1_velocity_to_rgb(velocity) {
    var v = String(Number(velocity) || 0);
    if (MK1_OFF[v]) { return [0, 0, 0]; }
    if (MK1_RED_FULL[v]) { return MK1_COLOR_RED; }
    if (MK1_RED_DIM[v]) { return shade(MK1_COLOR_RED, MK1_DIM_FACTOR); }
    if (MK1_GREEN_FULL[v]) { return MK1_COLOR_GREEN; }
    if (MK1_GREEN_DIM[v]) { return shade(MK1_COLOR_GREEN, MK1_DIM_FACTOR); }
    if (MK1_AMBER_FULL[v]) { return MK1_COLOR_AMBER; }
    if (MK1_AMBER_DIM[v]) { return shade(MK1_COLOR_AMBER, MK1_DIM_FACTOR); }
    if (Number(velocity) > 0) { return shade(MK1_COLOR_AMBER, MK1_DIM_FACTOR); }
    return [0, 0, 0];
}

function velocity_to_rgb(velocity) {
    var v = Number(velocity) || 0;
    if (hardware_model === "mk1") {
        return mk1_velocity_to_rgb(v);
    }
    var key = String(v);
    if (mk2_palette && mk2_palette[key] && mk2_palette[key].length >= 3) {
        return [
            Number(mk2_palette[key][0]) || 0,
            Number(mk2_palette[key][1]) || 0,
            Number(mk2_palette[key][2]) || 0
        ];
    }
    return mk1_velocity_to_rgb(v);
}

function is_instrument_mode_id(mode_id) {
    return mode_id === "instrument" || mode_id === "instrument_quick_scale" || mode_id === "instrument_scale";
}

function is_stepseq_mode_id(mode_id) {
    if (!mode_id) { return false; }
    return mode_id === "drum_stepseq_combined" ||
        mode_id === "drum_stepseq_multinote" ||
        mode_id === "drum_stepseq_scale" ||
        mode_id === "melodic_stepseq" ||
        mode_id === "melodic_stepseq_scale";
}

function is_force_repaint_mode(mode_id) {
    // Temporary stopgap whitelist requested during Instrument/StepSeq OSD debugging.
    return is_instrument_mode_id(mode_id) || is_stepseq_mode_id(mode_id);
}

function repaint_signature_for_mode(mode_id, mode_val) {
    var id = mode_id || "session";
    if (!is_force_repaint_mode(id)) {
        return id;
    }
    // Include mode text to capture subview/submode shifts that keep the same mode_id.
    var text = mode_val;
    if (!text || text === "0" || text === " ") {
        text = last_mode_text || "";
    } else {
        last_mode_text = text;
    }
    return id + "|" + text;
}

function pad_id_from_index(i) {
    var row = Math.floor(i / 8);
    var col = i % 8;
    return "g" + row + col;
}

function button_id_from_index(i) {
    if (i >= 0 && i < 8) { return "t" + i; }
    if (i >= 8 && i < 16) { return "s" + (i - 8); }
    return null;
}

function reset_velocity_cache() {
    var i = 0;
    for (i = 0; i < 64; i++) { last_pad_velocities[i] = -1; }
    for (i = 0; i < 16; i++) { last_button_velocities[i] = -1; }
}

function log_pad_probe(mode_id, mode_val, pad_colors, button_colors, active_note_src) {
    if (!log_enabled) { return; }
    if (!is_force_repaint_mode(mode_id)) { return; }
    var now = new Date().getTime();
    if (now - last_probe_log_at < 250) { return; }
    last_probe_log_at = now;
    var probe_idx = [0, 8, 16, 24, 32, 40, 48, 56, 63];
    var probe_vals = [];
    var i = 0;
    for (i = 0; i < probe_idx.length; i++) {
        var p = probe_idx[i];
        var v = (pad_colors && pad_colors.length > p) ? (Number(pad_colors[p]) || 0) : 0;
        probe_vals.push(p + ":" + v);
    }
    var top_vals = [];
    for (i = 0; i < 8; i++) {
        var b = (button_colors && button_colors.length > i) ? (Number(button_colors[i]) || 0) : 0;
        top_vals.push("t" + i + ":" + b);
    }
    var first_nonzero = [];
    var changed = [];
    var maxv = 0;
    if (pad_colors && pad_colors.length >= 64) {
        for (i = 0; i < 64 && first_nonzero.length < 8; i++) {
            var pv = Number(pad_colors[i]) || 0;
            if (pv > maxv) { maxv = pv; }
            if (pv > 0) { first_nonzero.push(i + ":" + pv); }
        }
        if (last_probe_pad_values && last_probe_pad_values.length >= 64) {
            for (i = 0; i < 64 && changed.length < 10; i++) {
                var prev = Number(last_probe_pad_values[i]) || 0;
                var cur = Number(pad_colors[i]) || 0;
                if (prev !== cur) {
                    changed.push(i + ":" + prev + ">" + cur);
                }
            }
        }
        last_probe_pad_values = pad_colors.slice(0);
    }
    log("LP2000 OSD TRACE mode_id=" + mode_id + " mode=" + mode_val +
        " hw=" + hardware_model +
        " src=" + (active_note_src || "none") +
        " pads=" + probe_vals.join(",") +
        " top=" + top_vals.join(",") +
        " nz=" + first_nonzero.join(",") +
        " max=" + maxv +
        " delta=" + changed.join(","));
}

function settle_mode_id(resolved_mode_id) {
    var id = resolved_mode_id || "session";
    if (id === stable_mode_id) {
        candidate_mode_id = "";
        candidate_mode_hits = 0;
        return stable_mode_id;
    }
    if (id !== candidate_mode_id) {
        candidate_mode_id = id;
        candidate_mode_hits = 1;
    } else {
        candidate_mode_hits += 1;
    }
    if (candidate_mode_hits < 2) {
        log("LP2000 OSD TRACE hold_mode stable=" + stable_mode_id + " candidate=" + id + " hits=" + candidate_mode_hits);
        return stable_mode_id;
    }
    stable_mode_id = id;
    candidate_mode_id = "";
    candidate_mode_hits = 0;
    return stable_mode_id;
}

function is_mode_hold_frame(resolved_mode_id, settled_mode_id) {
    var raw = resolved_mode_id || "session";
    var stable = settled_mode_id || "session";
    return raw !== stable;
}

function ensure_pad_dict() {
    if (!pad_colors_dict) {
        pad_colors_dict = new Dict(pad_colors_dict_name);
    }
    if (!pad_rgb_dict) {
        pad_rgb_dict = new Dict(pad_rgb_dict_name);
    }
    ensure_pad_cell_dicts();
    seed_pad_rgb_dicts();
}

function ensure_pad_cell_dicts() {
    if (pad_cell_dicts_ready) { return; }
    pad_cell_dicts = {};
    var i = 0;
    for (i = 0; i < 64; i++) {
        var id = pad_id_from_index(i);
        try {
            pad_cell_dicts[id] = new Dict(id);
            pad_cell_dicts[id].set("r", 0);
            pad_cell_dicts[id].set("g", 0);
            pad_cell_dicts[id].set("b", 0);
        } catch (e1) { }
    }
    for (i = 0; i < 16; i++) {
        var bid = button_id_from_index(i);
        if (!bid) { continue; }
        try {
            pad_cell_dicts[bid] = new Dict(bid);
            pad_cell_dicts[bid].set("r", 0);
            pad_cell_dicts[bid].set("g", 0);
            pad_cell_dicts[bid].set("b", 0);
        } catch (e2) { }
    }
    pad_cell_dicts_ready = 1;
}

function set_cell_dict_rgb(id, rgb) {
    if (!pad_cell_dicts || !pad_cell_dicts[id]) { return; }
    try {
        pad_cell_dicts[id].set("r", rgb[0]);
        pad_cell_dicts[id].set("g", rgb[1]);
        pad_cell_dicts[id].set("b", rgb[2]);
    } catch (e) { }
}

function seed_pad_rgb_dicts() {
    if (pad_rgb_seeded) { return; }
    if (!pad_colors_dict || !pad_rgb_dict) { return; }
    var i = 0;
    for (i = 0; i < 64; i++) {
        var gid = pad_id_from_index(i);
        try {
            pad_colors_dict.set("pad_rgb::" + gid + "::r", 0);
            pad_colors_dict.set("pad_rgb::" + gid + "::g", 0);
            pad_colors_dict.set("pad_rgb::" + gid + "::b", 0);
            pad_rgb_dict.set(gid + "::r", 0);
            pad_rgb_dict.set(gid + "::g", 0);
            pad_rgb_dict.set(gid + "::b", 0);
            set_cell_dict_rgb(gid, [0, 0, 0]);
        } catch (e1) { }
    }
    for (i = 0; i < 16; i++) {
        var bid = button_id_from_index(i);
        if (!bid) { continue; }
        try {
            pad_colors_dict.set("pad_rgb::" + bid + "::r", 0);
            pad_colors_dict.set("pad_rgb::" + bid + "::g", 0);
            pad_colors_dict.set("pad_rgb::" + bid + "::b", 0);
            pad_rgb_dict.set(bid + "::r", 0);
            pad_rgb_dict.set(bid + "::g", 0);
            pad_rgb_dict.set(bid + "::b", 0);
            set_cell_dict_rgb(bid, [0, 0, 0]);
        } catch (e2) { }
    }
    try { pad_colors_dict.set("updated_at", 0); } catch (e3) { }
    try { pad_rgb_dict.set("updated_at", 0); } catch (e4) { }
    pad_rgb_seeded = 1;
}

function push_pad_colors_to_jweb(pad_values) {
    if (!pad_values || pad_values.length < 64) { return; }
    ensure_pad_dict();
    var changed = 0;
    for (var i = 0; i < 64; i++) {
        var vel = Number(pad_values[i]) || 0;
        if (last_pad_velocities[i] !== vel) {
            last_pad_velocities[i] = vel;
            changed = 1;
            var id = pad_id_from_index(i);
            var rgb = velocity_to_rgb(vel);
            pad_colors_dict.set("pad_rgb::" + id + "::r", rgb[0]);
            pad_colors_dict.set("pad_rgb::" + id + "::g", rgb[1]);
            pad_colors_dict.set("pad_rgb::" + id + "::b", rgb[2]);
            if (pad_rgb_dict) {
                pad_rgb_dict.set(id + "::r", rgb[0]);
                pad_rgb_dict.set(id + "::g", rgb[1]);
                pad_rgb_dict.set(id + "::b", rgb[2]);
            }
            set_cell_dict_rgb(id, rgb);
            try { outlet(1, "setPadColor", id, rgb[0], rgb[1], rgb[2]); } catch (e1) { }
        }
    }
    if (changed) {
        pad_colors_dict.set("updated_at", new Date().getTime());
        if (pad_rgb_dict) { pad_rgb_dict.set("updated_at", new Date().getTime()); }
        try { outlet(1, "padColorsDict", pad_colors_dict_name); } catch (e2) { }
    }
}

function push_button_colors_to_jweb(button_values) {
    if (!button_values || button_values.length < 16) { return; }
    ensure_pad_dict();
    var changed = 0;
    for (var i = 0; i < 16; i++) {
        var vel = Number(button_values[i]) || 0;
        if (last_button_velocities[i] !== vel) {
            last_button_velocities[i] = vel;
            changed = 1;
            var id = button_id_from_index(i);
            if (!id) { continue; }
            var rgb = velocity_to_rgb(vel);
            pad_colors_dict.set("pad_rgb::" + id + "::r", rgb[0]);
            pad_colors_dict.set("pad_rgb::" + id + "::g", rgb[1]);
            pad_colors_dict.set("pad_rgb::" + id + "::b", rgb[2]);
            if (pad_rgb_dict) {
                pad_rgb_dict.set(id + "::r", rgb[0]);
                pad_rgb_dict.set(id + "::g", rgb[1]);
                pad_rgb_dict.set(id + "::b", rgb[2]);
            }
            set_cell_dict_rgb(id, rgb);
            try { outlet(1, "setPadColor", id, rgb[0], rgb[1], rgb[2]); } catch (e1) { }
        }
    }
    if (changed) {
        pad_colors_dict.set("updated_at", new Date().getTime());
        if (pad_rgb_dict) { pad_rgb_dict.set("updated_at", new Date().getTime()); }
        try { outlet(1, "padColorsDict", pad_colors_dict_name); } catch (e2) { }
    }
}

function bind_info_fields(display) {
    if (!display) { return; }
    try {
        header = display.getnamed("header");
        mode = display.getnamed("mode");
        info_0 = display.getnamed("info_0");
        info_1 = display.getnamed("info_1");
        var i = 0;
        for (i = 0; i < 8; i++) {
            att[i] = display.getnamed("att_" + i);
            att_n[i] = display.getnamed("att_n_" + i);
        }
    } catch (e) { }
}

function info_boxes() {
    var boxes = [mode, info_0, info_1];
    var i = 0;
    for (i = 0; i < 8; i++) {
        boxes.push(att[i]);
    }
    for (i = 0; i < 8; i++) {
        boxes.push(att_n[i]);
    }
    return boxes;
}

function apply_guide_pic_rect(rect){
    if (!rect) { return; }
    last_guide_rect = rect;
    if (mode_guide_pic) {
        set_box_rect(mode_guide_pic, rect);
        try { mode_guide_pic.message("autofit", 0); } catch (e1) { }
        try { mode_guide_pic.message("forceaspect", 0); } catch (e2) { }
    }
}

function sync_guide_rect(){
    if (!last_guide_rect) { return; }
    apply_guide_pic_rect(last_guide_rect);
}

function bytes_to_uint32(bytes, offset) {
    var i = offset || 0;
    var b0 = bytes[i] & 0xff;
    var b1 = bytes[i + 1] & 0xff;
    var b2 = bytes[i + 2] & 0xff;
    var b3 = bytes[i + 3] & 0xff;
    return ((b0 << 24) >>> 0) + (b1 << 16) + (b2 << 8) + b3;
}

function bytes_to_string(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) {
        s += String.fromCharCode(bytes[i]);
    }
    return s;
}

function read_png_size(path) {
    var f = null;
    try {
        f = new File(path, "read");
        if (!f) { return null; }
        var sig = f.readbytes(8);
        if (!sig || sig.length < 8) { f.close(); return null; }
        var pngSig = [137, 80, 78, 71, 13, 10, 26, 10];
        for (var i = 0; i < 8; i++) {
            if (sig[i] != pngSig[i]) { f.close(); return null; }
        }
        var lenBytes = f.readbytes(4);
        var typeBytes = f.readbytes(4);
        if (!lenBytes || lenBytes.length < 4 || !typeBytes || typeBytes.length < 4) {
            f.close();
            return null;
        }
        var type = bytes_to_string(typeBytes);
        if (type !== "IHDR") {
            f.close();
            return null;
        }
        var data = f.readbytes(8);
        if (!data || data.length < 8) { f.close(); return null; }
        var w = bytes_to_uint32(data, 0);
        var h = bytes_to_uint32(data, 4);
        f.close();
        return { w: w, h: h };
    } catch (e) {
        try { if (f) { f.close(); } } catch (e2) { }
        return null;
    }
}

function ensure_screenshot_size(data) {
    // Read PNG dimensions once per file to keep guide layout in sync with assets.
    if (!data || !data.screenshot) { return false; }
    if (!screenshots_dir || screenshots_dir === "") { compute_screenshots_dir(); }
    var path = screenshots_dir + data.screenshot;
    if (!path || path === "") { return false; }
    if (data._size_loaded && data._size_path === path) { return false; }
    var size = read_png_size(path);
    if (!size || !size.w || !size.h) { return false; }
    data._size_loaded = 1;
    data._size_path = path;
    if (data.w !== size.w || data.h !== size.h) {
        data.w = size.w;
        data.h = size.h;
        return true;
    }
    return false;
}

function bang() {
    locate_l95();
    locate_osd();
    init_ui();
    ui_ready = 1;
    update();
}

function bang2() {
    bang();
}

function update(args){
    try {
        var i = 0;
        if (!l95_osd) {
            locate_l95();
        }
        if (!mode || !mode_guide_pic || !mode_info_box) {
            locate_osd();
        }
        if (!ui_ready && (mode || mode_guide_pic || mode_info_box)) {
            init_ui();
            ui_ready = 1;
        }
        if (!l95_osd) {
            return;
        }

        var shots = api_get_list(l95_osd, "screenshots_dir");
        shots = safe_item(shots, 0, "");
        if (shots && shots.length) { set_screenshots_dir(shots); }

        var info = api_get_list(l95_osd, "info");
        var attributes = api_get_list(l95_osd, "attributes");
        var attribute_names = api_get_list(l95_osd, "attribute_names");
        var mode_val = safe_item(api_get_list(l95_osd, "mode"), 0, " ");
        var mode_id_val = safe_item(api_get_list(l95_osd, "mode_id"), 0, "");
        var hw_val = safe_item(api_get_list(l95_osd, "hardware_model"), 0, "");
        var pad_colors = normalize_velocity_list(api_get_list(l95_osd, "pad_colors"), 64, "pad_colors");
        var button_colors = normalize_velocity_list(api_get_list(l95_osd, "button_colors"), 16, "button_colors");
        var active_note_src = safe_item(api_get_list(l95_osd, "active_note_source"), 0, "none");

        safe_message(mode, "set", mode_val);
        safe_message(info_0, "set", safe_item(info, 0, " "));
        safe_message(info_1, "set", safe_item(info, 1, " "));
        try { outlet(0, "setTitle", mode_val); } catch (e0) { }

        for (i = 0; i < 8; i++) {
            safe_message(att[i], "set", safe_item(attributes, i, " "));
            safe_message(att_n[i], "set", safe_item(attribute_names, i, " "));
        }

        set_hardware_model(hw_val);
        var resolved_mode_id = resolve_mode_id(mode_id_val, mode_val);
        mode_id_val = settle_mode_id(resolved_mode_id);
        var hold_frame = is_mode_hold_frame(resolved_mode_id, mode_id_val);
        if (!hold_frame) {
            if (pad_colors && pad_colors.length === 64) { last_pad_colors = pad_colors.slice(0); }
            if (button_colors && button_colors.length === 16) { last_button_colors = button_colors.slice(0); }
        } else {
            if (last_pad_colors && last_pad_colors.length === 64) { pad_colors = last_pad_colors.slice(0); }
            if (last_button_colors && last_button_colors.length === 16) { button_colors = last_button_colors.slice(0); }
            log("LP2000 OSD TRACE hold_colors stable=" + mode_id_val + " raw=" + resolved_mode_id);
        }
        var repaint_sig = repaint_signature_for_mode(mode_id_val, mode_val);
        if (repaint_sig !== last_repaint_signature) {
            last_repaint_signature = repaint_sig;
            reset_velocity_cache();
            log("LP2000 OSD TRACE invalidate sig=" + repaint_sig);
        }
        log_pad_probe(mode_id_val, mode_val, pad_colors, button_colors, active_note_src);
        if (mode_id_val != pending_mode_id || layout_dirty) {
            pending_mode_id = mode_id_val;
            schedule_mode_assets();
        }
        push_pad_colors_to_jweb(pad_colors);
        push_button_colors_to_jweb(button_colors);

        sync_guide_rect();
    } catch (e) {
        log("update error: " + e);
    }
}

function ready() {
    jweb_ready = 1;
    // Force a fresh snapshot once the JWeb UI is ready.
    last_snapshot_mode_id = "";
    try { update(); } catch (e) { }
    var use_mode = pending_mode_id || last_mode_id || "session";
    send_snapshot_to_jweb(use_mode);
    if (last_pad_colors) { push_pad_colors_to_jweb(last_pad_colors); }
    if (last_button_colors) { push_button_colors_to_jweb(last_button_colors); }
}

function init_ui(){
    compute_screenshots_dir();
    show_info_section = 1;
    show_guide_section = 1;
    show_modeinfo_section = 1;
    layout_dirty = 1;
    last_snapshot_mode_id = "";

    if (toggle_info) { toggle_info.message("set", 1); }
    if (toggle_guide) { toggle_guide.message("set", 1); }
    if (toggle_modeinfo) { toggle_modeinfo.message("set", 1); }

    apply_section_visibility();
    pending_mode_id = "session";
    stable_mode_id = "session";
    candidate_mode_id = "";
    candidate_mode_hits = 0;
    last_probe_pad_values = null;
    last_repaint_signature = "";
    reset_velocity_cache();
    schedule_mode_assets();
}

function schedule_mode_assets(){
    if (mode_update_task) {
        try { mode_update_task.cancel(); } catch (e1) { }
        mode_update_task = null;
    }
    mode_update_task = new Task(function(){
        try {
            update_mode_assets(pending_mode_id);
        } catch (e2) {
            log("update_mode_assets error: " + e2);
        }
        mode_update_task = null;
    }, this);
    mode_update_task.interval = 50;
    mode_update_task.repeat(1);
}

function resolve_mode_id(mode_id_val, mode_val){
    var id = mode_id_val;
    if ((!id || id === "") && last_mode_id && MODE_MAP[last_mode_id]) {
        // Prefer canonical mode_id continuity when LiveAPI mode_id is temporarily blank.
        // This avoids cross-component mode-string chatter (e.g. transient device/session bleed).
        return last_mode_id;
    }
    if (!id || id === "" || !MODE_MAP[id]) {
        var m = (mode_val || "").toLowerCase();
        if (m.indexOf("instrument (quick scale)") >= 0) {
            id = "instrument_quick_scale";
        } else if (m.indexOf("session") >= 0) {
            id = "session";
        } else if (m.indexOf("mixer") >= 0) {
            id = "mixer";
        } else if (m.indexOf("device controller") >= 0) {
            id = "device_controller";
        } else if (m.indexOf("instrument") >= 0) {
            if (m.indexOf("scale") >= 0) { id = "instrument_scale"; }
            else { id = "instrument"; }
        } else if (m.indexOf("user 1") >= 0) {
            id = "user1";
        } else if (m.indexOf("user 2") >= 0) {
            id = "user2";
        } else if (m.indexOf("quick scale") >= 0) {
            id = "quick_scale_root";
        } else 
        if (m.indexOf("drum step sequencer") >= 0) {
            if (m.indexOf("scale") >= 0) { id = "drum_stepseq_scale"; }
            else if (m.indexOf("multi") >= 0) { id = "drum_stepseq_multinote"; }
            else { id = "drum_stepseq_combined"; }
        } else if (m.indexOf("melodic step sequencer") >= 0) {
            if (m.indexOf("scale") >= 0) { id = "melodic_stepseq_scale"; }
            else { id = "melodic_stepseq"; }
        }
    }
    return id || "session";
}

function set_mode_info(text){
    var t = text || "";
    if (mode_info_box) {
        mode_info_box.message("set", t);
    } else if (info_0 || info_1) {
        var lines = t.replace(/\r/g, "").split("\n");
    if (info_0) { info_0.message("set", lines[0] || ""); }
        if (info_1) { info_1.message("set", lines.slice(1).join(" ")); }
    }
}

function set_box_rect(box, rect){
    if (!box) { return; }
    try { box.presentation_rect = rect; } catch (e1) { }
    try { box.patching_rect = rect; } catch (e2) { }
}

function osd_patcher(){
    try {
        var x = this.patcher.getnamed("osd");
        if (x && x.subpatcher) { return x.subpatcher(); }
    } catch (e) { }
    return null;
}

function send_osd_rect(name, x, y, w, h){
    var p = osd_patcher();
    if (!p || !name) { return; }
    try { p.message("script", "sendbox", name, "presentation_rect", x, y, w, h); } catch (e1) { }
    try { p.message("script", "sendbox", name, "patching_rect", x, y, w, h); } catch (e2) { }
}

function send_child_rect(bp, name, x, y, w, h){
    if (!bp || !name || !bp.subpatcher) { return; }
    try { bp.subpatcher().message("script", "sendbox", name, "presentation_rect", x, y, w, h); } catch (e1) { }
    try { bp.subpatcher().message("script", "sendbox", name, "patching_rect", x, y, w, h); } catch (e2) { }
}

function capture_info_base(){
    if (info_base) { return; }
    info_base = {};
    info_content_w = 0;
    info_content_h = 0;
    var items = info_boxes();
    for (var i = 0; i < items.length; i++) {
        var b = items[i];
        if (!b) { continue; }
        var r = b.presentation_rect || b.patching_rect;
        if (!r) { continue; }
        info_base[i] = [r[0], r[1], r[2], r[3]];
        info_content_w = Math.max(info_content_w, r[0] + r[2]);
        info_content_h = Math.max(info_content_h, r[1] + r[3]);
    }
}

function apply_info_margin(mx, my){
    if (!info_base) { capture_info_base(); }
    if (!info_base) { return; }
    var items = info_boxes();
    for (var i = 0; i < items.length; i++) {
        var b = items[i];
        var r = info_base[i];
        if (!b || !r) { continue; }
        set_box_rect(b, [Math.round(r[0] * info_scale) + mx, r[1] + my, Math.round(r[2] * info_scale), r[3]]);
    }
    if (header) {
        set_box_rect(header, [mx, my - 2, Math.round(info_content_w * info_scale), 22]);
    }
}

function info_line_count(text){
    if (!text) { return 1; }
    var t = (""+text).replace(/\r/g, "");
    if (!t.length) { return 1; }
    return t.split("\n").length;
}

function set_bp_rect(bp, x, y, w, h){
    if (bp) {
        try { bp.presentation_rect = [x, y, w, h]; } catch (e1) { }
        try { bp.patching_rect = [x, y, w, h]; } catch (e2) { }
    }
}

function set_hidden(box, hidden){
    if (box) {
        try { box.hidden = hidden ? 1 : 0; } catch(e) { }
        try { box.message("hidden", hidden ? 1 : 0); } catch(e2) { }
    }
}

function apply_section_visibility(){
    var hide_info = show_info_section ? 0 : 1;
    var hide_guide = show_guide_section ? 0 : 1;
    var hide_modeinfo = show_modeinfo_section ? 0 : 1;

    set_hidden(section_info_bp, hide_info);
    set_hidden(section_guide_bp, hide_guide);
    set_hidden(section_modeinfo_bp, hide_modeinfo);
}

// L95 DEBUG OVERRIDES START
var log_enabled = LOG_ENABLED;
var log_path = "";
var log_paths = null;
var last_screenshot_path = "";
var boot_task = null;
var boot_attempts = 0;
var boot_max = 20;
var boot_interval = 200;
var boot_max_interval = 1200;
var l95_located = 0;
var ui_located = 0;
var max_screen_w = 0;
var window_pad = 8;
var section_pad = 10;

function _bool_from(v){
    if (v === undefined || v === null) { return 0; }
    if (typeof v == "object" && v.length !== undefined) { v = v[0]; }
    if (typeof v == "string") {
        var s = v.replace(/\s+/g, "");
        if (s === "" || s === "0" || s === "0.0" || s === "false") { return 0; }
        return 1;
    }
    return (v != 0);
}

function sync_toggle_state(){
    try {
        if (toggle_info && toggle_info.getvalueof) {
            show_info_section = _bool_from(toggle_info.getvalueof());
        }
        if (toggle_guide && toggle_guide.getvalueof) {
            show_guide_section = _bool_from(toggle_guide.getvalueof());
        }
        if (toggle_modeinfo && toggle_modeinfo.getvalueof) {
            show_modeinfo_section = _bool_from(toggle_modeinfo.getvalueof());
        }
    } catch (e) { }
}

function get_base_dir(){
    var p = this.patcher.filepath;
    if ((!p || p.length === 0) && this.patcher.parentpatcher) {
        p = this.patcher.parentpatcher.filepath;
    }
    if ((!p || p.length === 0)) {
        var osd = this.patcher.getnamed("osd");
        if (osd && osd.subpatcher) {
            p = osd.subpatcher().filepath;
        }
    }
    if (!p || p.length === 0) { return ""; }
    p = p.replace(/\\/g, "/");
    var idx = p.lastIndexOf("/");
    if (idx >= 0) { return p.substring(0, idx); }
    return "";
}

function derive_repo_base(){
    if (!screenshots_dir || screenshots_dir.length === 0) { return ""; }
    var p = screenshots_dir.replace(/\\/g, "/");
    if (p.charAt(p.length - 1) == "/") { p = p.substring(0, p.length - 1); }
    var marker = "/Launchpad95 Mode Screenshots";
    var idx = p.lastIndexOf(marker);
    if (idx >= 0) { return p.substring(0, idx); }
    idx = p.lastIndexOf("/");
    if (idx >= 0) { return p.substring(0, idx); }
    return "";
}

function ensure_log_path(){
    if (log_path && log_path.length) { return log_path; }
    var base = get_base_dir();
    if (base && base.length) {
        log_path = base + "/L95_log.txt";
        return log_path;
    }
    var repo = derive_repo_base();
    if (repo && repo.length) {
        log_path = repo + "/M4LDevice/L95_log.txt";
        return log_path;
    }
    return "";
}

function _push_unique_path(paths, p){
    if (!p || p.length === 0) { return; }
    for (var i = 0; i < paths.length; i++) {
        if (paths[i] === p) { return; }
    }
    paths.push(p);
}

function derive_remote_scripts_root(){
    var base = get_base_dir();
    if (base && base.length) {
        var p = base.replace(/\\/g, "/");
        var marker = "/Launchpad2000/";
        var idx = p.indexOf(marker);
        if (idx >= 0) { return p.substring(0, idx); }
    }
    var repo = derive_repo_base();
    if (repo && repo.length) {
        var r = repo.replace(/\\/g, "/");
        var j = r.lastIndexOf("/");
        if (j >= 0) { return r.substring(0, j); }
    }
    return "";
}

function ensure_log_paths(){
    if (log_paths && log_paths.length) { return log_paths; }
    log_paths = [];
    _push_unique_path(log_paths, ensure_log_path());
    var root = derive_remote_scripts_root();
    if (root && root.length) {
        _push_unique_path(log_paths, root + "/log.txt");
        if (root.indexOf("/OneDrive/Documents/") >= 0) {
            _push_unique_path(log_paths, root.replace("/OneDrive/Documents/", "/Documents/") + "/log.txt");
        } else if (root.indexOf("/Documents/") >= 0) {
            _push_unique_path(log_paths, root.replace("/Documents/", "/OneDrive/Documents/") + "/log.txt");
        }
    }
    return log_paths;
}

function log(msg){
    if (!log_enabled) { return; }
    var paths = ensure_log_paths();
    if (!paths || paths.length === 0) { return; }
    var line = new Date() + " " + msg;
    var path = "";
    var i = 0;
    var f = null;
    try {
        for (i = 0; i < paths.length; i++) {
            path = paths[i];
            if (!path || path.length === 0) { continue; }
            f = new File(path, "readwrite");
            if (!f || !f.isopen) {
                try {
                    f = new File(path, "write");
                } catch (e0) {
                    f = null;
                }
            }
            if (!f || !f.isopen) { continue; }
            try {
                f.position = f.eof;
            } catch (e1) { }
            try {
                f.writeline(line);
            } catch (e2) { }
            try {
                if (f && f.isopen) { f.close(); }
            } catch (e3) { }
            f = null;
        }
    } catch (e) {
        try { if (f && f.isopen) { f.close(); } } catch (e4) { }
    }
}

function start_boot(){
    if (boot_task) { boot_task.cancel(); }
    boot_attempts = 0;
    boot_interval = 200;
    boot_task = new Task(function(){
        boot_attempts++;
        update();
        if (l95_osd && mode_guide_pic && mode_info_box) {
            log("boot complete");
            boot_task.cancel();
            return;
        }
        if (boot_attempts >= boot_max) {
            log("boot timeout");
            boot_task.cancel();
            boot_task = null;
            return;
        }
        boot_interval = Math.min(boot_max_interval, Math.round(boot_interval * 1.5));
        boot_task.interval = boot_interval;
    }, this);
    boot_task.interval = boot_interval;
    boot_task.repeat(boot_max);
}

function start_jweb_boot(){
    if (jweb_boot_task) { jweb_boot_task.cancel(); }
    jweb_boot_attempts = 0;
    jweb_boot_interval = 200;
    jweb_boot_task = new Task(function(){
        jweb_boot_attempts++;
        try { update(); } catch (e0) { }
        var use_mode = pending_mode_id || last_mode_id || "session";
        send_snapshot_to_jweb(use_mode);
        if (last_pad_colors) { push_pad_colors_to_jweb(last_pad_colors); }
        if (last_button_colors) { push_button_colors_to_jweb(last_button_colors); }
        if (jweb_ready || jweb_boot_attempts >= jweb_boot_max) {
            jweb_boot_task.cancel();
            jweb_boot_task = null;
            return;
        }
        jweb_boot_interval = Math.min(600, Math.round(jweb_boot_interval * 1.4));
        jweb_boot_task.interval = jweb_boot_interval;
    }, this);
    jweb_boot_task.interval = jweb_boot_interval;
    jweb_boot_task.repeat(jweb_boot_max);
}

function loadbang(){
    log("loadbang");
    load_mk2_palette();
    ensure_pad_dict();
    bang();
    start_boot();
    start_jweb_boot();
}

function compute_max_screen_w(){
    if (max_screen_w > 0) { return max_screen_w; }
    var w = 0;
    for (var k in MODE_MAP) {
        if (!MODE_MAP.hasOwnProperty(k)) { continue; }
        var d = MODE_MAP[k];
        if (d && d.w && d.w > w) { w = d.w; }
    }
    max_screen_w = sane_dim(w, 720, 320, 2000);
    return max_screen_w;
}

function compute_screenshots_dir(){
    var p = this.patcher.filepath;
    if ((!p || p.length === 0) && this.patcher.parentpatcher) {
        p = this.patcher.parentpatcher.filepath;
    }
    if ((!p || p.length === 0)) {
        var osd = this.patcher.getnamed("osd");
        if (osd && osd.subpatcher) {
            p = osd.subpatcher().filepath;
        }
    }
    if (!p || p.length === 0) {
        return;
    }
    p = p.replace(/\\/g, "/");
    var idx = p.lastIndexOf("/");
    if (idx >= 0) {
        var base = p.substring(0, idx);
        var new_path = base + "/../Launchpad95 Mode Screenshots/";
        if (new_path != screenshots_dir) {
            screenshots_dir = new_path;
            log("screenshots_dir " + screenshots_dir);
        }
    }
}

function set_screenshots_dir(path){
    if (!path || path.length === 0) { return; }
    path = path.replace(/\\/g, "/");
    if (path.charAt(path.length - 1) != "/") { path += "/"; }
    if (path != screenshots_dir) {
        screenshots_dir = path;
        log("screenshots_dir " + screenshots_dir);
    }
}

function update_mode_assets(mode_id_val){
    if (!mode_id_val || mode_id_val === "") { mode_id_val = "session"; }
    var mode_changed = (mode_id_val != last_mode_id);
    if (mode_changed) {
        last_mode_id = mode_id_val;
        log("mode_id " + mode_id_val);
    }
    var data = MODE_MAP[mode_id_val];
    if (!data) { data = MODE_MAP["session"]; }
    if (data) {
        if (ensure_screenshot_size(data)) {
            layout_dirty = 1;
        }
        if (mode_changed || layout_dirty || last_layout_mode_id !== mode_id_val) {
            apply_layout(data);
            layout_dirty = 0;
            last_layout_mode_id = mode_id_val;
        }
        if (mode_changed) {
            set_mode_info(data.info);
            load_screenshot(data.screenshot);
        }
        send_snapshot_to_jweb(mode_id_val);
    }
}

function load_screenshot(filename){
    if (!filename || filename === "") { return; }
    if (!screenshots_dir || screenshots_dir === "") { compute_screenshots_dir(); }
    var path = screenshots_dir + filename;
    if (path == last_screenshot_path) { return; }
    last_screenshot_path = path;
    log("load_screenshot " + path);
    safe_message(mode_guide_pic, "read", path);
    sync_guide_rect();
}

function clear_updateML_listener(){
    try {
        if (updateML_handler) {
            try { updateML_handler.property = ""; } catch (e1) { }
            updateML_handler = null;
        }
    } catch (e2) { }
}

function locate_l95(){
    try {
        var api = new LiveAPI();
        var l95_id = -1;
        var found_path = "";
        for (var i = 0; i < 16; i++) {
            api.goto("control_surfaces " + i);
            if (!api.type) { continue; }
            var t = api.type.toLowerCase();
            if (t.indexOf("launchpad") == -1) { continue; }
            var cmp_count = api.getcount("components");
            for (var j = 0; j < cmp_count; j++) {
                api.goto("control_surfaces " + i + " components " + j);
                if (api.type == "M4LInterface") {
                    l95_id = i;
                    found_path = "control_surfaces " + l95_id + " components " + j;
                    if (l95_osd_path !== found_path) {
                        clear_updateML_listener();
                    }
                    l95_osd = new LiveAPI(found_path);
                    updateML_handler = new LiveAPI(update, found_path);
                    updateML_handler.property = "updateML";
                    l95_osd_path = found_path;
                    break;
                }
            }
            if (l95_id != -1) { break; }
        }
        if (l95_id != -1) {
            if (l95_located != 1) { log("found M4LInterface on control_surfaces " + l95_id); }
            l95_located = 1;
        } else if (l95_located == 0) {
            log("M4LInterface not found");
            l95_located = -1;
        }
        if (l95_id == -1) {
            clear_updateML_listener();
            l95_osd = null;
            l95_osd_path = "";
        }
    } catch (e) {
        log("locate_l95 error: " + e);
    }
}

function notifydeleted(){
    clear_updateML_listener();
}

function freebang(){
    clear_updateML_listener();
}

function locate_osd(){
    try {
        var display = this.patcher;
        var x = this.patcher.getnamed("osd");
        if (!x || !x.subpatcher) { return; }
        display = x.subpatcher();

        section_info_bp = display.getnamed("section_info_bp");
        section_guide_bp = display.getnamed("section_guide_bp");
        section_modeinfo_bp = display.getnamed("section_modeinfo_bp");

        if (section_info_bp && section_info_bp.subpatcher) {
            bind_info_fields(section_info_bp.subpatcher());
        }

        if (section_guide_bp && section_guide_bp.subpatcher) {
            var guide_p = section_guide_bp.subpatcher();
            mode_guide_label = guide_p.getnamed("mode_guide_label");
            mode_guide_pic = guide_p.getnamed("mode_guide_pic");
        }

        if (section_modeinfo_bp && section_modeinfo_bp.subpatcher) {
            var mi_p = section_modeinfo_bp.subpatcher();
            mode_info_label = mi_p.getnamed("mode_info_label");
            mode_info_box = mi_p.getnamed("mode_info");
        }

        toggle_info = display.getnamed("toggle_info");
        toggle_guide = display.getnamed("toggle_guide");
        toggle_modeinfo = display.getnamed("toggle_modeinfo");

        if (section_info_bp && section_guide_bp && section_modeinfo_bp && !ui_located) {
            log("ui located");
            ui_located = 1;
        }

        if (!mode && !info_0 && !info_1) {
            // Fallback to original patcher objects if custom bpatchers are missing.
            display = this.patcher;
            bind_info_fields(display);
            if (!mode_guide_pic) { mode_guide_pic = display.getnamed("mode_guide_pic"); }
            if (!mode_guide_label) { mode_guide_label = display.getnamed("mode_guide_label"); }
            if (!mode_info_box) { mode_info_box = display.getnamed("mode_info"); }
            if (!mode_info_label) { mode_info_label = display.getnamed("mode_info_label"); }
        }

        // Refresh cached layout measurements once we (re)locate UI objects.
        info_base = null;
        info_content_w = 0;
        info_content_h = 0;
        layout_dirty = 1;
    } catch (e) {
        log("locate_osd error: " + e);
    }
}


function get_window_size(p){
    try {
        var cur = p.wind.size;
        if (!cur) { return [0, 0]; }
        if (cur.length >= 4) {
            return [Math.abs(cur[2] - cur[0]), Math.abs(cur[3] - cur[1])];
        }
        return [cur[0], cur[1]];
    } catch (e) {
        return [0, 0];
    }
}

function set_window_size(p, w, h){
    try {
        var cur = p.wind.size;
        if (cur && cur.length >= 4) {
            var left = cur[0];
            var top = cur[1];
            p.wind.size = [left, top, left + w, top + h];
        } else {
            p.wind.size = [w, h];
        }
    } catch (e) {
        // ignore
    }
}

function resize_window(h, w){
    if (!isFinite(w) || !isFinite(h)) { return; }
    try {
        var osd = this.patcher.getnamed("osd");
        if (osd && osd.subpatcher) {
            var p = osd.subpatcher();
            if (p && p.wind && p.wind.size) {
                animate_window(p, w, h);
            }
        }
    } catch (e) {
        // ignore
    }
}

function animate_window(p, w, h){
    try {
        var cur = get_window_size(p);
        if (!cur || cur.length < 2) {
            set_window_size(p, w, h);
            return;
        }
        anim_start_w = sane_dim(cur[0], w, 200, 3000);
        anim_start_h = sane_dim(cur[1], h, 200, 3000);
        anim_target_w = w;
        anim_target_h = h;
        anim_step = 0;
        if (anim_task) { anim_task.cancel(); }
        anim_task = new Task(function() {
            anim_step++;
            var t = anim_step / anim_steps;
            if (t > 1) { t = 1; }
            var nw = Math.round(anim_start_w + (anim_target_w - anim_start_w) * t);
            var nh = Math.round(anim_start_h + (anim_target_h - anim_start_h) * t);
            set_window_size(p, nw, nh);
            if (t >= 1) { anim_task.cancel(); }
        }, this);
        anim_task.interval = 20;
        anim_task.repeat(anim_steps);
    } catch (e) {
        try { set_window_size(p, w, h); } catch (e2) { }
    }
}

function apply_layout(data){
    if (!data) { return; }
    if (!section_info_bp && !section_guide_bp && !section_modeinfo_bp) { return; }

    // Layout is driven by explicit show_* messages to avoid stale toggle reads.
    capture_info_base();

    var guide_img_w = (data.w && data.w > 0) ? data.w : 720;
    var guide_img_h = (data.h && data.h > 0) ? data.h : Math.max(120, Math.round(guide_img_w * 0.75));
    var guide_pad_bottom = 16;

    var base_w = sane_dim(info_content_w, 420, 200, 3000);
    var base_h = sane_dim(info_content_h, 60, 40, 400);

    var section_w = Math.max(guide_img_w, base_w + 120) + (section_pad * 2);

    var info_pad = Math.max(6, section_pad - 2);
    info_scale = 1;

    var info_w = Math.max(section_w, Math.round(base_w * info_scale) + (info_pad * 2));
    var info_h = base_h + (info_pad * 2) + 2;

    var guide_h = section_pad + guide_label_height + section_pad + guide_img_h + section_pad + guide_pad_bottom;

    var info_lines = info_line_count(data.info);
    var line_h = 12;
    var info_box_h = Math.max(28, (info_lines * line_h) + 4);

    var mi_pad = Math.max(6, section_pad - 2);
    var mi_pad_top = 0;
    var mi_content_w = Math.max(120, section_w - (mi_pad * 2));
    var mi_h = mi_pad_top + info_label_height + mi_pad + info_box_h + mi_pad;
    var mi_w = section_w;

    var content_h = 0;
    var visible = 0;
    var sections = [];

    if (show_info_section && section_info_bp) { sections.push(["info", info_h]); }
    if (show_guide_section && section_guide_bp) { sections.push(["guide", guide_h]); }
    if (show_modeinfo_section && section_modeinfo_bp) { sections.push(["modeinfo", mi_h]); }

    visible = sections.length;
    for (var si = 0; si < sections.length; si++) {
        content_h += sections[si][1];
    }
    if (visible > 1) { content_h += section_gap * (visible - 1); }

    var x = window_pad;
    var y = menu_height + window_pad;

    for (var s = 0; s < sections.length; s++) {
        var type = sections[s][0];
        var h = sections[s][1];
        if (type == "info") {
            apply_info_margin(info_pad, info_pad);
            set_bp_rect(section_info_bp, x, y, info_w, info_h);
            send_osd_rect("section_info_bp", x, y, info_w, info_h);
        } else if (type == "guide") {
            set_bp_rect(section_guide_bp, x, y, section_w, guide_h);
            send_osd_rect("section_guide_bp", x, y, section_w, guide_h);
            if (mode_guide_label) {
                set_box_rect(mode_guide_label, [section_pad, section_pad, 220, guide_label_height]);
            }
            if (mode_guide_pic) {
                apply_guide_pic_rect([section_pad, section_pad + guide_label_height + section_pad, guide_img_w, guide_img_h]);
            }
            send_child_rect(section_guide_bp, "mode_guide_label", section_pad, section_pad, 220, guide_label_height);
            send_child_rect(section_guide_bp, "mode_guide_pic", section_pad, section_pad + guide_label_height + section_pad, guide_img_w, guide_img_h);
        } else if (type == "modeinfo") {
            set_bp_rect(section_modeinfo_bp, x, y, mi_w, mi_h);
            send_osd_rect("section_modeinfo_bp", x, y, mi_w, mi_h);
            if (mode_info_label) {
                set_box_rect(mode_info_label, [mi_pad, mi_pad_top, 220, info_label_height]);
            }
            if (mode_info_box) {
                set_box_rect(mode_info_box, [mi_pad, mi_pad_top + info_label_height + mi_pad, mi_content_w, info_box_h]);
            }
            send_child_rect(section_modeinfo_bp, "mode_info_label", mi_pad, mi_pad_top, 220, info_label_height);
            send_child_rect(section_modeinfo_bp, "mode_info", mi_pad, mi_pad_top + info_label_height + mi_pad, mi_content_w, info_box_h);
        }
        y += h;
        if (s < sections.length - 1) { y += section_gap; }
    }

    var win_w = section_w + (window_pad * 2);
    var win_h = (sections.length > 0) ? (y + window_pad) : (menu_height + (window_pad * 2));

    win_w = sane_dim(win_w, section_w + 24, 320, 2600);
    win_h = sane_dim(win_h, menu_height + 60, menu_height + 60, 2600);

    resize_window(win_h, win_w);
}

function show_info(v){
    show_info_section = _bool_from(v);
    apply_section_visibility();
    var data = MODE_MAP[last_mode_id] || MODE_MAP["session"];
    layout_dirty = 1;
    apply_layout(data);
    set_mode_info(data.info);
}

function show_guide(v){
    show_guide_section = _bool_from(v);
    apply_section_visibility();
    var data = MODE_MAP[last_mode_id] || MODE_MAP["session"];
    layout_dirty = 1;
    apply_layout(data);
    set_mode_info(data.info);
    load_screenshot(data.screenshot);
}

function show_modeinfo(v){
    show_modeinfo_section = _bool_from(v);
    apply_section_visibility();
    var data = MODE_MAP[last_mode_id] || MODE_MAP["session"];
    layout_dirty = 1;
    apply_layout(data);
    set_mode_info(data.info);
}
// L95 DEBUG OVERRIDES END
