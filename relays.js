/***************************************************************************
 * 
 *             Relay class for PK-Automation - Tobias Ninz
 *              
 **************************************************************************/

// Maybe this package is a better fit for my use case https://github.com/jperkin/node-rpio //To test
// This package is much faster and has I2C, SPI and PWM support (could be useful for slave communication)

 module.exports = function relays(__deployment) {
     let module = {};
    console.log(" > Initialize Relay module with 'deployment'=" + __deployment);
    module.gpio = {Write: ()=>{}, setup: ()=>{}, DIR_OUT: ""};
    module.relayData = [];
    module.Start = function(_relayData) {
        if(__deployment) {
            module.gpio = require("rpi-gpio");
        }

        module.relayData = _relayData;
        //First option
        for (let config in module.relayData) {
            module.gpio.setup(config.pin, module.gpio.DIR_OUT);
        }
    };
    module.Update = function(_relayData) {
        if(typeof(_relayData)  == "string"){
            module.relayData = JSON.parse(_relayData);
        }
        else{
            module.relayData = _relayData;
        }
        for(let n = 0; n < module.relayData.length; n++) {
            let config = module.relayData[n];
            module.Write(config.pin, config.state);
        }
        return module.relayData;
    };

    module.Write = function(pin, value) {
        //First option
        module.gpio.write(pin, value);
        //Second option
        module.gpio.setup(pin, module.gpio.DIR_OUT, function(err) {
            if (err) console.log(err);
            module.gpio.write(pin, value, function(err) {
                if (err) console.log(err);
                else console.log("Set state of pin " + pin + " to " + value);
            });
        });
    };

    return module;
};