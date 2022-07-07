#define LED_PIN 22

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
    case LedEffect::RainbowCycleE: {
        rainbowCycle(20);
        break;
    }
    case LedEffect::MeteorRainE: {
        meteorRain(0xff, 0xff, 0xff, 10, 64, true, 30);
        break;
    }
    case LedEffect::FireE: {
        Fire(55, 120, 15);
        break;
    }
    case LedEffect::TheaterChaseE: {
        theaterChaseRainbow(50);
        break;
    }
    }

}
