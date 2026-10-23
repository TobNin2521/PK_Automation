/***************************************************************************
 *
 *           Spotify login, token handling and web api client - PK-Automation
 *
 **************************************************************************/

const crypto = require("crypto");
const querystring = require("querystring");
const store = require("./store");

const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

var stateKey = 'spotify_auth_state';
var scopes = [
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-library-modify',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public'
  ],
    redirectUri = 'https://127.0.0.1:8443/callback',
    clientId = '64db2b32c9504a93b476dfa1caf45187', //'93f99cd3786048ae99ae5cd292283605',
    clientSecret = '04c5a62ceefc468c927a6f952d637eab';//'58f52f4a09434c5d955f1ea7bbe6fafc',

// An access token is renewed when it has less than this left, so the browser always gets a usable one
const TOKEN_MARGIN = 5 * 60 * 1000;

// The refresh token is kept over restarts, so nobody has to log in again
let refreshToken = store.secrets.get("spotifyRefreshToken", "");
let accessToken = "";
let accessTokenExpires = 0;
let refreshing = null;

const isLoggedIn = () => refreshToken !== "";

const notLoggedInError = () => {
    let err = new Error("Not logged in to Spotify");
    err.code = "NOT_LOGGED_IN";
    return err;
};

const requestToken = async (form) => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: new URLSearchParams(form)
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        let err = new Error("Spotify token request failed (" + response.status + ")");
        // The login was revoked or expired, a new login is needed
        err.invalidGrant = body.error === "invalid_grant";
        throw err;
    }
    return response.json();
};

const storeToken = (body) => {
    accessToken = body.access_token;
    accessTokenExpires = Date.now() + (body.expires_in || 3600) * 1000;
    // Spotify only sends a new refresh token sometimes, keep the old one otherwise
    if (body.refresh_token) {
        refreshToken = body.refresh_token;
        store.secrets.set("spotifyRefreshToken", refreshToken);
    }
};

// Returns a valid access token, or null when nobody is logged in yet
const getAccessToken = async (force) => {
    if (!isLoggedIn()) return null;
    if (!force && Date.now() < accessTokenExpires - TOKEN_MARGIN) return accessToken;
    if (refreshing === null) {
        // Parallel callers share one refresh request
        refreshing = requestToken({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }).then(storeToken).catch((err) => {
            if (err.invalidGrant === true) {
                refreshToken = "";
                store.secrets.delete("spotifyRefreshToken");
            }
            throw err;
        }).finally(() => { refreshing = null; });
    }
    await refreshing;
    return accessToken;
};

const registerAuthRoutes = (app, onLogin) => {
    app.get("/login", function(req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Content-Security-Policy', 'frame-ancestors https://127.0.0.1:8443');
        console.log("Spotify Login called");
        var state = generateRandomString(16);
        var scope = scopes.join(' ');
        res.cookie(stateKey, state);

        res.redirect('https://accounts.spotify.com/authorize?' +
            querystring.stringify({
            response_type: 'code',
            client_id: clientId,
            scope: scope,
            redirect_uri: redirectUri,
            state: state
        }));
    });

    app.get("/callback", async function (req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        console.log("Spotify callback called");
        var code = req.query.code || null;
        var state = req.query.state || null;
        var storedState = req.cookies ? req.cookies[stateKey] : null;

        if (state === null || state !== storedState) {
            res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
            return;
        }

        res.clearCookie(stateKey);
        try {
            storeToken(await requestToken({
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            }));
            onLogin();
            // The page gets its access token from /refresh, the refresh token stays on the server
            res.redirect('/');
        }
        catch (err) {
            console.log(err.message);
            res.send({status: "error"});
        }
    });

    // Access token for the web player in the browser
    app.get("/refresh", async function(req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        try {
            const token = await getAccessToken(false);
            if (token === null) {
                res.send({status: "error"});
                return;
            }
            res.send({access_token: token});
        }
        catch (err) {
            console.log("Spotify refresh failed", err.message);
            res.send({status: "error"});
        }
    });
};

/**************************************************************************
 *  Web api
 **************************************************************************/

const apiGet = async (path, params) => {
    const url = new URL(path.startsWith("http") ? path : "https://api.spotify.com/v1" + path);
    for (let key in params) {
        url.searchParams.set(key, params[key]);
    }
    for (let attempt = 0; attempt < 2; attempt++) {
        // The second attempt forces a new token, the first one might have been revoked
        const token = await getAccessToken(attempt > 0);
        if (token === null) throw notLoggedInError();
        const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
        if (response.status === 401 && attempt === 0) continue;
        if (!response.ok) {
            throw new Error("Spotify request failed (" + response.status + ") " + url.pathname);
        }
        return response.json();
    }
};

// Only what the clients need, the raw spotify objects are huge
const compactTrack = (track) => {
    return {
        id: track.id,
        name: track.name,
        artist: track.artists && track.artists.length > 0 ? track.artists[0].name : "",
        image: track.album && track.album.images && track.album.images.length > 0 ? track.album.images[0].url : "",
        duration_ms: track.duration_ms
    };
};

const compactPlaylist = (playlist) => {
    let total = 0;
    if (playlist.items) total = playlist.items.total;
    else if (playlist.tracks) total = playlist.tracks.total;
    return {
        id: playlist.id,
        name: playlist.name,
        owner: playlist.owner ? playlist.owner.display_name : "",
        image: playlist.images && playlist.images.length > 0 ? playlist.images[0].url : "",
        total: total
    };
};

const searchTracks = async (query) => {
    const body = await apiGet("/search", { q: query, type: "track" });
    return body.tracks.items.filter(t => t && t.id).map(compactTrack);
};

const searchPlaylists = async (query) => {
    const body = await apiGet("/search", { q: query, type: "playlist" });
    return body.playlists.items.filter(p => p && p.public === true).map(compactPlaylist);
};

const getTrack = async (id) => {
    return compactTrack(await apiGet("/tracks/" + id));
};

const getPlaylist = async (id) => {
    return compactPlaylist(await apiGet("/playlists/" + id));
};

// All tracks of a playlist. Removed/unavailable and local tracks have no item or no id and can't be played
const getPlaylistTracks = async (id) => {
    let tracks = [];
    let url = "/playlists/" + id + "/items";
    while (url) {
        const body = await apiGet(url);
        tracks = tracks.concat(body.items);
        url = body.next;
    }
    return tracks.filter(t => t && t.item && t.item.id && t.item.album).map(t => compactTrack(t.item));
};

module.exports = {
    registerAuthRoutes,
    isLoggedIn,
    getAccessToken,
    searchTracks,
    searchPlaylists,
    getTrack,
    getPlaylist,
    getPlaylistTracks
};
