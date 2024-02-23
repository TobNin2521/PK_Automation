/***************************************************************************
 * 
 *           Web server class for PK-Automation - Tobias Ninz
 *              
 **************************************************************************/

let __deployment = false;
let __useSSL = false;

let express = require("express");
let rpio = null;
if (os.platform() === 'linux') rpio = require('rpio');
let app = express();
let http = require('http');
let https = require('https');
let bodyParser = require("body-parser");
let path = require("path");
let os = require('os');
let fs = require("fs");

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

let rpioPins = [];

if(rpio !== null) {
    for (let i = 0; rpioPins.length; i++) {
        rpio.open(rpioPins[i], rpio.OUTPUT, rpio.LOW);
    }
}

app.post("/relay", function (request, response) {
    response.header("Access-Control-Allow-Origin", "*");
    console.log(response);
    let id = request.body.data.id;
    let status = request.body.data.status;

    console.log("Set Pin " + id + " to " + (Number(status) === 0 ? "LOW" : "HIGH"));
    
    if(rpio !== null) {
        rpio.write(Number(id), Number(status) === 0 ? rpio.LOW : rpio.HIGH);
    }
    
    response.status(200).send({ result: "success" });
});

app.get("/", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    if(__deployment){
        res.sendFile(path.join(__dirname + "/public/dev/dist/build/index.html"));
    }
    else {
        res.sendFile(path.join(__dirname, "../website/pk-interface/build/index.html"));
    }
});

//let privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
//let certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

//let credentials = { key: privateKey, cert: certificate };

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