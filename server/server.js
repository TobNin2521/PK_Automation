/***************************************************************************
 * 
 *           Web server class for PK-Automation - Tobias Ninz
 *              
 **************************************************************************/

let __deployment = false;
let __useSSL = false;

let express = require("express");
let rpio = null;
let os = require('os');
if (os.platform() === 'linux') rpio = require('rpio');
let app = express();
var cors = require('cors');
let http = require('http');
let https = require('https');
let bodyParser = require("body-parser");
let path = require("path");
let fs = require("fs");
let request = require('request');
const crypto = require("crypto");
const helmet = require('helmet');

if (__deployment) {
    app.use(express.static(path.join(__dirname, "/public/dev/dist/build")));
}
else {
    app.use(express.static(path.join(__dirname, "../website/pk-interface/build")));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet.frameguard());

let HTTP_PORT = 8080;
let HTTPS_PORT = 8443;
let localAddress = "";
if (localAddress == "") {
    let interfaces = os.networkInterfaces();
    for (let k in interfaces) {
        for (let k2 in interfaces[k]) {
            let address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                localAddress = address.address;
                break;
            }
        }
    }
}

let rpioPins = [33, 35, 38, 40, 37, 13];
let rpioStatus = {
    "33": false,
    "35": false,
    "38": false,
    "40": false,
    "37": false,
    "13": false
};

if (rpio !== null) {
    for (let i = 0; i < rpioPins.length; i++) {
        rpio.open(rpioPins[i], rpio.OUTPUT, rpio.HIGH);
    }
}

app.post("/relay", function (request, response) {
    response.header("Access-Control-Allow-Origin", "*");
    let id = request.body.id;
    let status = request.body.status;
    rpioStatus[id.toString()] = Number(status) === 1;

    console.log("Set Pin " + id + " to " + (Number(status) === 0 ? "LOW" : "HIGH"));

    if (rpio !== null) {
        rpio.write(Number(id), Number(status) === 1 ? rpio.LOW : rpio.HIGH);
    }

    response.status(200).send({ result: "success" });
});
app.get("/relay/status", function (request, response) {
    response.header("Access-Control-Allow-Origin", "*");
    let pin = request.query.id;
    response.status(200).send({ status: rpioStatus[pin.toString()] });
});

app.get("/", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    if (__deployment) {
        res.sendFile(path.join(__dirname + "/public/dev/dist/build/index.html"));
    }
    else {
        res.sendFile(path.join(__dirname, "../website/pk-interface/build/index.html"));
    }
});

const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

var SpotifyWebApi = require('spotify-web-api-node');

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
    redirectUri = 'http://localhost:8080/callback',
    clientId = '05ea3c29182e4a3884da1bad303a7f54', //'93f99cd3786048ae99ae5cd292283605', //
    clientSecret = '24f75783f0f34538a8683874535d5c52',//'58f52f4a09434c5d955f1ea7bbe6fafc',
    state = generateRandomString(16),
    showDialog = false,
    responseType = 'token';

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi({
    redirectUri: redirectUri,
    clientId: clientId,
    clientSecret: clientSecret
});

// Create the authorization URL
var authorizeURL = spotifyApi.createAuthorizeURL(
    scopes,
    state,
    showDialog
);

app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Content-Security-Policy', 'frame-ancestors http://localhost:8080 http://localhost:8080/dnd http://localhost:3000');
    /*
    if (['/login', '/callback', '/refresh', '/relay/status', '/relay'].includes(req.originalUrl)) {
        console.log("Redirect next()");
    }
    else {
        if (__deployment) {
            res.sendFile(path.join(__dirname + "/public/dev/dist/build/index.html"));
        }
        else {
            res.sendFile(path.join(__dirname, "../website/pk-interface/build/index.html"));
        }
    }
    */
    next();
    //next();
});
let spotifyInitialized = false;

app.get("/login", function(req, res) {
    console.log('Spotify Login');
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Content-Security-Policy', 'frame-ancestors http://localhost:8080 http://localhost:8080/dnd http://localhost:3000');
    res.redirect(authorizeURL);
});

app.get("/callback", function (req, res) {
    console.log('Spotify Callback');
    res.header("Access-Control-Allow-Origin", "*");
    let code = req.query.code;
    spotifyApi.authorizationCodeGrant(code).then(
        function(data) {
          spotifyApi.setAccessToken(data.body['access_token']);
          spotifyApi.setRefreshToken(data.body['refresh_token']);
          spotifyInitialized = true;
          res.send({status: "success", token: data.body['access_token'], refresh_token: data.body['refresh_token']});
        },
        function(err) {
          console.log('Something went wrong!', err);
          res.send({status: "error"});
        }
    );
});

let playlist = "";
let tracks = [];
let userTracks = [];

const ShuffleArray = (array) => {
    if(array === undefined) return [];
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}


app.get("/spotify/playlist/tracks/add", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    if (spotifyInitialized === false) res.send({ status: "error" });
    else {
        let id = req.query.id;
        if (id !== undefined && id !== null && id !== "") {
            spotifyApi.getTrack(id, {
                fields: 'items'
            }).then((data) => {
                userTracks = [...userTracks, data.body.items];
                res.send(tracks);
            });
        }
        else {
            res.send({ status: "error" });
        }
    }
});
app.get("/spotify/playlist/tracks", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.send([...userTracks, ...tracks]);
});
app.get("/spotify/playlist/set", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    if (spotifyInitialized === false) res.send({ status: "error" });
    else {
        let id = req.query.id;
        userTracks = [];
        if (id !== undefined && id !== null && id !== "" && id !== playlist) {
            console.log("Set Playlist ", id);
            playlist = id;
            spotifyApi.getPlaylistTracks(id, {
                fields: 'items'
            }).then((data) => {
                if (data.body.items !== undefined && data.body.items.length > 0) {
                    console.log("Get Playlist Tracks", data.body.items.length);
                    tracks = ShuffleArray(data.body.items);
                    res.send(tracks);
                }
                else {
                    spotifyApi.getPlaylist(id)
                        .then(function (data) {
                            console.log("Get Playlist Tracks", data.body.tracks.length);
                            tracks = ShuffleArray(data.body.tracks);
                            res.send(tracks);
                    }, function (err) {
                        console.log('Something went wrong!', err);
                    });
                }
            });
        }
        else {
            res.send({ status: "error" });
        }
    }
});

app.get("/spotify/tracks/next", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    console.log("Get next track", tracks.length);
    if(userTracks.length > 0) {
        res.send(userTracks.shift());
    }
    else {
        let t = tracks.shift();
        tracks.push(t);
        res.send(tracks[0]);
    }
});

app.get("/refresh", function (req, res) {
    console.log('Spotify Refresh');
    res.header("Access-Control-Allow-Origin", "*");
    if (spotifyInitialized === false) res.send({ status: "error" });
    else {
        spotifyApi.refreshAccessToken().then(
            function(data) {
            console.log('The access token has been refreshed!');      
            spotifyApi.setAccessToken(data.body['access_token']);
            res.send({status: "success", token: data.body['access_token'], refresh_token: data.body['refresh_token']});
            },
            function(err) {
            console.log('Could not refresh access token', err);
            res.send({status: "error"});
            }
        );
    }
});

const allowedOrigins = ['www.example1.com', 'www.example2.com', 'http://localhost:3000', 'http://localhost:8080', 'http://localhost:8080/dnd', "http://192.168.56.1:3000", "http://192.168.56.1:8080"];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        return callback(null, true);
    }

}));

let httpServer = http.createServer(app);

if (__useSSL) {
}
else {
    let server = httpServer.listen(HTTP_PORT, function () {
        console.log("***********************************************************************");
        console.log(" PK Automation ");
        console.log(" Web Server listening at the location below, or by host name and port. ");
        console.log(" http://" + localAddress + ":" + HTTP_PORT);
        console.log("***********************************************************************");
    });
}
