#ifndef LEDEFFECTSH
#define LEDEFFECTSH

#include <FastLED.h>

#define NUM_LEDS 144

enum LedEffect {
    NoneE = 0x00,
    RainbowCycleE = 0x01,
    FireE = 0x02,
    MeteorRainE = 0x03,
    TheaterChaseE = 0x04,
    SolidE = 0x05,
    FadeE = 0x06
};

struct LedObject {
    LedEffect effect;
    bool status;
    int color1;
    int color2;
};

CRGB leds[NUM_LEDS];

LedObject LedConfig;

/*
------------------- General Functions ---------------------
*/

void setBrightness(uint8_t b) {
    if (b < 0) b = 0;
    if (b > 255) b = 255;
    FastLED.setBrightness(b);
}

void LedInit() {
    FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
    setBrightness(5);
}

void showStrip()
{
    FastLED.show();
}

void setPixel(int Pixel, byte red, byte green, byte blue)
{
    leds[Pixel].r = red;
    leds[Pixel].g = green;
    leds[Pixel].b = blue;
}

void setAll(byte red, byte green, byte blue)
{
    for (int i = 0; i < NUM_LEDS; i++)
    {
        setPixel(i, red, green, blue);
    }
    showStrip();
}

int* getRgbFromInt(int color) {
    int retVal[3];

    retVal[0] = (color & 0xFF0000) >> 16;
    retVal[1] = (color & 0x00FF00) >> 8;
    retVal[2] = (color & 0x0000FF);

    return retVal;
}

/*
------------------- Effect Functions ---------------------
*/

#pragma region FireFunctions

void setPixelHeatColor(int Pixel, byte temperature)
{
    // Scale 'heat' down from 0-255 to 0-191
    byte t192 = round((temperature / 255.0) * 191);

    // calculate ramp up from
    byte heatramp = t192 & 0x3F; // 0..63
    heatramp <<= 2;              // scale up to 0..252

    // figure out which third of the spectrum we're in:
    if (t192 > 0x80)
    { // hottest
        setPixel(Pixel, 255, 255, heatramp);
    }
    else if (t192 > 0x40)
    { // middle
        setPixel(Pixel, 255, heatramp, 0);
    }
    else
    { // coolest
        setPixel(Pixel, heatramp, 0, 0);
    }
}

void Fire(int Cooling, int Sparking, int SpeedDelay)
{
    static byte heat[NUM_LEDS];
    int cooldown;

    // Step 1.  Cool down every cell a little
    for (int i = 0; i < NUM_LEDS; i++)
    {
        cooldown = random(0, ((Cooling * 10) / NUM_LEDS) + 2);

        if (cooldown > heat[i])
        {
            heat[i] = 0;
        }
        else
        {
            heat[i] = heat[i] - cooldown;
        }
    }

    // Step 2.  Heat from each cell drifts 'up' and diffuses a little
    for (int k = NUM_LEDS - 1; k >= 2; k--)
    {
        heat[k] = (heat[k - 1] + heat[k - 2] + heat[k - 2]) / 3;
    }

    // Step 3.  Randomly ignite new 'sparks' near the bottom
    if (random(255) < Sparking)
    {
        int y = random(7);
        heat[y] = heat[y] + random(160, 255);
        // heat[y] = random(160,255);
    }

    // Step 4.  Convert heat to LED colors
    for (int j = 0; j < NUM_LEDS; j++)
    {
        setPixelHeatColor(j, heat[j]);
    }

    showStrip();
    delay(SpeedDelay);
}

#pragma endregion

#pragma region MeteorRainFunction

void fadeToBlack(int ledNo, byte fadeValue)
{
    leds[ledNo].fadeToBlackBy(fadeValue);
}

int meteorIndex = 0;

void meteorRain(byte meteorSize, byte meteorTrailDecay, boolean meteorRandomDecay, int SpeedDelay)
{
    if(meteorIndex == 0) {
        setAll(0, 0, 0);
    }
    int* rgb = getRgbFromInt(LedConfig.color1);

    // fade brightness all LEDs one step
    for (int j = 0; j < NUM_LEDS; j++)
    {
        if ((!meteorRandomDecay) || (random(10) > 5))
        {
            fadeToBlack(j, meteorTrailDecay);
        }
    }

    // draw meteor
    for (int j = 0; j < meteorSize; j++)
    {
        if ((meteorIndex - j < NUM_LEDS) && (meteorIndex - j >= 0))
        {
            setPixel(meteorIndex - j, rgb[0], rgb[1], rgb[2]);
        }
    }

    showStrip();
    delay(SpeedDelay);

    meteorIndex = (meteorIndex + 1) % (NUM_LEDS + NUM_LEDS);
}

#pragma endregion

#pragma region TheaterChaseFunction

byte* Wheel(byte WheelPos)
{
    static byte c[3];

    if (WheelPos < 85)
    {
        c[0] = WheelPos * 3;
        c[1] = 255 - WheelPos * 3;
        c[2] = 0;
    }
    else if (WheelPos < 170)
    {
        WheelPos -= 85;
        c[0] = 255 - WheelPos * 3;
        c[1] = 0;
        c[2] = WheelPos * 3;
    }
    else
    {
        WheelPos -= 170;
        c[0] = 0;
        c[1] = WheelPos * 3;
        c[2] = 255 - WheelPos * 3;
    }

    return c;
}

int theaterIndex = 0;
int theaterColorIndex = 0;

void theaterChaseRainbow(int SpeedDelay)
{
    byte* c;

    for (int i = 0; i < NUM_LEDS; i = i + 3)
    {
        c = Wheel((i + theaterIndex) % 255);
        setPixel(i + theaterColorIndex, *c, *(c + 1), *(c + 2)); // turn every third pixel on
    }
    showStrip();

    delay(SpeedDelay);

    for (int i = 0; i < NUM_LEDS; i = i + 3)
    {
        setPixel(i + theaterColorIndex, 0, 0, 0); // turn every third pixel off
    }

    theaterColorIndex = (theaterColorIndex + 1) % 3;
    if(theaterColorIndex == 2) {                
        theaterIndex = (theaterIndex + 1) % 256;
    }
}

#pragma endregion

#pragma region RainbowCycleFunction

int rainbowIndex = 0;

void rainbowCycle(int SpeedDelay)
{
    byte* c;
    uint16_t i;

    for (i = 0; i < NUM_LEDS; i++)
    {
        c = Wheel(((i * 256 / NUM_LEDS) + rainbowIndex) & 255);
        setPixel(i, *c, *(c + 1), *(c + 2));
    }
    showStrip();
    delay(SpeedDelay);

    rainbowIndex = (rainbowIndex + 1) % (256 * 5);
}

#pragma endregion

#pragma region SolidFunctions

void solid(){
    int* rgb = getRgbFromInt(LedConfig.color1);
    setAll(rgb[0], rgb[1], rgb[2]);
}

#pragma endregion

#pragma redion FadeFunctions

bool fadeDirection = true;
int fadeIndex = 0;

void fade() {    
    int fadeColor1 = LedConfig.color1;
    int fadeColor2 = LedConfig.color2;
    if(!fadeDirection) {
        fadeColor1 = LedConfig.color2;
        fadeColor2 = LedConfig.color1;
    }
    int* rgb1 = getRgbFromInt(fadeColor1);
    int* rgb2 = getRgbFromInt(fadeColor2);
    
    int r = ((rgb1[0] * (255 - fadeIndex)) + (rgb2[0] * fadeIndex)) / 255;
    int g = ((rgb1[1] * (255 - fadeIndex)) + (rgb2[1] * fadeIndex)) / 255;
    int b = ((rgb1[2] * (255 - fadeIndex)) + (rgb2[2] * fadeIndex)) / 255;

    if(fadeIndex == 255) fadeDirection = !fadeDirection;
    fadeIndex = (fadeIndex + 1) % 256;

    setAll(r, g, b);
}

#pragma endregion

#endif
