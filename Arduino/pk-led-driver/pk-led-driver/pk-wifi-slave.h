#ifndef WIFISLAVEH
#define WIFISLAVEH

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

//Provide your own WiFi credentials
const char* ssid = "EOLO - FRITZ!Box 7530 DJ";
const char* password = "87783538650372096735";
//String for storing server response
String response = "";
const String IP_ADDRESS = "http://192.168.178.101:8080";
const String API_PATH = "/leds/config_by_id?led=";
const String LED_ID = "walls";
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

LedEffect getLedEffectFromString(String effect) {
  if(effect == "rainbow"){
      return LedEffect::RainbowCycleE;
  }
  if(effect == "rainbow"){
        return LedEffect::FireE;
  }
  if(effect == "theater"){
        return LedEffect::TheaterChaseE;
  }
  if(effect == "meteor"){
        return LedEffect::MeteorRainE;
  }
  return LedEffect::NoneE;
}

void getEffectFromMaster() {
  int mill = millis();
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
  LedConfig.effect = getLedEffectFromString(doc["animation"].as<String>());
  LedConfig.status = doc["status"].as<bool>();
  LedConfig.color1 = doc["animationValue"].as<int>();
  LedConfig.color2 = doc["animationValueAlt"].as<int>();
  
  Serial.println("LedEffect:");
  Serial.println(LedConfig.effect);
  Serial.println(LedConfig.status);
  Serial.println(LedConfig.color1);
  Serial.println(LedConfig.color2);
  
  http.end();
  Serial.println(millis() - mill);
}

#endif
