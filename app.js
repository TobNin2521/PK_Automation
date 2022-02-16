var __deployment = true;

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
var os = require('os');
const { resolveAny } = require("dns");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var strip = null;
var relays = null;

if(__deployment) {
    strip = require("./strip.js");
    relays = require("./relays.js");
}
fs = require("fs");
var stripData = fs.readFileSync("./config/default.json", "utf8");

var HTTP_PORT = 8080;
var localAddress = "";
if(localAddress == "") {    
    var interfaces = os.networkInterfaces();
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                localAddress = address.address;
                break;
            }
        }
    }
}

app.post("/leds", function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");

	
});

app.post("/lights", function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");

});

app.get("/", function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.sendFile(path.join(__dirname + "/app.html"));
});

app.get("/config", function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
    stripData = fs.readFileSync("./config/default.json", "utf8");
    res.send(stripData);
});

var server = app.listen(HTTP_PORT, function () {
	console.log("***********************************************************************");
	console.log(" PK Automation ");
	console.log(" Web Server listening at the location below, or by host name and port. ");
	console.log(" http://" + localAddress + ":" + HTTP_PORT);
	console.log("***********************************************************************");
    if(__deployment) {
        strip.Start(stripData);
    }
});