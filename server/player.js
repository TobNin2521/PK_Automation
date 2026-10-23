/***************************************************************************
 *
 *           Queue and playlist handling - PK-Automation
 *
 *   The browser only plays what next() returns. Every change is announced
 *   with a "state" event, "skip" asks the player to move on to the next track.
 *
 **************************************************************************/

const EventEmitter = require("events");
const spotify = require("./spotify");
const store = require("./store");

const events = new EventEmitter();

// Only the head of the playlist is sent to the clients, the rest can be thousands of tracks
const SNAPSHOT_TRACKS = 100;

// The selected playlist is remembered over restarts
let playlistId = store.settings.get("playlistId", "");
let playlist = null;
let playlistTracks = [];
let userQueue = [];
let current = null;
let loading = false;
let loadCounter = 0;

const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
};

const snapshot = () => {
    return {
        loggedIn: spotify.isLoggedIn(),
        playlistId: playlistId,
        playlist: playlist,
        loading: loading,
        current: current,
        userQueue: userQueue,
        playlistQueue: playlistTracks.slice(0, SNAPSHOT_TRACKS),
        playlistTotal: playlistTracks.length
    };
};

const emitState = () => events.emit("state", snapshot());

const skip = () => events.emit("skip");

const loadPlaylist = async (id) => {
    const thisLoad = ++loadCounter;
    loading = true;
    emitState();
    try {
        const [info, tracks] = await Promise.all([spotify.getPlaylist(id), spotify.getPlaylistTracks(id)]);
        // A newer playlist was selected while this one was loading
        if (thisLoad !== loadCounter) return false;
        playlist = info;
        playlistTracks = shuffle(tracks);
        playlistId = id;
        store.settings.set("playlistId", playlistId);
        return true;
    }
    finally {
        if (thisLoad === loadCounter) {
            loading = false;
            emitState();
        }
    }
};

// Selecting a playlist restarts the music with it
const setPlaylist = async (id) => {
    if (await loadPlaylist(id)) skip();
};

// Called after the Spotify login, loads the playlist that was selected before the server was restarted
const onLogin = () => {
    if (playlistId !== "" && playlistTracks.length === 0 && loading === false) {
        loadPlaylist(playlistId).catch(err => console.log("Could not load playlist:", err.message));
    }
    else {
        emitState();
    }
};

const addTrack = async (trackId, playNow) => {
    const track = await spotify.getTrack(trackId);
    if (playNow === true) userQueue.unshift(track);
    else userQueue.push(track);
    emitState();
    if (playNow === true) skip();
};

const removeTrack = (index) => {
    if (!Number.isInteger(index) || index < 0 || index >= userQueue.length) {
        throw new RangeError("Invalid queue index");
    }
    userQueue.splice(index, 1);
    emitState();
};

const moveTrack = (list, from, to) => {
    const tracks = list === "user" ? userQueue : (list === "playlist" ? playlistTracks : null);
    if (tracks === null) throw new RangeError("Unknown list");
    if (!Number.isInteger(from) || !Number.isInteger(to) ||
        from < 0 || from >= tracks.length || to < 0 || to >= tracks.length) {
        throw new RangeError("Invalid index");
    }
    tracks.splice(to, 0, tracks.splice(from, 1)[0]);
    emitState();
};

// The next track to play: queued tracks first, then the playlist (a played track goes to the end of it)
const next = () => {
    let track = null;
    if (userQueue.length > 0) {
        track = userQueue.shift();
    }
    else if (playlistTracks.length > 0) {
        track = playlistTracks.shift();
        playlistTracks.push(track);
    }
    current = track;
    emitState();
    return track;
};

module.exports = {
    events,
    snapshot,
    setPlaylist,
    onLogin,
    addTrack,
    removeTrack,
    moveTrack,
    next,
    skip
};
