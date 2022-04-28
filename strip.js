/***************************************************************************
 * 
 *           LED-Strip class for PK-Automation - Tobias Ninz
 *              
 **************************************************************************/

let NUM_LEDS = 144; //FOR TESTING: TO CHANGE

let ws281x = require("rpi-ws281x-native-fixed");

const channel = ws281x(NUM_LEDS, 
    {
        stripType: "ws2812", 
        gpio: 18, 
        brightness: 20
    });

let stripData = [];
let TwinkleColors = [
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

let _updateRecieved = true;

function strip() {
    this.Start = function(data) {
        stripData = data;
        this.StripTick();
    };

    this.SetBrightness = function(brightness) {
        if(typeof(brightness) != "number") brightness = 200;
        if(brightness < 0) brightness = 0;
        if(brightness > 255) brightness = 255;
        console.log("Set brightness to " + brightness + " (0-255)");
        channel.brightness = brightness;
    };

    this.StripTick = function() {
        let _this = this;
        if(_updateRecieved) console.log(stripData);
        _updateRecieved = false;
        for(n = 0; n < stripData.length; n++) {
            let config = stripData[n]; 
            let numLeds = config.ledCount;
            let offset = config.offset;
            switch(config.animation) {
                case "rainbow":
                    for (let i = offset; i < numLeds; i++) {
                        let color = _this.ColorWheel((config.animationIndex + i) % 256);
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
                    let fadeColor1 = config.animationValue;
                    let fadeColor2 = config.animationValueAlt;
                    
                    if(!config.fadeDirection) {
                        fadeColor1 = config.animationValueAlt;
                        fadeColor2 = config.animationValue;
                    }
                    
                    let r = ((this.Int2R(fadeColor1) * (255 - config.animationIndex)) + (this.Int2R(fadeColor2) * config.animationIndex)) / 255;
                    let g = ((this.Int2G(fadeColor1) * (255 - config.animationIndex)) + (this.Int2G(fadeColor2) * config.animationIndex)) / 255;
                    let b = ((this.Int2B(fadeColor1) * (255 - config.animationIndex)) + (this.Int2B(fadeColor2) * config.animationIndex)) / 255;

                    
                    for (let i = offset; i < offset + numLeds; i++) {
                        channel.array[i] = this.Rgb2Int(r, g, b);
                    }
                    if(config.animationIndex == 255) config.fadeDirection = !config.fadeDirection;
                    config.animationIndex = (config.animationIndex + 1) % 256;
                    break;
                case "dance":
                    let maxIterations = 255;
                    let iterationIndex = config.animationIndex;
                    let ledIndex = config.animationValue;
                    let intervalCount = 0;
                    let interval = setInterval(function() {                       
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
                    if(typeof(config.animationValue) == "number") {
                        config.animationValue = [];
                    }
                    if(config.animationIndex == 0){
                        let WasTwinkling = config.fadeDirection;
                        let LastStates = config.animationValue;

                        if (!WasTwinkling) {
                            for (let x = 0; x < numLeds; x++) {
                                let init = this.getRandomInt(0, TwinkleColors.length - 1);
                                LastStates[x] = TwinkleColors[init];
                                channel.array[offset + x] = LastStates[x];
                            }            
                            WasTwinkling = true;
                        } else {
                            for (let x = 0; x < numLeds; x++) {
                                let shouldTwinkle = this.getRandomInt(0, 100);
                                if (shouldTwinkle > 10) {
                                    let currentColor = LastStates[x];
                                    let newColor = 0;
                                    let ind = TwinkleColors.indexOf(currentColor);
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
        let tmpData = null;
        if(typeof(data) == "string") {
            tmpData = JSON.parse(data);
        }
        else {
            tmpData = data;
        }
        //verify Data
        for(n = 0; n < tmpData.length; n++) {
            let _config = tmpData[n];
            if (_config.animation == "twinkle"){
                if(typeof(_config.animationValue) == "number") _config.animationValue = [];
            }
        }
        _updateRecieved = true;
        console.log(" > Update strip config");
        stripData = tmpData;
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
        let errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);

        return val >> 16;
    };
    
    this.Int2G = function(val) {
        let errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);

        let red = val >> 16;
        return val - (red << 16) >> 8;
    };
    
    this.Int2B = function(val) {
        let errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);

        let red = val >> 16;
        let green = val - (red << 16) >> 8;
        return val - (red << 16) - (green << 8);
    };

    this.Int2Rgb = function(val) {
        let errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);
        
        let red = int >> 16;
        let green = int - (red << 16) >> 8;
        let blue = int - (red << 16) - (green << 8);

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