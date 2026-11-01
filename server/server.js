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
const helmet = require('helmet');
var cookieParser = require('cookie-parser');
let spotify = require("./spotify");
let player = require("./player");
let registerMusicApi = require("./api");
let mdns = require("./mdns");

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
    findAddress:
    for (let k in interfaces) {
        for (let k2 in interfaces[k]) {
            let address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                localAddress = address.address;
                break findAddress;
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

    // The relays are active-low, status 1 (on) drives the pin LOW
    console.log("Set Pin " + id + " to " + (Number(status) === 1 ? "LOW" : "HIGH"));

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

app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');
    next();
});

// Spotify login (/login, /callback, /refresh) and the music api (/api/...), see spotify.js, api.js and player.js
spotify.registerAuthRoutes(app, () => player.onLogin());
registerMusicApi(app);
// The login of the last run is still valid, no need to wait for a browser to log in again
if (spotify.isLoggedIn()) player.onLogin();
// LED addresses that were changed on the display
require("./leds").loadAddresses();

// Link to DM Tools, only runs when it has been set up (dmtools.js)
require("./dmtools").start();

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
        mdns.publish(HTTP_PORT, true);
    });
}
else {
    let server = http.createServer(app).listen(HTTP_PORT, function () {
        console.log("***********************************************************************");
        console.log(" PK Automation ");
        console.log(" Web Server listening at the location below, or by host name and port. ");
        console.log(" http://" + localAddress + ":" + HTTP_PORT);
        console.log("***********************************************************************");
        mdns.publish(HTTP_PORT, false);
    });
}
