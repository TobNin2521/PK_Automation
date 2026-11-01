/***************************************************************************
 *
 *           DM Tools link - PK-Automation
 *
 *   Lets a game master switch the profiles of one PK user from DM Tools and
 *   save the current lighting as a new profile. The server calls DM Tools
 *   (outbound only, so no port forwarding, mDNS or bridge is needed) every
 *   few seconds: it reports the profiles of the user and the profile it
 *   applied last, and is told what the game master asked for.
 *
 *   Pairing needs nothing to be typed on the server. It makes up its own
 *   token and user (kept in secrets.json) and calls DM Tools. When DM Tools
 *   doesn't know the token yet, the server registers it and gets a short code,
 *   which the website shows on the display of the server. The game master types
 *   that code in DM Tools and from then on the calls work. When the game master
 *   removes the controller in DM Tools the server notices and shows a new code.
 *
 *   The address of DM Tools is in settings.json (DEFAULT_URL below, or
 *   POST /api/dmtools, see api.js).
 *
 **************************************************************************/

const crypto = require("crypto");

// Address of DM Tools, e.g. "https://dm-tools.example.com". Empty: the link stays off until
// the address is set on the display of the server (or with POST /api/dmtools).
const DEFAULT_URL = "";

const SYNC_PATH = "/api/pk/sync";
const PAIR_PATH = "/api/pk/pair";
const SECRET_KEY = "dmtools";
const URL_KEY = "dmtoolsUrl";
const ACTIVE_KEY = "dmtoolsActive";

const DEFAULT_POLL = 2000;
const MIN_POLL = 1000;
const MAX_POLL = 30000;
const PAIRING_POLL = 5000;      // while waiting for the game master to type the code
const RENEW_BEFORE = 30000;     // a code that expires within this time is replaced
const REQUEST_TIMEOUT = 10000;

// An address of DM Tools without path, as the origin of the page the game master uses
const cleanUrl = (url) => {
    let parsed = null;
    try {
        parsed = new URL(url);
    }
    catch (err) {
        throw new RangeError("url must be the address of DM Tools");
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        throw new RangeError("url must start with https:// or http://");
    }
    return parsed.origin;
};

// "K7QM4XTD" -> "K7QM-4XTD"
const formatCode = (code) => code.slice(0, 4) + "-" + code.slice(4);

/**
 * deps: {
 *   profiles   the profiles module (createUser, list, create, apply)
 *   store      the store module (settings, secrets)
 *   fetch      defaults to the global fetch (Node 18 or newer, as in leds.js)
 *   log
 * }
 */
const create = (deps) => {
    const profiles = deps.profiles;
    const store = deps.store;
    const request = deps.fetch || fetch;
    const log = deps.log || (() => {});

    let state = "off";          // off, pairing (waiting for the code to be typed), linked, offline
    let pairing = null;         // { code, expires } while state is "pairing"
    let ack = 0;                // last request of DM Tools that was dealt with, applied or not
    let active = store.settings.get(ACTIVE_KEY, null);
    let pollMs = DEFAULT_POLL;
    let failures = 0;
    let timer = null;
    let generation = 0;         // a new start() makes a loop that is still running stop
    let lastSync = null;
    let lastError = null;

    const url = () => store.settings.get(URL_KEY, DEFAULT_URL) || "";

    // The token and the user of this server, made up the first time they are needed
    const identity = () => {
        const saved = store.secrets.get(SECRET_KEY, null) || {};
        let id = { token: saved.token, userId: saved.userId };
        if (!id.token) id.token = crypto.randomBytes(32).toString("base64url");
        if (!id.userId) id.userId = profiles.createUser();
        store.secrets.set(SECRET_KEY, id);
        return id;
    };

    const post = async (base, path, token, body) => {
        let headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = "Bearer " + token;
        const response = await request(base + path, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        if (!response.ok) {
            let err = new Error("HTTP " + response.status);
            err.status = response.status;
            throw err;
        }
        return await response.json();
    };

    // The profiles of the user. A user that is gone (users.json was lost) is made again
    const listProfiles = (id) => {
        try {
            return profiles.list(id.userId);
        }
        catch (err) {
            if (err.code !== "UNKNOWN_USER") throw err;
            id.userId = profiles.createUser();
            store.secrets.set(SECRET_KEY, id);
            return profiles.list(id.userId);
        }
    };

    // Applies the profile DM Tools asked for. Never throws, DM Tools is told "done" either way
    const applyRequested = async (id, profileId) => {
        log("DM Tools asks for profile " + profileId);
        try {
            const result = await profiles.apply(id.userId, profileId);
            const parts = [result.playlist].concat(Object.values(result.leds));
            const failed = parts.filter(part => String(part).startsWith("failed"));
            if (failed.length > 0) log("DM Tools profile: " + failed.join(", "));
            // Counts as the active one unless nothing worked
            if (failed.length < parts.length) {
                active = profileId;
                store.settings.set(ACTIVE_KEY, active);
            }
        }
        catch (err) {
            log("Could not apply profile " + profileId + ": " + err.message);
        }
    };

    // Saves the playlist and the LEDs as they are now as a new profile. Never throws either
    const saveRequested = async (id, name) => {
        log("DM Tools asks to save the current lighting as " + name);
        try {
            const profile = await profiles.create(id.userId, { name: name, fromCurrent: true });
            active = profile.id;
            store.settings.set(ACTIVE_KEY, active);
        }
        catch (err) {
            log("Could not save profile " + name + ": " + err.message);
        }
    };

    // DM Tools doesn't know this server (yet): get a code to show, unless the last one still holds
    const register = async (base, token) => {
        if (pairing !== null && pairing.expires - Date.now() > RENEW_BEFORE) return;
        const reply = await post(base, PAIR_PATH, null, { token: token });
        if (reply.paired === true) {
            // Claimed in the meantime, the next call gets in
            pairing = null;
            return;
        }
        pairing = { code: reply.code, expires: Date.parse(reply.expiresAt) };
        log("DM Tools pairing code: " + formatCode(pairing.code));
    };

    // One call to DM Tools
    const sync = async () => {
        const base = url();
        if (base === "") {
            state = "off";
            return;
        }
        const id = identity();

        const list = listProfiles(id).map(p => ({ id: p.id, name: p.name }));
        let body = { profiles: list };
        if (active !== null && list.some(p => p.id === active)) body.active = active;
        if (ack > 0) body.ack = ack;

        let reply = null;
        try {
            reply = await post(base, SYNC_PATH, id.token, body);
        }
        catch (err) {
            if (err.status !== 401) throw err;
            // Not paired (or removed in DM Tools): a new pairing starts counting requests from zero
            ack = 0;
            state = "pairing";
            await register(base, id.token);
            return;
        }
        state = "linked";
        pairing = null;
        lastSync = Date.now();

        const command = reply.command;
        if (command && command.seq > ack) {
            if (command.action === "save") await saveRequested(id, command.name);
            else await applyRequested(id, command.profile);
            ack = command.seq;
        }
        pollMs = Math.min(MAX_POLL, Math.max(MIN_POLL, Number(reply.pollMs) || DEFAULT_POLL));
    };

    const loop = async (mine) => {
        try {
            await sync();
            if (failures > 0) log("DM Tools link restored");
            failures = 0;
            lastError = null;
        }
        catch (err) {
            lastError = err.message;
            state = "offline";
            // Only the first failure is logged, not every retry
            if (failures === 0) log("DM Tools link failed: " + err.message);
            failures++;
        }
        if (mine !== generation) return;
        // Back off while DM Tools is unreachable
        let delay = failures === 0 ? pollMs : Math.min(MAX_POLL, pollMs * Math.pow(2, failures));
        if (failures === 0 && state === "pairing") delay = PAIRING_POLL;
        timer = setTimeout(() => loop(mine), delay);
        timer.unref();
    };

    const stop = () => {
        generation++;
        clearTimeout(timer);
    };

    const start = () => {
        stop();
        failures = 0;
        lastError = null;
        pairing = null;
        ack = 0;
        if (url() === "") {
            state = "off";
            log("DM Tools link is off (no address set)");
            return;
        }
        log("DM Tools link on: " + url());
        loop(generation);
    };

    const setUrl = (input) => {
        store.settings.set(URL_KEY, cleanUrl(input));
        store.settings.flush();
        start();
    };

    // Forgets the address and the token, so the controller can be paired somewhere else. The user and its profiles stay
    const reset = () => {
        stop();
        store.settings.delete(URL_KEY);
        store.settings.flush();
        const saved = store.secrets.get(SECRET_KEY, null);
        if (saved !== null) store.secrets.set(SECRET_KEY, { userId: saved.userId });
        store.secrets.flush();
        state = "off";
        pairing = null;
        ack = 0;
        lastSync = null;
        lastError = null;
    };

    const status = () => {
        const saved = store.secrets.get(SECRET_KEY, null);
        return {
            url: url() || null,
            state: state,
            code: state === "pairing" && pairing !== null ? formatCode(pairing.code) : null,
            codeExpires: state === "pairing" && pairing !== null ? new Date(pairing.expires).toISOString() : null,
            userId: saved !== null && saved.userId ? saved.userId : null,
            lastSync: lastSync !== null ? new Date(lastSync).toISOString() : null,
            error: lastError
        };
    };

    return { start, stop, sync, setUrl, reset, status };
};

const codedError = (message, code) => {
    let err = new Error(message);
    err.code = code;
    return err;
};

// The link of this server, created when it is first used so that the pieces it needs load only then
let instance = null;
const link = () => {
    if (instance === null) {
        instance = create({
            profiles: require("./profiles"),
            store: require("./store"),
            log: (message) => console.log(message)
        });
    }
    return instance;
};

module.exports = {
    create,
    codedError,
    start: () => link().start(),
    setUrl: (url) => link().setUrl(url),
    reset: () => link().reset(),
    status: () => link().status()
};
