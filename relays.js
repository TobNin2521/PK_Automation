var gpio = require("rpi-gpio");
var used_Gpios = [7, 9, 10, 13];

for (var gpio in used_Gpios) {
    //gpio.setup(gpio, gpio.DIR_OUT);
}

function relays() {
    this.Update = function() {

    };

    this.Write = function(pin, value) {
        gpio.write(pin, value);
    };
}

module.exports = new relays();