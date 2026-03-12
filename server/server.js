/***************************************************************************
 * 
 *           Web server class for PK-Automation - Tobias Ninz
 *              
 **************************************************************************/

let __deployment = false;
let __useSSL = true;

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
const querystring = require("querystring");
var cookieParser = require('cookie-parser');

if (__deployment) {
    app.use(express.static(path.join(__dirname, "/public/dev/dist/build")));
}
else {
    app.use(express.static(path.join(__dirname, "../website/pk-interface/build")));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet.frameguard());
app.use(cookieParser());

let HTTP_PORT = 8443;
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
    clientSecret = '04c5a62ceefc468c927a6f952d637eab',//'58f52f4a09434c5d955f1ea7bbe6fafc',
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
    next();
});

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
    //res.redirect(authorizeURL);
});
let rfToken = "";
app.get("/callback", function (req, res) {
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
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var access_token = body.access_token,
                    refresh_token = body.refresh_token;
                rfToken = refresh_token;
                res.send({status: "success", token: access_token, refresh_token: refresh_token});
            } else {
                res.send({status: "error"});
            }
        });
    }
});

app.get("/refresh", function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    var refresh_token = rfToken;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64')) 
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        console.log(response.statusCode, error)
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token,
            refresh_token = body.refresh_token;
            res.send({
                'access_token': access_token,
                'refresh_token': refresh_token
            });
        }
        else {       
            res.send({status: "error"});
        }
    });
});


const allowedOrigins = ['www.example1.com', 'www.example2.com', 'http://localhost:3000', 'http://localhost:8080', "http://192.168.56.1:3000", "http://192.168.56.1:8080", "https://127.0.0.1:8443"];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        return callback(null, true);
    }

}));

if (__useSSL) {
    var server = https.createServer({
        key: fs.readFileSync('./ssl/cert.key'),
        cert: fs.readFileSync('./ssl/cert.pem')
    }, app).listen(HTTP_PORT, function(){
        console.log("***********************************************************************");
        console.log(" PK Automation ");
        console.log(" Web Server listening at the location below, or by host name and port. ");
        console.log(" https://" + localAddress + ":" + HTTP_PORT);
        console.log("***********************************************************************");
    });
}
else {
    let server = http.createServer(app).listen(HTTP_PORT, function () {
        console.log("***********************************************************************");
        console.log(" PK Automation ");
        console.log(" Web Server listening at the location below, or by host name and port. ");
        console.log(" http://" + localAddress + ":" + HTTP_PORT);
        console.log("***********************************************************************");
    });
}
