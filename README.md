# PK_Automation

## Description

This project containts a nodejs webserver and a website build with react. The webserver uses different libraries to
control LED-strips and GPIOs, on the website the user can configure these IOs.

## Build

To start the webserver use the command

`node .\app.js`

in the parent director of the project. This project contains the webserver and the UX for the displayed website.
The website is written with the react-framework, to start the development enviroment use the command

`npm start`

in the */public/dev* directory. Before using the new changes with the node webserver you have to **build** the react website.
To build the react project first delete all contents in the */public/dev/dist/* directory.
The build script will build the website and move the files to this directory. To build the website use this command

`npm build`

## External Libs

In the webserver we use a multitude of different external libraries (node) to accomplish different functions.
Here a short list of the important ones:

* [Express](https://expressjs.com/)
  Strictly spreaking is express a framework, but we'll put it in this section. Thisis used to create the nodejs webserver.
* [WS281X](https://www.npmjs.com/package/rpi-ws281x-native-fixed)
  Used to control the WS2812B LED-strips connected to the rPI.
* [GPIO](https://www.npmjs.com/package/rpi-gpio)
  Used to control the GPIOs of the rPI.

On project setup use the command `npm install` to install all libraries.

## Infos

Selfsigning SSL cert: [Click here](https://stackoverflow.com/questions/11744975/enabling-https-on-express-js)