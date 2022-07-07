/***************************************************************************
 * 
 *           Web server class for PK-Automation - Tobias Ninz
 *              
 **************************************************************************/

let __deployment = false;
let __master_slave = true;
let __useSSL = false;

let express = require("express");
let app = express();
let http = require('http');
let https = require('https');
let bodyParser = require("body-parser");
let path = require("path");
let os = require('os');
let fs = require("fs");
const { resolveAny } = require("dns");
const { response } = require("express");

app.use(express.static(__dirname + "/public/dist/build"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let strip = null;
let relays = null;
    
let stripData = JSON.parse(fs.readFileSync("./config/leds.json", "utf8"));
let relayData = JSON.parse(fs.readFileSync("./config/lights.json", "utf8"));

let HTTP_PORT = 8080;
let HTTPS_PORT = 8443;
let localAddress = "";
if(localAddress == "") {    
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

app.post("/leds/status", function(request, response) {
	response.header("Access-Control-Allow-Origin", "*");
    let id = request.body.data.id;
    let status = request.body.data.status;
    console.log(" > Set LED status");
    console.log(" >> ID: " + id);
    console.log(" >> Status: " + status);
    
    let tmpData = null;
    if(typeof(stripData) == "string") {
        tmpData = JSON.parse(stripData);
    }
    else {
        tmpData = stripData;
    }

    for(let i = 0; i < tmpData.length; i++) {
        let config = tmpData[i];
        if(config.id == id) {
            config.status = status ? status : true;
            console.log(" > Update strip status of id " + config.id + " to " + config.status);
        }
    }

    stripData = JSON.stringify(tmpData);

    if(!__master_slave) {
        console.log(" > Send updated data to strip handler");
        stripData = strip.Update(stripData);
    }

    response.status(200).send({result: "success"});
});

app.post("/leds", function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");
    let id = request.body.data.id;
    let animation = request.body.data.animation;
    let animationValue = request.body.data.animationValue;
    let animationValueAlt = request.body.data.animationValueAlt;
    console.log(" > Set LED config");
    console.log(" >> ID: " + id);
    console.log(" >> Animation: " + animation);
    console.log(" >> AnimationValue: " + animationValue);
    console.log(" >> AnimationValueAlt: " + animationValueAlt);

    let tmpData = null;
    if(typeof(stripData) == "string") {
        tmpData = JSON.parse(stripData);
    }
    else {
        tmpData = stripData;
    }
    for(let i = 0; i < tmpData.length; i++) {
        let config = tmpData[i];
        if(config.id == id) {
            config.animation = animation ? animation : "rainbow";
            console.log(" > Update strip config of id " + config.id + " to animation " + config.animation);
            config.animationIndex = 0;
            switch(config.animation){
                case "rainbow":
                    config.animationValue = 0;
                    config.animationValueAlt = 0;
                    config.fadeDirection = true;
                    break;
                case "solid":
                    config.animationValue = animationValue ? animationValue : 0;
                    config.animationValueAlt = 0;
                    config.fadeDirection = true;
                    break;
                case "fade":
                    config.animationValue = animationValue ? animationValue : 0;
                    config.animationValueAlt = animationValueAlt ? animationValueAlt : 0;
                    config.fadeDirection = true;
                    break;
                case "dance":
                    config.animationValue = 0;
                    config.animationValueAlt = 0;
                    config.fadeDirection = true;
                    break;
                case "twinkle":
                    config.animationValue = [];
                    config.animationValueAlt = 0;
                    config.fadeDirection = false;
                    break;
                case "fire":
                    config.animationValue = animationValue ? animationValue : 0;
                    config.animationValueAlt = [];
                    config.fadeDirection = false;
                    break;
                case "meteor":
                    config.animationValue = animationValue ? animationValue : 0;
                    config.animationValueAlt = 0;
                    config.fadeDirection = false;
                    break;
            }
        }
    }
    stripData = JSON.stringify(tmpData);

    if(!__master_slave){
        console.log(" > Send updated data to strip handler");
        stripData = strip.Update(stripData);
    }

    response.status(200).send({result: "success"});
});

app.post("/lights", function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");
    console.log(response);
    let id = request.body.data.id;
    let state = request.body.data.state;
    console.log(" > Set Light config");
    console.log(" >> ID: " + id);
    console.log(" >> State: " + state);

    let tmpData = JSON.parse(relayData);
    for(let config in tmpData) {
        if(config.id == id) {
            config.state = state;
        }
    }
    relayData = JSON.stringify(tmpData);

    relayData = relays.Update(relayData);

    response.status(200).send({result: "success"});
});

app.post("/brightness", function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");
    let brightness = request.body.data.brightness;
    console.log(" > Set LED brightness");
    console.log(" >> Brightness: " + brightness);
    
    if(!__master_slave) {
        strip.SetBrightness(brightness);
    }
    else{
        let slaveID = request.body.data.slaveId;
        let tmpData = JSON.parse(stripData);
        for(let config in tmpData) {
            if(config.id == slaveID) {
                config.brightness = brightness;
            }
        }
        stripData = JSON.stringify(tmpData);
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

app.get("/leds/config_by_id", function(req, res) {    
	res.header("Access-Control-Allow-Origin", "*");
    let id = req.query.led;
    let retval = {};
    let parsedData = typeof(stripData) === "string" ? JSON.parse(stripData) : stripData;
    for(let i = 0; i < parsedData.length; i++) {
        if(parsedData[i].id == id) {
            retval = parsedData[i];
        }
    }
    res.send(JSON.stringify(retval));
});

app.get("/config/lights", function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
    relayData = JSON.parse(fs.readFileSync("./config/lights.json", "utf8"));
    res.send(JSON.stringify(relayData));
});

app.get("/profiles", function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");    
    res.send(JSON.stringify(fs.readdirSync("./profiles/")));
});

app.post("/profiles/set", function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");
    let profile = request.body.profile;
    console.log(" > Set Profile");
    console.log(" >> Profile: " + profile);

    let profileData = JSON.parse(fs.readFileSync("./profiles/" + profile, "utf8"));

    let ledData = JSON.stringify(profileData.leds);
    let ioData = JSON.stringify(profileData.lights);
    
    if(!__master_slave){
        strip.Update(ledData);
    }
    relays.Update(ioData);
    stripData = ledData;
    relayData = ioData;

    //TODO: Write configuration to files
    
    response.status(200).send({result: "success"});	
});

app.post("/profiles/savecurrent", function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");

    let newProfile = {
        "leds": [],
        "lights": []
    };
    let profileName = request.body.profileName;

    if(typeof(stripData) == "string") {
        newProfile.leds = JSON.parse(stripData);
    }
    else {
        newProfile.leds = stripData;
    }
    if(typeof(relayData) == "string") {
        newProfile.lights = JSON.parse(relayData);
    }
    else {
        newProfile.lights = relayData;
    }

    fs.writeFileSync("./profiles/" + profileName + ".json", newProfile);
    
    response.status(200).send({result: "success"});	
});

let privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
let certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

let credentials = {key: privateKey, cert: certificate};

let httpServer = http.createServer(app);
let httpsServer = https.createServer(credentials, app);

if(__useSSL){
    let server = httpsServer.listen(HTTPS_PORT, function () {
        console.log("***********************************************************************");
        console.log(" PK Automation ");
        console.log(" Web Server listening at the location below, or by host name and port. ");
        console.log(" https://" + localAddress + ":" + HTTPS_PORT);
        console.log("***********************************************************************");
        if(!__master_slave){
            strip = require("./strip.js")(__deployment);
            strip.Start(stripData);
        }
        relays = require("./relays.js")(__deployment);
        relays.Start(relayData);
    });
}
else{
    let server = httpServer.listen(HTTP_PORT, function () {
        console.log("***********************************************************************");
        console.log(" PK Automation ");
        console.log(" Web Server listening at the location below, or by host name and port. ");
        console.log(" http://" + localAddress + ":" + HTTP_PORT);
        console.log("***********************************************************************");
        
        if(!__master_slave) {
            strip = require("./strip.js")(__deployment);
            strip.Start(stripData);
        }
        relays = require("./relays.js")(__deployment);
        relays.Start(relayData);
    });
}