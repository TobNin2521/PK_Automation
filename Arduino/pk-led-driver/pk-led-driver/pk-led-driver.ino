#define PIN 6

#include "pk-led-effects.h"
#include "pk-wifi-slave.h"

void setup() {
    Serial.begin(9600);
    LedInit();
    SlaveInit();
}

void loop()
{
    getEffectFromMaster();

    switch (LedConfig.effect) {
    case LedEffect::RainbowCycle: {
        rainbowCycle(20);
        break;
    }
    case LedEffect::MeteorRain: {
        meteorRain(0xff, 0xff, 0xff, 10, 64, true, 30);
        break;
    }
    case LedEffect::Fire: {
        Fire(55, 120, 15);
        break;
    }
    case LedEffect::TheaterChase: {
        theaterChaseRainbow(50);
        break;
    }
    }

}