var __deployment = false;

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
var os = require('os');
const { resolveAny } = require("dns");

app.use(express.static(__dirname + "/public/dist/build"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var strip = null;
var relays = null;

if(__deployment) {
    strip = require("./strip.js");
    relays = require("./relays.js");
}
fs = require("fs");
var stripData = JSON.parse(fs.readFileSync("./config/leds.json", "utf8"));
var relayData = JSON.parse(fs.readFileSync("./config/lights.json", "utf8"));

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
    var id = request.body.data.id;
    var animation = request.body.data.animation;
    var animationValue = request.body.data.animationValue;
    var animationValueAlt = request.body.data.animationValueAlt;
    console.log(" > Set LED config");
    console.log(" >> ID: " + id);
    console.log(" >> Animation: " + animation);
    console.log(" >> AnimationValue: " + animationValue);
    console.log(" >> AnimationValueAlt: " + animationValueAlt);

    var tmpData = JSON.parse(stripData);
    for(var config in tmpData) {
        if(config.id == id) {
            config.animation = animation ? animation : "rainbow";
            switch(config.animation){
                case "rainbow":
                    config.animationValue = 0;
                    config.animationValueAlt = 0;
                    config.animationIndex = 0;
                    config.fadeDirection = true;
                    break;
                case "solid":
                    config.animationValue = animationValue ? animationValue : 0;
                    config.animationValueAlt = 0;
                    config.animationIndex = 0;
                    config.fadeDirection = true;
                    break;
                case "fade":
                    config.animationValue = animationValue ? animationValue : 0;
                    config.animationValueAlt = animationValueAlt ? animationValueAlt : 0;
                    config.animationIndex = 0;
                    config.fadeDirection = true;
                    break;
                case "dance":
                    config.animationValue = 0;
                    config.animationValueAlt = 0;
                    config.animationIndex = 0;
                    config.fadeDirection = true;
                    break;
                case "twinkle":
                    config.animationValue = [];
                    config.animationValueAlt = 0;
                    config.animationIndex = 0;
                    config.fadeDirection = false;
                    break;
            }
        }
    }
    stripData = JSON.stringify(tmpData);

    if(__deployment) {
        strip.Update(stripData);
    }
    response.status(200).send({result: "success"});
});

app.post("/lights", function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");
    console.log(response);
    var id = request.body.data.id;
    var state = request.body.data.state;
    console.log(" > Set Light config");
    console.log(" >> ID: " + id);
    console.log(" >> State: " + state);

    var tmpData = JSON.parse(relayData);
    for(var config in tmpData) {
        if(config.id == id) {
            config.state = state;
        }
    }
    relayData = JSON.stringify(tmpData);

    if(__deployment) {
        relays.Update(relayData);
    }

    response.status(200).send({result: "success"});
});

app.post("/brightness", function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");
    var brightness = request.body.brightness;
    console.log(" > Set LED brightness");
    console.log(" >> Brightness: " + brightness);
    if(__deployment) {
        strip.SetBrightness(brightness);
    }
    response.status(200).send({result: "success"});	
});

app.get("/", function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.sendFile(path.join(__dirname + "/public/dev/dist/build/index.html"));
});

app.get("/config/leds", function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
    stripData = JSON.parse(fs.readFileSync("./config/leds.json", "utf8"));
    res.send(JSON.stringify(stripData));
});

app.get("/config/lights", function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
    relayData = JSON.parse(fs.readFileSync("./config/lights.json", "utf8"));
    res.send(JSON.stringify(relayData));
});

var server = app.listen(HTTP_PORT, function () {
	console.log("***********************************************************************");
	console.log(" PK Automation ");
	console.log(" Web Server listening at the location below, or by host name and port. ");
	console.log(" http://" + localAddress + ":" + HTTP_PORT);
	console.log("***********************************************************************");
    if(__deployment) {
        strip.Start(stripData);
        relays.Start(relayData);
    }
});