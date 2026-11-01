/***************************************************************************
 *
 *           Music and LED api for PK-Automation
 *
 *   GET  /api/events           event stream: "state" (queue changed), "skip" (play the next track now),
 *                              "led" (state of an LED device changed)
 *   GET  /api/info             what this server is (to check a server that was found with mDNS, see mdns.js)
 *   GET  /api/state            current state (queues, playlist, current track)
 *   GET  /api/search/tracks    ?q=
 *   GET  /api/search/playlists ?q=
 *   POST /api/queue            {trackId, playNow}  add a track (playNow puts it first and skips)
 *   POST /api/queue/remove     {index}             remove a track from the user queue
 *   POST /api/queue/move       {list, from, to}    list is "user" or "playlist"
 *   POST /api/playlist         {playlistId}        select the playlist and restart with it
 *   POST /api/player/next      take the next track to play, answers {track}
 *   POST /api/player/skip      tell the player to skip the current track
 *
 *   POST /api/user             create a user, answers {userId}. The client keeps the id for good and sends it as
 *                              the header X-User-Id with the profile requests, profiles are only visible to their user
 *   GET  /api/profiles         the profiles of the user
 *   POST /api/profiles         {name, playlistId, leds: {ledId: {color, effect, brightness}}} create a profile, with
 *                              fromCurrent: true it takes over the playlist and LEDs as they are now
 *   PUT  /api/profiles/:id     {name, playlistId, leds} change parts of a profile
 *   DELETE /api/profiles/:id   delete a profile
 *   POST /api/profiles/:id/apply  set the playlist and the LEDs of the profile
 *
 *   GET  /api/dmtools          state of the link to DM Tools (see dmtools.js): {url, state, code, codeExpires, userId,
 *                              lastSync, error}. This and the next two only from the server itself (its own display)
 *   POST /api/dmtools          {url} set the address of DM Tools, answers the state
 *   DELETE /api/dmtools        forget the address and the token, the controller can be paired again
 *
 *   GET  /api/leds             state of all LED devices
 *   GET  /api/leds/:id         state of one LED device (id as in leds.js)
 *   GET  /api/leds/endpoints   the addresses of the LED devices: {endpoints: [{id, name, address}]}. This and the next
 *                              only from the server itself
 *   POST /api/leds/endpoints/:id  {address} point the LED device to a new address, answers {endpoints}
 *   POST /api/leds/:id         {on, brightness, color: [r, g, b], effect}  change any of these, answers the new state
 *
 **************************************************************************/

const player = require("./player");
const spotify = require("./spotify");
const leds = require("./leds");
const profiles = require("./profiles");
const dmtools = require("./dmtools");

const ID_PATTERN = /^[A-Za-z0-9]+$/;
const LOCAL_ADDRESSES = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

module.exports = function (app) {
    let clients = [];

    const sendEvent = (res, event, data) => {
        res.write("event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n");
    };

    player.events.on("state", (state) => clients.forEach(res => sendEvent(res, "state", state)));
    player.events.on("skip", () => clients.forEach(res => sendEvent(res, "skip", {})));
    leds.events.on("led", (led) => clients.forEach(res => sendEvent(res, "led", led)));
    // Keeps idle connections open
    setInterval(() => clients.forEach(res => res.write(": ping\n\n")), 25000);

    app.get("/api/events", function (req, res) {
        req.socket.setTimeout(0);
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });
        res.write("retry: 2000\n\n");
        // A client that (re)connects gets the full state first
        sendEvent(res, "state", player.snapshot());
        clients.push(res);
        req.on("close", () => {
            clients = clients.filter(c => c !== res);
        });
    });

    const handle = (fn) => {
        return (req, res) => {
            Promise.resolve().then(() => fn(req, res)).catch((err) => {
                console.log("API error:", err.message);
                let status = 500;
                if (err.code === "NOT_LOGGED_IN" || err.code === "UNKNOWN_USER") status = 401;
                else if (err.code === "CONFLICT") status = 409;
                else if (err.code === "FORBIDDEN") status = 403;
                else if (err.code === "NOT_FOUND") status = 404;
                else if (err.code === "DEVICE_OFFLINE") status = 502;
                else if (err instanceof RangeError) status = 400;
                res.status(status).send({ status: "error", message: err.message });
            });
        };
    };

    const requireId = (id) => {
        if (typeof id !== "string" || !ID_PATTERN.test(id)) throw new RangeError("Invalid id");
        return id;
    };

    app.get("/api/info", handle((req, res) => {
        res.send({ name: "PK Automation", apiVersion: 1, features: ["music", "leds", "profiles"] });
    }));

    app.get("/api/state", handle((req, res) => {
        res.send(player.snapshot());
    }));

    app.get("/api/search/tracks", handle(async (req, res) => {
        const query = req.query.q ? String(req.query.q) : "";
        res.send({ tracks: query === "" ? [] : await spotify.searchTracks(query) });
    }));

    app.get("/api/search/playlists", handle(async (req, res) => {
        const query = req.query.q ? String(req.query.q) : "";
        res.send({ playlists: query === "" ? [] : await spotify.searchPlaylists(query) });
    }));

    app.post("/api/queue", handle(async (req, res) => {
        await player.addTrack(requireId(req.body.trackId), req.body.playNow === true);
        res.send({ status: "success" });
    }));

    app.post("/api/queue/remove", handle((req, res) => {
        player.removeTrack(req.body.index);
        res.send({ status: "success" });
    }));

    app.post("/api/queue/move", handle((req, res) => {
        player.moveTrack(req.body.list, req.body.from, req.body.to);
        res.send({ status: "success" });
    }));

    app.post("/api/playlist", handle(async (req, res) => {
        await player.setPlaylist(requireId(req.body.playlistId));
        res.send({ status: "success" });
    }));

    app.post("/api/player/next", handle((req, res) => {
        res.send({ track: player.next() });
    }));

    app.post("/api/player/skip", handle((req, res) => {
        player.skip();
        res.send({ status: "success" });
    }));

    // The link to DM Tools decides who may switch profiles and shows the pairing code, so unlike the rest of the
    // api (open to the whole network) it can only be used from the server itself, i.e. its own display
    const requireLocal = (req, message) => {
        if (!LOCAL_ADDRESSES.includes(req.socket.remoteAddress)) {
            throw dmtools.codedError(message || "The DM Tools link can only be changed from the server itself", "FORBIDDEN");
        }
    };

    app.get("/api/dmtools", handle((req, res) => {
        requireLocal(req);
        res.send(dmtools.status());
    }));

    app.post("/api/dmtools", handle((req, res) => {
        requireLocal(req);
        dmtools.setUrl(req.body.url);
        res.send(dmtools.status());
    }));

    app.delete("/api/dmtools", handle((req, res) => {
        requireLocal(req);
        dmtools.reset();
        res.send({ status: "success" });
    }));

    app.get("/api/leds", handle(async (req, res) => {
        res.send({ leds: await leds.getLeds() });
    }));

    // Like the DM Tools link: the addresses decide where the server sends requests, so only from its own display
    app.get("/api/leds/endpoints", handle((req, res) => {
        requireLocal(req, "The LED addresses can only be changed from the server itself");
        res.send({ endpoints: leds.getEndpoints() });
    }));

    app.post("/api/leds/endpoints/:id", handle((req, res) => {
        requireLocal(req, "The LED addresses can only be changed from the server itself");
        res.send({ endpoints: leds.setAddress(req.params.id, req.body.address) });
    }));

    app.get("/api/leds/:id", handle(async (req, res) => {
        res.send(await leds.getLed(req.params.id));
    }));

    app.post("/api/leds/:id", handle(async (req, res) => {
        res.send(await leds.setLed(req.params.id, req.body));
    }));

    const userId = (req) => req.get("X-User-Id");

    app.post("/api/user", handle((req, res) => {
        res.send({ userId: profiles.createUser() });
    }));

    app.get("/api/profiles", handle((req, res) => {
        res.send({ profiles: profiles.list(userId(req)) });
    }));

    app.post("/api/profiles", handle(async (req, res) => {
        res.send(await profiles.create(userId(req), req.body));
    }));

    app.put("/api/profiles/:id", handle((req, res) => {
        res.send(profiles.update(userId(req), req.params.id, req.body));
    }));

    app.delete("/api/profiles/:id", handle((req, res) => {
        profiles.remove(userId(req), req.params.id);
        res.send({ status: "success" });
    }));

    app.post("/api/profiles/:id/apply", handle(async (req, res) => {
        res.send(await profiles.apply(userId(req), req.params.id));
    }));
};
