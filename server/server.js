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

if (__deployment) {
    app.use(express.static(path.join(__dirname, "/public/dev/dist/build")));
}
else {
    app.use(express.static(path.join(__dirname, "../website/pk-interface/build")));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
        rpio.open(rpioPins[i], rpio.OUTPUT, rpio.LOW);
    }
}

app.post("/relay", function (request, response) {
    response.header("Access-Control-Allow-Origin", "*");
    console.log(response);
    let id = request.body.id;
    let status = request.body.status;
    rpioStatus[id.toString()] = Number(status) === 1;

    console.log("Set Pin " + id + " to " + (Number(status) === 0 ? "LOW" : "HIGH"));

    if (rpio !== null) {
        rpio.write(Number(id), Number(status) === 0 ? rpio.LOW : rpio.HIGH);
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

var scopes = ['user-read-private', 'user-read-email'],
    redirectUri = 'http://localhost:8080/callback',
    clientId = '93f99cd3786048ae99ae5cd292283605',
    state = generateRandomString(16),
    showDialog = true,
    responseType = 'token';

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi({
    redirectUri: redirectUri,
    clientId: clientId
});

// Create the authorization URL
var authorizeURL = spotifyApi.createAuthorizeURL(
    scopes,
    state,
    showDialog,
    responseType
);
var start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
require('child_process').exec(start + ' ' + authorizeURL);

app.get("/callback", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    console.log("CALLBACK");
});


//let privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
//let certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

//let credentials = { key: privateKey, cert: certificate };
const allowedOrigins = ['www.example1.com', 'www.example2.com', 'http://localhost:3000'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        /*if (allowedOrigins.includes(origin)) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }*/
        return callback(null, true);
    }

}));

let httpServer = http.createServer(app);
//let httpsServer = https.createServer(credentials, app);

if (__useSSL) {
    /*
    let server = httpsServer.listen(HTTPS_PORT, function () {
        console.log("***********************************************************************");
        console.log(" PK Automation ");
        console.log(" Web Server listening at the location below, or by host name and port. ");
        console.log(" https://" + localAddress + ":" + HTTPS_PORT);
        console.log("***********************************************************************");
    });
    */
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
