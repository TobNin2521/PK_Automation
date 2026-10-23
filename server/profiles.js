/***************************************************************************
 *
 *           User profiles - PK-Automation
 *
 *   A profile is a name with a playlist and settings (color, effect,
 *   brightness) for the LED devices. Profiles belong to one user and are
 *   only visible to this user.
 *
 *   A user is a random id that the server hands out once (createUser) and
 *   the client keeps for good and sends with every request. The id works
 *   like a password, so only a hash of it is stored.
 *
 **************************************************************************/

const crypto = require("crypto");
const store = require("./store");
const leds = require("./leds");
const player = require("./player");

// hash of the user id -> { created, profiles: { profile id -> profile } }
const users = store.open("users");

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9]+$/;
const MAX_NAME = 40;
const MAX_PROFILES = 50;

const codedError = (message, code) => {
    let err = new Error(message);
    err.code = code;
    return err;
};

const hashId = (userId) => crypto.createHash("sha256").update(userId).digest("hex");

// What is stored is never changed in place, the store would not notice
const clone = (value) => JSON.parse(JSON.stringify(value));

const createUser = () => {
    const userId = crypto.randomBytes(24).toString("base64url");
    users.set(hashId(userId), { created: Date.now(), profiles: {} });
    return userId;
};

// Returns the hash of a known user id
const authenticate = (userId) => {
    if (typeof userId !== "string" || !USER_ID_PATTERN.test(userId)) {
        throw codedError("Missing or invalid user id", "UNKNOWN_USER");
    }
    const hash = hashId(userId);
    if (users.get(hash) === undefined) throw codedError("Unknown user id", "UNKNOWN_USER");
    return hash;
};

const cleanName = (name) => {
    if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > MAX_NAME) {
        throw new RangeError("name must have 1-" + MAX_NAME + " characters");
    }
    return name.trim();
};

const cleanPlaylistId = (playlistId) => {
    // An empty id means the profile doesn't change the playlist
    if (playlistId === "" || playlistId === null) return "";
    if (typeof playlistId !== "string" || !PLAYLIST_ID_PATTERN.test(playlistId)) {
        throw new RangeError("Invalid playlistId");
    }
    return playlistId;
};

// { ledId: { color, effect, brightness } }, same rules as for changing a LED directly
const cleanLeds = (map) => {
    if (typeof map !== "object" || map === null || Array.isArray(map)) {
        throw new RangeError("leds must be an object with the LED ids as keys");
    }
    let cleaned = {};
    for (const ledId in map) {
        if (!leds.devices.some(d => d.id === ledId)) throw new RangeError("Unknown LED device " + ledId);
        const change = leds.parseChange(map[ledId]);
        let settings = {};
        if (change.color !== undefined) settings.color = change.color;
        if (change.effect !== undefined) settings.effect = change.effect;
        if (change.brightness !== undefined) settings.brightness = change.brightness;
        if (Object.keys(settings).length === 0) throw new RangeError("Nothing to set for " + ledId);
        cleaned[ledId] = settings;
    }
    return cleaned;
};

// The playlist and the LEDs as they are right now (LEDs that can't be reached are left out)
const captureCurrent = async () => {
    let captured = { playlistId: player.snapshot().playlistId || "", leds: {} };
    for (const led of await leds.getLeds()) {
        if (led.online !== true) continue;
        captured.leds[led.id] = { color: led.color, effect: led.effect };
        if (led.brightness !== undefined) captured.leds[led.id].brightness = led.brightness;
    }
    return captured;
};

const findProfile = (user, profileId) => {
    const profile = user.profiles[profileId];
    if (!profile) throw codedError("Unknown profile", "NOT_FOUND");
    return profile;
};

const checkNameFree = (user, name, ownId) => {
    const taken = Object.values(user.profiles).some(p => p.id !== ownId && p.name.toLowerCase() === name.toLowerCase());
    if (taken) throw codedError("A profile with this name already exists", "CONFLICT");
};

const list = (userId) => {
    const user = users.get(authenticate(userId));
    return Object.values(user.profiles).sort((a, b) => a.name.localeCompare(b.name));
};

// input: { name, playlistId, leds } or { name, fromCurrent: true } to take over what is playing/shining now.
// Values that are given together with fromCurrent replace the current ones.
const create = async (userId, input) => {
    const hash = authenticate(userId);
    input = input || {};
    const name = cleanName(input.name);
    let playlistId = input.playlistId !== undefined ? cleanPlaylistId(input.playlistId) : undefined;
    let ledSettings = input.leds !== undefined ? cleanLeds(input.leds) : undefined;
    if (input.fromCurrent === true) {
        const current = await captureCurrent();
        if (playlistId === undefined) playlistId = current.playlistId;
        if (ledSettings === undefined) ledSettings = current.leds;
    }

    // Read after the waiting above, another request may have changed the profiles meanwhile
    const user = clone(users.get(hash));
    if (Object.keys(user.profiles).length >= MAX_PROFILES) {
        throw codedError("Too many profiles, the limit is " + MAX_PROFILES, "CONFLICT");
    }
    checkNameFree(user, name, null);
    const profile = {
        id: crypto.randomBytes(6).toString("hex"),
        name: name,
        playlistId: playlistId || "",
        leds: ledSettings || {},
        created: Date.now(),
        updated: Date.now()
    };
    user.profiles[profile.id] = profile;
    users.set(hash, user);
    return profile;
};

// Changes the given parts of a profile (name, playlistId, leds)
const update = (userId, profileId, input) => {
    const hash = authenticate(userId);
    input = input || {};
    const user = clone(users.get(hash));
    const profile = findProfile(user, profileId);
    if (input.name !== undefined) {
        profile.name = cleanName(input.name);
        checkNameFree(user, profile.name, profile.id);
    }
    if (input.playlistId !== undefined) profile.playlistId = cleanPlaylistId(input.playlistId);
    if (input.leds !== undefined) profile.leds = cleanLeds(input.leds);
    profile.updated = Date.now();
    users.set(hash, user);
    return profile;
};

const remove = (userId, profileId) => {
    const hash = authenticate(userId);
    const user = clone(users.get(hash));
    findProfile(user, profileId);
    delete user.profiles[profileId];
    users.set(hash, user);
};

// Sets the playlist and the LEDs of a profile, a part that fails doesn't stop the others
const apply = async (userId, profileId) => {
    const user = users.get(authenticate(userId));
    const profile = findProfile(user, profileId);
    let result = { playlist: "unchanged", leds: {} };
    let tasks = [];

    // Selecting the playlist that is already selected would only restart the music
    if (profile.playlistId !== "" && profile.playlistId !== player.snapshot().playlistId) {
        tasks.push(player.setPlaylist(profile.playlistId).then(
            () => { result.playlist = "applied"; },
            (err) => { result.playlist = "failed: " + err.message; }));
    }
    for (const ledId in profile.leds) {
        tasks.push(leds.setLed(ledId, profile.leds[ledId]).then(
            () => { result.leds[ledId] = "applied"; },
            (err) => { result.leds[ledId] = "failed: " + err.message; }));
    }
    await Promise.all(tasks);
    return result;
};

module.exports = {
    createUser,
    list,
    create,
    update,
    remove,
    apply
};
