/***************************************************************************
 * 
 *           LED-Strip class for PK-Automation - Tobias Ninz
 *              
 **************************************************************************/

 module.exports = function strip(__deployment) {
    console.log(" > Initialize Strip module with 'deployment'=" + __deployment);
    let module = {};
    module.NUM_LEDS = 144;
    module.ws281x = {render: () => {}};
    module.channel = {array: Array(module.NUM_LEDS).fill(0)};
    module.stripData = [];
    module.UpdateRecieved = false;
    module.TwinkleColors = [
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
    module.Start = function(data) {        
        if(__deployment) {
            module.ws281x = require("rpi-ws281x-native-fixed");
            module.channel = module.ws281x(module.NUM_LEDS, 
            {
                stripType: "ws2812", 
                gpio: 18, 
                brightness: 20
            });
        }
        module.stripData = module.ParseDataIfString(data);
        module.StripTick();
    };
    module.SetBrightness = function(brightness) {
        if(typeof(brightness) != "number") brightness = 200;
        if(brightness < 0) brightness = 0;
        if(brightness > 255) brightness = 255;
        console.log("Set brightness to " + brightness + " (0-255)");
        module.channel.brightness = brightness;
    };
    module.StripTick = function() {
        if(module.UpdateRecieved) console.log(module.stripData);
        module.UpdateRecieved = false;
        for(let n = 0; n < module.stripData.length; n++) {
            let config = module.stripData[n]; 
            let numLeds = config.ledCount;
            let offset = config.offset;
            if(module.CheckStatus(offset, numLeds, config)){
                switch(config.animation) {
                    case "rainbow":
                        config = module.RainbowEffect(offset, numLeds, config);
                        break;
                    case "solid":
                        config = module.SolidEffect(offset, numLeds, config);
                        break;
                    case "fade":
                        config = module.FadeEffect(offset, numLeds, config);
                        break;
                    case "dance":
                        module.DanceEffect(offset, numLeds, config, function(c) {
                            config = c;
                        });
                        break;
                    case "twinkle":
                        config = module.TwinkleEffect(offset, numLeds, config);
                        break;
                    case "fire":
                        config = module.FireEffect(offset, numLeds, config);
                        break;
                    case "meteor":
                        config = module.MeteorEffect(offset, numLeds, config);
                        break;
                }
                module.stripData[n] = config;
            }
        }

        module.ws281x.render();
        setTimeout(function(){
            module.StripTick();
        }, 50);
    };
    module.Update = function(data) {
        console.log(" > Update strip config");
        module.UpdateRecieved = true;
        let tmpData = module.ParseDataIfString(data);
        //verify Data
        for(let n = 0; n < tmpData.length; n++) {
            let _config = tmpData[n];
            if (_config.animation == "twinkle"){
                if(typeof(_config.animationValue) == "number") _config.animationValue = [];
            }
            if (_config.animation == "fire"){
                if(typeof(_config.animationValue) == "number") _config.animationValue = [];
            }
        }
        module.stripData = tmpData;
        return module.stripData;
    };
    module.CheckStatus = function(offset, numLeds, config){
        if(config.status === true) return true;
        for(let i = offset; i < offset + numLeds; i++){
            module.channel.array[i] = 0;
        }
        return false;
    };
    module.ColorWheel = function (pos) {
        pos = 255 - pos;
        
        if (pos < 85) {
            return module.Rgb2Int(255 - pos * 3, 0, pos * 3);
        } else if (pos < 170) {
            pos -= 85;
            return module.Rgb2Int(0, pos * 3, 255 - pos * 3);
        } else {
            pos -= 170;
            return module.Rgb2Int(pos * 3, 255 - pos * 3, 0);
        }
    };     
    module.RainbowEffect = function(offset, numLeds, config) {
        for (let i = offset; i < numLeds; i++) {
            let color = module.ColorWheel((config.animationIndex + i) % 256);
            module.channel.array[i] = color;
        }
        config.animationIndex = (config.animationIndex + 1) % 256;
        return config;
    };
    module.SolidEffect = function(offset, numLeds, config) {
        for (let i = offset; i < offset + numLeds; i++) {
            module.channel.array[i] = config.animationValue;
        }
        return config;
    };
    module.FadeEffect = function(offset, numLeds, config) {
        let fadeColor1 = config.animationValue;
        let fadeColor2 = config.animationValueAlt;
        
        if(!config.fadeDirection) {
            fadeColor1 = config.animationValueAlt;
            fadeColor2 = config.animationValue;
        }
        
        let r = ((module.Int2R(fadeColor1) * (255 - config.animationIndex)) + (module.Int2R(fadeColor2) * config.animationIndex)) / 255;
        let g = ((module.Int2G(fadeColor1) * (255 - config.animationIndex)) + (module.Int2G(fadeColor2) * config.animationIndex)) / 255;
        let b = ((module.Int2B(fadeColor1) * (255 - config.animationIndex)) + (module.Int2B(fadeColor2) * config.animationIndex)) / 255;

        
        for (let i = offset; i < offset + numLeds; i++) {
            module.channel.array[i] = module.Rgb2Int(r, g, b);
        }
        if(config.animationIndex == 255) config.fadeDirection = !config.fadeDirection;
        config.animationIndex = (config.animationIndex + 1) % 256;
        return config;
    };
    module.DanceEffect = function(offset, numLeds, config, callback) {
        let maxIterations = 255;
        let iterationIndex = config.animationIndex;
        let ledIndex = config.animationValue;
        let intervalCount = 0;
        let interval = setInterval(function() {                       
            if (iterationIndex < maxIterations) {
                if (ledIndex < numLeds) {
                    module.channel.array[offset + ledIndex] = module.ColorWheel(
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
            module.ws281x.render();
            if(intervalCount > 49) {
                config.animationIndex = iterationIndex;
                config.animationValue = ledIndex;
                callback(config);
                clearInterval(interval);
            }
        }, 1);
    };
    module.TwinkleEffect = function(offset, numLeds, config) {
        if(typeof(config.animationValue) == "number") {
            config.animationValue = [];
        }
        if(config.animationIndex == 0){
            let WasTwinkling = config.fadeDirection;
            let LastStates = config.animationValue;

            if (!WasTwinkling) {
                for (let x = 0; x < numLeds; x++) {
                    let init = module.getRandomInt(0, module.TwinkleColors.length - 1);
                    LastStates[x] = module.TwinkleColors[init];
                    module.channel.array[offset + x] = LastStates[x];
                }            
                WasTwinkling = true;
            } else {
                for (let x = 0; x < numLeds; x++) {
                    let shouldTwinkle = module.getRandomInt(0, 100);
                    if (shouldTwinkle > 10) {
                        let currentColor = LastStates[x];
                        let newColor = 0;
                        let ind = module.TwinkleColors.indexOf(currentColor);
                        if (ind == module.TwinkleColors.length + 1) {
                            newColor = module.TwinkleColors[0];
                        } else {
                            newColor = module.TwinkleColors[ind + 1];
                        }
                        LastStates[x] = newColor;
                        module.channel.array[offset + x] = LastStates[x];
                    }
                }
            }

            config.fadeDirection = WasTwinkling;
            config.animationValue = LastStates;
        }   
        config.animationIndex++;
        if(config.animationIndex == 4) config.animationIndex = 0;
        return config;
    }; 
    module.FireEffect = function(offset, numLeds, config) {
        let cooldown;

        if(typeof(config.animationValueAlt) === "number" || config.animationValueAlt == []) config.animationValueAlt = Array(numLeds).fill(0);

        let heat = config.animationValueAlt;

        let Cooling = 55;
        let Sparking = 120;
        let spectum = config.animationValue; //0=red, 1=green, 2=blue
        
        for(let i = 0; i < numLeds; i++) {
            cooldown = module.getRandomInt(0, ((Cooling * 10) / numLeds) + 2);
        
            if(cooldown > heat[i]) {
                heat[i] = 0;
            } else {
                heat[i] = heat[i] - cooldown;
            }
        }
        
        for(let k = numLeds - 1; k >= 2; k--) {
            heat[k] = (heat[k - 1] + heat[k - 2] + heat[k - 2]) / 3;
        }
        
        if(module.getRandomInt(0, 255) < Sparking) {
            let y = module.getRandomInt(0, 7);
            heat[y] = heat[y] + module.getRandomInt(160, 255);
        }

        for(let i = offset; i < numLeds + offset; i++) {
            let t192 = Math.round((heat[i - offset] / 255.0) * 191);
            
            let heatramp = t192 & 0x3F;
            heatramp <<= 2;

            let color = 0;
            if(t192 > 0x80) {
                if(spectum == 0) {
                    color = module.Rgb2Int(255, 255, heatramp);
                }
                else if(spectum == 1) {
                    color = module.Rgb2Int(heatramp, 255, 255);
                }
                else {
                    color = module.Rgb2Int(255, heatramp, 255);
                }
            } 
            else if(t192 > 0x40) {
                if(spectum == 0) {
                    color = module.Rgb2Int(255, heatramp, 0);
                }
                else if(spectum == 1) {
                    color = module.Rgb2Int(0, 255, heatramp);
                }
                else {
                    color = module.Rgb2Int(heatramp, 0, 255);
                }
            } 
            else {
                if(spectum == 0) {
                    color = module.Rgb2Int(heatramp, 0, 0);
                }
                else if(spectum == 1) {
                    color = module.Rgb2Int(0, heatramp, 0);
                }
                else {
                    color = module.Rgb2Int(0, 0, heatramp);
                }
            }

            module.channel.array[i] = color;
        }

        config.animationValueAlt = heat;

        return config;
    };
    module.MeteorEffect = function(offset, numLeds, config) {
        let red = module.Int2R(config.animationValue);
        let green = module.Int2G(config.animationValue);
        let blue = module.Int2B(config.animationValue);
        let i = config.animationIndex;

        let meteorSize = 10;
        let meteorTrailDecay = 64;
        let meteorRandomDecay = true;
      
        for(let j = 0; j < numLeds; j++) {
            if((!meteorRandomDecay) || (module.getRandomInt(0, 10) > 5)) {
                let oldColor;
                let r, g, b;
            
                oldColor = module.channel.array[offset + j];
                r = module.Int2R(oldColor);
                g = module.Int2G(oldColor);
                b = module.Int2B(oldColor);

                r = (r <= 10) ? 0 : r - (r * meteorTrailDecay / 256);
                g = (g <= 10) ? 0 : g - (g * meteorTrailDecay / 256);
                b = (b <= 10) ? 0 : b - (b * meteorTrailDecay / 256);
            
                module.channel.array[offset + j] = module.Rgb2Int(r, g, b); 
            }
        }
        
        for(let j = 0; j < meteorSize; j++) {
            let n = i - j;
            if((n < numLeds) && (n >= 0)) {
                module.channel.array[offset + n] = module.Rgb2Int(red, green, blue);
            }
        }   

        config.animationIndex += 1;
        if(config.animationIndex >= numLeds * 2) config.animationIndex = 0;

        return config;
    };
    module.Rgb2Int = function (r, g, b) {
        return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
    };
    module.Int2R = function(val) {
        let errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);

        return val >> 16;
    };    
    module.Int2G = function(val) {
        let errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);

        let red = val >> 16;
        return (val - (red << 16)) >> 8;
    };    
    module.Int2B = function(val) {
        let errorMessage = 'Must provide an integer between 0 and 16777215';
        if (typeof val !== 'number') throw new Error(errorMessage);
        if (Math.floor(val) !== val) throw new Error(errorMessage);
        if (val < 0 || val > 16777215) throw new Error(errorMessage);

        let red = val >> 16;
        let green = (val - (red << 16)) >> 8;
        return val - (red << 16) - (green << 8);
    };
    module.Int2Rgb = function(val) {        
        let red = module.Int2R(val);
        let green = module.Int2G(val);
        let blue = module.Int2B(val);
        return {
            red: red,
            green: green,
            blue: blue
        }
    };
	module.getRandomInt = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
    module.ParseDataIfString = function(data) {
        if(typeof(data) === "string") return JSON.parse(data);
        return data;
    };

    return module;
};