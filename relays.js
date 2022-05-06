/***************************************************************************
 * 
 *             Relay class for PK-Automation - Tobias Ninz
 *              
 **************************************************************************/

// Maybe this package is a better fit for my use case https://github.com/jperkin/node-rpio //To test
// This package is much faster and has I2C, SPI and PWM support (could be useful for slave communication)

 module.exports = function relays(__deployment) {     // Same functionality with alternative io-package: rpio
    let module = {};
    console.log(" > Initialize Relay module with 'deployment'=" + __deployment);
    module.relayData = [];
    module.rpio = { 
        open: (pin, mode, state) => {
            console.log(" > Open pin " + pin + " with mode " + (mode == 2 ? "OUTPUT" : "INPUT") + (state && state === 1 ? ", init state ON" : ", init state OFF"));
        }, 
        write: (pin, state) => {
            console.log(" > Write " + (state === 1 ? "ON" : "OFF") + " to pin " + pin);
        }, 
        msleep: (millis) => {
            console.log(" > Sleep for " + millis + "ms");
        }, 
        LOW: 0, 
        HIGH: 1, 
        OUTPUT: 2, 
        INPUT: 3
    };
    module.Start = function(_relayData) {
        if(__deployment) module.rpio = require("rpio");
        module.relayData = module.ParseDataIfString(_relayData);
        for(let i = 0; i < module.relayData.length; i++) {
            let state = module.relayData[i].state == true ? module.rpio.HIGH : module.rpio.LOW;
            module.rpio.open(module.relayData[i].pin, module.rpio.OUTPUT, state);
        }
    };
    module.Update = function(_relayData) {
        module.relayData = module.ParseDataIfString(_relayData);
        for(let i = 0; i < module.relayData.length; i++) {
            let state = module.relayData[i].state == true ? module.rpio.HIGH : module.rpio.LOW;
            module.rpio.write(module.relayData[i].pin, state);
        }
        return module.relayData;
    };
    module.ParseDataIfString = function(data) {
        if(typeof(data) === "string") return JSON.parse(data);
        return data;
    };
    return module;
};

