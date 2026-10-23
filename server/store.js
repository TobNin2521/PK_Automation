/***************************************************************************
 *
 *           Persistent data of the server - PK-Automation
 *
 *   Small JSON files in the data folder (server/data, or the folder in the
 *   environment variable PK_DATA_DIR).
 *     settings  ordinary settings (selected playlist, ...)
 *     secrets   login data, only readable by the owner of the files
 *
 *   Writes are collected for a moment (the Pi has an SD card) and replace the
 *   file in one step, so a power cut can't leave a half written file.
 *
 **************************************************************************/

const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.PK_DATA_DIR || path.join(__dirname, "data");
const SAVE_DELAY = 1000;

const stores = [];

const open = (name, options) => {
    options = options || {};
    const file = path.join(DATA_DIR, name + ".json");
    let data = {};
    let dirty = false;
    let timer = null;

    const readFile = (source) => {
        try {
            return JSON.parse(fs.readFileSync(source, "utf8"));
        }
        catch (err) {
            if (err.code === "ENOENT") return null;
            throw err;
        }
    };

    try {
        const loaded = readFile(file);
        if (loaded !== null) {
            data = loaded;
        }
        else if (options.legacyFile) {
            // Data of an older version that kept it in another file
            const legacy = readFile(options.legacyFile);
            if (legacy !== null) {
                data = legacy;
                dirty = true;
            }
        }
    }
    catch (err) {
        console.log("Store " + name + " is damaged, starting empty:", err.message);
        try { fs.renameSync(file, file + ".damaged"); } catch (e) { /* nothing to keep */ }
    }

    const flush = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        if (dirty === false) return;
        dirty = false;
        try {
            fs.mkdirSync(DATA_DIR, { recursive: true });
            const temp = file + ".tmp";
            fs.writeFileSync(temp, JSON.stringify(data, null, 2), { mode: options.mode || 0o644 });
            fs.renameSync(temp, file);
        }
        catch (err) {
            dirty = true;
            console.log("Could not save " + name + ":", err.message);
        }
    };

    const changed = () => {
        dirty = true;
        if (timer === null) {
            timer = setTimeout(flush, SAVE_DELAY);
            timer.unref();
        }
    };

    const store = {
        get: (key, fallback) => data[key] !== undefined ? data[key] : fallback,
        set: (key, value) => {
            // Nothing to write when nothing changed
            if (JSON.stringify(data[key]) === JSON.stringify(value)) return;
            data[key] = value;
            changed();
        },
        delete: (key) => {
            if (data[key] === undefined) return;
            delete data[key];
            changed();
        },
        flush: flush
    };

    if (dirty === true) changed();
    stores.push(store);
    return store;
};

// Whatever is still waiting to be written goes to disk when the server stops
process.on("exit", () => stores.forEach(store => store.flush()));

module.exports = {
    open,
    DATA_DIR,
    settings: open("settings", { legacyFile: path.join(__dirname, "settings.json") }),
    secrets: open("secrets", { mode: 0o600 })
};
