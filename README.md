# PK_Automation

## Description

This project containts a nodejs webserver and a website build with react. The webserver uses different libraries to
control LED-strips and GPIOs, on the website the user can configure these IOs.
The json objects to send to the API are documented in the Leds/Lights files in the react project.
Detailed documentation for this project is in my Evernote.

## Hardware

This project uses a raspberry pi 4 model B with WS2812B led strips and relay boards for the IO switching.
Furthermore it uses 3.3V to 5V logic converters for the peripherals.

Here a list of components:

* [Raspberry Pi]()
* [Led-strip]()
* [Relay board]()
* [Logic convertors]()

## Build

To start the webserver use the command

`sudo node .\app.js`

in the parent directory of the project. This project contains the webserver and the UX for the displayed website.
The website is written with the react-framework, to start the development enviroment use the command

`npm start`

in the */public/dev* directory. Before using the new changes with the node webserver you have to **build** the react website.
The build script will build the website and move the files to this directory. To build the website use this command

`npm run build`

You can find the finished build in */public/dist/build*.

## External Libs

In the webserver we use a multitude of different external libraries (node) to accomplish different functions.
Here a short list of the important ones:

* [Express](https://expressjs.com/):
  Strictly spreaking is express a framework, but we'll put it in this section. Thisis used to create the nodejs webserver.
* [WS281X](https://www.npmjs.com/package/rpi-ws281x-native-fixed):
  Used to control the WS2812B LED-strips connected to the rPI.
* [GPIO](https://www.npmjs.com/package/rpi-gpio):
  Used to control the GPIOs of the rPI.

On project setup use the command `npm install` to install all libraries.

## Infos

Selfsigning SSL cert: [Click here](https://stackoverflow.com/questions/11744975/enabling-https-on-express-js)
Progressive Web Apps: [Click here](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
Additional effects: [Click here](https://www.tweaking4all.com/hardware/arduino/adruino-led-strip-effects/)