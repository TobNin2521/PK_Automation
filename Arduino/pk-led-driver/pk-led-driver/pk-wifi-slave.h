#ifndef WIFISLAVEH
#define WIFISLAVEH

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

//Provide your own WiFi credentials
const char* ssid = "<Your WiFi SSID>";
const char* password = "<Your WiFi Password>";
//String for storing server response
String response = "";
const String IP_ADDRESS = "";
const String API_PATH = "/leds/config_by_id?led=";
const String LED_ID = "";
//JSON document
DynamicJsonDocument doc(2048);

void SlaveInit() {
    //Initiate WiFi connection
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.println("");

    // Wait for connection
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.print("WiFi connected with IP: ");
    Serial.println(WiFi.localIP());
}

void getEffectFromMaster() {
    HTTPClient http;
    String request = IP_ADDRESS + API_PATH + LED_ID;
    http.begin(request);
    http.GET();
    response = http.getString();
    DeserializationError error = deserializeJson(doc, response);
    if (error) {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.f_str());
        return;
    }
    LedConfig.effect = doc["animation"].as<int>();
    LedConfig.status = doc["status"].as<bool>();
    LedConfig.color1 = doc["animationValue"].as<int>();
    LedConfig.color1 = doc["animationValueAlt"].as<int>();

    http.end();
    delay(2000);
}

#endif