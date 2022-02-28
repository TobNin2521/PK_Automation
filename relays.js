var gpio = require("rpi-gpio");
var relayData = [];

function relays() {
    this.Start = function(_relayData) {
        relayData = _relayData;
        //First option
        for (var config in relayData) {
            gpio.setup(config.pin, gpio.DIR_OUT);
        }
    };
    this.Update = function(_relayData) {
        relayData = JSON.parse(_relayData);
        for (var config in relayData) {
            this.Write(config.pin, config.state);
        }
    };

    this.Write = function(pin, value) {
        //First option
        gpio.write(pin, value);
        //Second option
        gpio.setup(pin, gpio.DIR_OUT, function(err) {
            if (err) console.log(err);
            gpio.write(pin, value, function(err) {
                if (err) console.log(err);
                else console.log("Set state of pin " + pin + " to " + value);
            });
        });
    };
}

module.exports = new relays();