const { off } = require("process");

var NUM_LEDS = 144;
var ws281x = require("rpi-ws281x-native-fixed");

const channel = ws281x(NUM_LEDS, 
    {
        stripType: "ws2812", 
        gpio: 18, 
        brightness: 150
    });

var stripData = [];
var TwinkleColors = [
    0xffffff,
    0xfcfcfc,
    0xfafafa,
    0xf7f7f7,
    0xf5f5f5,
    0xf2f2f2,
    0xf0f0f0,
    0xededed,
    0xebebeb,
    0xe8e8e8,
    0xe5e5e5,
    0xe3e3e3,
    0xe0e0e0,
    0xdedede,
    0xdbdbdb,
    0xd9d9d9,
    0xd6d6d6,
    0xd4d4d4,
    0xd1d1d1,
    0xcfcfcf,
    0xcccccc,
    0xc9c9c9,
    0xc7c7c7,
    0xc4c4c4,
    0xc2c2c2,
    0xbfbfbf,
    0xbdbdbd,
    0xbababa,
    0xb8b8b8,
    0xb5b5b5,
    0xb3b3b3,
    0xb0b0b0,
];

function strip() {
    this.Start = function(data) {
        stripData = JSON.parse(data);
        this.StripTick();
    };
    this.StripTick = function() {
        var _this = this;
        for(n = 0; n < stripData.length; n++) {
            var config = stripData[n]; 
            var numLeds = config.ledCount;
            var offset = config.offset;
            switch(config.animation) {
                case "rainbow":
                    for (let i = offset; i < numLeds; i++) {
                        var color = _this.ColorWheel((config.animationIndex + i) % 256);
                        channel.array[i] = color;
                    }
                    config.animationIndex = (config.animationIndex + 1) % 256;
                    break;
                case "solid":
                    for (let i = offset; i < offset + numLeds; i++) {
                        channel.array[i] = config.animationValue;
                    } 
                    break;
                case "fade":
                    var fadeColor1 = config.animationValue;
                    var fadeColor2 = config.animationValueAlt;
                    
                    if(!config.fadeDirection) {
                        fadeColor1 = config.animationValueAlt;
                        fadeColor2 = config.animationValue;
                    }
                    
                    var r = ((this.Int2R(fadeColor1) * (255 - config.animationIndex)) + (this.Int2R(fadeColor2) * config.animationIndex)) / 255;
                    var g = ((this.Int2G(fadeColor1) * (255 - config.animationIndex)) + (this.Int2G(fadeColor2) * config.animationIndex)) / 255;
                    var b = ((this.Int2B(fadeColor1) * (255 - config.animationIndex)) + (this.Int2B(fadeColor2) * config.animationIndex)) / 255;

                    
                    for (let i = offset; i < offset + numLeds; i++) {
                        channel.array[i] = this.Rgb2Int(r, g, b);
                    }
                    if(config.animationIndex == 255) config.fadeDirection = !config.fadeDirection;
                    config.animationIndex = (config.animationIndex + 1) % 256;
                    break;
                case "dance":
                    var maxIterations = 255;
                    var iterationIndex = 0;
                    var ledIndex = 0;
                    var intervalCount = 0;
                    var interval = setInterval(function() {                       
                        if (iterationIndex < maxIterations) {
                            if (ledIndex < numLeds) {
                                channel.array[offset + ledIndex] = _this.ColorWheel(
                                    ((ledIndex * 256) / numLeds + iterationIndex) & 255
                                );
                
                                ledIndex++;
                            } else {
                                ledIndex = 0;
                                iterationIndex++;
                            }
                        } else {
                            ledIndex = 0;
                            iterationIndex = 0;
                        } 
                        intervalCount++;
                        ws281x.render();
                        if(intervalCount > 49) {
                            clearInterval(interval);
                        }
                    }, 1);

                    config.animationIndex = iterationIndex;
                    config.animationValue = ledIndex;
                    break;
                case "twinkle":
                    if(typeof(config.animationValue) == "number"){
                        config.animationValue = [];
                    }
                    if(config.animationIndex == 0){
                        var WasTwinkling = config.fadeDirection;
                        var LastStates = config.animationValue;

                        if (!WasTwinkling) {
                            for (var x = 0; x < numLeds; x++) {
                                var init = this.getRandomInt(0, TwinkleColors.length - 1);
                                LastStates[x] = TwinkleColors[init];
                                channel.array[offset + x] = LastStates[x];
                            }            
                            WasTwinkling = true;
                        } else {
                            for (var x = 0; x < numLeds; x++) {
                                var shouldTwinkle = this.getRandomInt(0, 100);
                                if (shouldTwinkle > 10) {
                                    var currentColor = LastStates[x];
                                    var newColor = 0;
                                    var ind = TwinkleColors.indexOf(currentColor);
                                    if (ind == TwinkleColors.length + 1) {
                                        newColor = TwinkleColors[0];
                                    } else {
                                        newColor = TwinkleColors[ind + 1];
                                    }
                                    LastStates[x] = newColor;
                                    channel.array[offset + x] = LastStates[x];
                                }
                            }
                        }

                        config.fadeDirection = WasTwinkling;
                        config.animationValue = LastStates;
                    }   
                    config.animationIndex++;
                    if(config.animationIndex == 4) config.animationIndex = 0;
                    break;
            }
        }

        ws281x.render();
        setTimeout(function(){
            _this.StripTick();
        }, 50);
    };
    this.Update = function(data) {
        
    };
    this.ColorWheel = function (pos) {
        pos = 255 - pos;
        
        if (pos < 85) {
            return this.Rgb2Int(255 - pos * 3, 0, pos * 3);
        } else if (pos < 170) {
            pos -= 85;
            return this.Rgb2Int(0, pos * 3, 255 - pos * 3);
        } else {
            pos -= 170;
            return this.Rgb2Int(pos * 3, 255 - pos * 3, 0);
        }
    };
      
    this.Rgb2Int = function (r, g, b) {
        return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
    };

    this.Int2R = function(val) {
        var errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);

        return val >> 16;
    };
    
    this.Int2G = function(val) {
        var errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);

        var red = val >> 16;
        return val - (red << 16) >> 8;
    };
    
    this.Int2B = function(val) {
        var errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);

        var red = val >> 16;
        var green = val - (red << 16) >> 8;
        return val - (red << 16) - (green << 8);
    };

    this.Int2Rgb = function(val) {
        var errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);
        
        var red = int >> 16;
        var green = int - (red << 16) >> 8;
        var blue = int - (red << 16) - (green << 8);

        return {
            red: red,
            green: green,
            blue: blue
        }
    };

	this.getRandomInt = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
}

module.exports = new strip();