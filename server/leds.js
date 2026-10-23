/***************************************************************************
 *
 *           LED control (WLED devices) - PK-Automation
 *
 *   The WLED devices are only talked to from here, clients (website, other
 *   devices on the network) use the api in api.js. Every change is announced
 *   with a "led" event.
 *
 **************************************************************************/

const EventEmitter = require("events");

const events = new EventEmitter();

// The WLED devices, the id is used by the api and the website
const devices = [
    { id: "bar", name: "Bar", address: "http://192.168.178.107" },
    { id: "wand", name: "Wand", address: "http://192.168.178.66" }
];

const TIMEOUT = 2500;
const DEFAULT_COLOR = [255, 0, 0];

// The effect list of a device doesn't change, it is only loaded once
const effectCache = {};

const codedError = (message, code) => {
    let err = new Error(message);
    err.code = code;
    return err;
};

const findDevice = (id) => {
    const device = devices.find(d => d.id === id);
    if (!device) throw codedError("Unknown LED device", "NOT_FOUND");
    return device;
};

const request = async (device, path, body) => {
    try {
        const response = await fetch(device.address + path, {
            method: body === undefined ? "GET" : "POST",
            headers: body === undefined ? undefined : { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(TIMEOUT)
        });
        if (!response.ok) throw new Error("status " + response.status);
        return await response.json();
    }
    catch (err) {
        throw codedError(device.name + " is not reachable (" + err.message + ")", "DEVICE_OFFLINE");
    }
};

const readEffects = async (device) => {
    if (!effectCache[device.id]) {
        const effects = await request(device, "/json/eff");
        // Newer firmware appends the parameters of an effect after an @
        effectCache[device.id] = effects.map(name => String(name).split("@")[0]);
    }
    return effectCache[device.id];
};

const readState = async (device) => {
    const state = await request(device, "/json/state");
    let effects = [];
    try {
        effects = await readEffects(device);
    }
    catch (err) {
        console.log(err.message);
    }
    const segment = state.seg && state.seg.length > 0 ? state.seg[0] : {};
    return {
        id: device.id,
        name: device.name,
        online: true,
        on: state.on === true,
        brightness: state.bri,
        color: segment.col && segment.col.length > 0 ? segment.col[0].slice(0, 3) : DEFAULT_COLOR,
        effect: segment.fx || 0,
        effects: effects
    };
};

const getLed = async (id) => {
    return readState(findDevice(id));
};

// All devices, one that can't be reached is reported as offline
const getLeds = async () => {
    return Promise.all(devices.map(device => readState(device).catch(err => {
        return { id: device.id, name: device.name, online: false, message: err.message };
    })));
};

const isByte = (value) => Number.isInteger(value) && value >= 0 && value <= 255;

// Checks a change and returns only the valid fields: on (true/false), brightness (0-255), color ([r, g, b]),
// effect (index of state.effects). Throws a RangeError for anything invalid.
const parseChange = (change) => {
    if (typeof change !== "object" || change === null || Array.isArray(change)) {
        throw new RangeError("Expected an object with the changes");
    }
    let parsed = {};
    if (change.on !== undefined) {
        if (typeof change.on !== "boolean") throw new RangeError("on must be true or false");
        parsed.on = change.on;
    }
    if (change.brightness !== undefined) {
        if (!isByte(change.brightness)) throw new RangeError("brightness must be 0-255");
        parsed.brightness = change.brightness;
    }
    if (change.color !== undefined) {
        if (!Array.isArray(change.color) || change.color.length !== 3 || !change.color.every(isByte)) {
            throw new RangeError("color must be [r, g, b] with 0-255");
        }
        parsed.color = change.color;
    }
    if (change.effect !== undefined) {
        if (!Number.isInteger(change.effect) || change.effect < 0) throw new RangeError("effect must be an effect index");
        parsed.effect = change.effect;
    }
    return parsed;
};

// Changes any of the fields of parseChange
const setLed = async (id, change) => {
    const device = findDevice(id);
    const parsed = parseChange(change);
    let wled = {};
    let segment = {};

    if (parsed.on !== undefined) wled.on = parsed.on;
    if (parsed.brightness !== undefined) wled.bri = parsed.brightness;
    if (parsed.color !== undefined) segment.col = [parsed.color];
    if (parsed.effect !== undefined) segment.fx = parsed.effect;
    if (Object.keys(segment).length > 0) wled.seg = [segment];
    if (Object.keys(wled).length === 0) throw new RangeError("Nothing to change");

    await request(device, "/json/state", wled);
    const state = await readState(device);
    events.emit("led", state);
    return state;
};

module.exports = {
    events,
    devices,
    getLed,
    getLeds,
    setLed,
    parseChange
};
