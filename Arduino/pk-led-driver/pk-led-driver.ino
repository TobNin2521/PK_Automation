#include "pk-led-effects.h"
#include "pk-modbus-slave.h"

#define PIN 6

void setup() {
    Serial.begin(9600);
    FastLED.addLeds<WS2812, PIN, GRB>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
    setBrightness(5);
}

void loop()
{
    //Fire(55, 120, 15);
    //meteorRain(0xff, 0xff, 0xff, 10, 64, true, 30);
    //theaterChaseRainbow(50);
    rainbowCycle(20);
}