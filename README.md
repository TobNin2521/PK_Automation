# PK_Automation

## Description

This project containts a nodejs webserver and a website build with react. The webserver uses different libraries to
control LED-strips and GPIOs, on the website the user can configure these IOs.
The json objects to send to the API are documented in the Leds/Lights files in the react project.
Detailed documentation for this project is in my Evernote.

## Music

All the music handling lives on the server, the browser only plays what the server tells it to:

* `server/spotify.js`: Spotify login, token refresh and the Spotify web api (search, playlists, tracks).
* `server/player.js`: the queue (tracks added by the user, then the shuffled playlist) and the selected playlist.
  The selected playlist is saved in `server/settings.json`, the Spotify login is only kept in memory.
* `server/api.js`: the HTTP api, any device on the network can use it. Needs Node 18 or newer (global `fetch`).
* The website asks `POST /api/player/next` for the next track id and plays it. When the queue changes in a way that
  should be heard right away (a track added with `playNow`, a new playlist, `POST /api/player/skip`) the server sends a
  `skip` event on the stream `GET /api/events` and the website jumps to the next track. The same stream sends the
  complete `state` after every change.

| Endpoint | Description |
| --- | --- |
| `GET /api/events` | Event stream (`state`, `skip`) |
| `GET /api/state` | Queues, playlist and current track |
| `GET /api/search/tracks?q=` | Search for tracks |
| `GET /api/search/playlists?q=` | Search for playlists |
| `POST /api/queue` `{trackId, playNow}` | Add a track to the queue (`playNow` puts it first and skips) |
| `POST /api/queue/remove` `{index}` | Remove a track from the queue |
| `POST /api/queue/move` `{list, from, to}` | Move a track, `list` is `user` or `playlist` |
| `POST /api/playlist` `{playlistId}` | Select the playlist |
| `POST /api/player/next` | Take the next track to play |
| `POST /api/player/skip` | Skip the current track |

## Stored data

What the server remembers lives in small JSON files in `server/data/` (`PK_DATA_DIR` changes the folder), handled by
`server/store.js`:

* `settings.json`: the selected playlist.
* `secrets.json`: the Spotify login (refresh token), only readable by the owner of the file. Delete it to log out.

Changes are written after about a second and replace the file in one step, so a power cut doesn't leave a broken file
and the SD card isn't written on every change. A damaged file is kept as `*.damaged` and the server starts with empty
data. Use `store.settings` / `store.secrets` (`get`, `set`, `delete`) to keep more.

## LEDs

The WLED devices are only talked to by the server (`server/leds.js`), the website and any other device on the network
use the same api as for the music. The devices (id, name, address) are configured in the `devices` list in `leds.js`,
the website refers to them by id.

| Endpoint | Description |
| --- | --- |
| `GET /api/leds` | State of all devices (`online: false` for one that can't be reached) |
| `GET /api/leds/:id` | State of one device: `{on, brightness, color: [r, g, b], effect, effects}` |
| `POST /api/leds/:id` `{on, brightness, color, effect}` | Change any of these, answers the new state |

Every change is also sent as a `led` event on `GET /api/events`, so all open pages stay in sync. Invalid values answer
`400`, an unknown id `404` and a device that doesn't answer `502`.

## Profiles

A profile is a name with a playlist and settings (color, effect, brightness) for the LED devices. Profiles belong to
one user and only that user can see, change, delete or apply them (`server/profiles.js`).

A user is a random id: the client asks for one once with `POST /api/user`, **keeps it for good** (a phone app in its
storage, a script in a file) and sends it as the header `X-User-Id` with every profile request. The id works like a
password and can't be recovered, a client that loses it also loses access to its profiles. The server only stores a
hash of the id (`server/data/users.json`).

| Endpoint | Description |
| --- | --- |
| `POST /api/user` | Create a user, answers `{userId}` |
| `GET /api/profiles` | The profiles of the user |
| `POST /api/profiles` `{name, playlistId, leds}` | Create a profile, `leds` is `{"bar": {"color": [r, g, b], "effect": 3, "brightness": 200}}`. With `fromCurrent: true` it takes over the playlist and the LEDs as they are right now (given values replace them) |
| `PUT /api/profiles/:id` `{name, playlistId, leds}` | Change parts of a profile |
| `DELETE /api/profiles/:id` | Delete a profile |
| `POST /api/profiles/:id/apply` | Select the playlist and set the LEDs, answers what worked: `{playlist, leds: {bar: "applied"}}` |

Names are unique per user (not case sensitive), a user can have 50 profiles. Applying a profile whose playlist is
already selected doesn't restart the music, an LED that can't be reached is reported as failed and doesn't stop the rest.

## DM Tools

A game master can switch the profiles of one user from [DM Tools](https://github.com/TobNin2521/DMTools) (settings page
and encounter runner) and save the current lighting as a new profile there. The server calls DM Tools, DM Tools never
calls the server: so nothing has to be opened on the network, it works over the internet and no mDNS is needed
(`server/dmtools.js`). Nothing has to be typed on the Pi over ssh, pairing happens on its own display.

Every 2 seconds the server sends DM Tools the profiles of its user (id and name) and the profile it applied last, the
answer says what the game master asked for: switching to a profile (the same code as `POST /api/profiles/:id/apply`) or
saving the current playlist and LEDs under a new name (`POST /api/profiles` with `fromCurrent: true`). The server
confirms it with the next call. A DM Tools that can't be reached is only logged and asked again later, the rest of the
server doesn't depend on it.

**Pairing.** The server makes up its own token and its own user (kept in `server/data/secrets.json`). When DM Tools doesn't
know the token yet, the server asks it for a code and shows it in the **DM Tools** card at the bottom of the left panel of
the website (tap it for the big code). The game master types the code in DM Tools under Settings, PK Automation, Pair a
controller, and the link is up. When the controller is removed in DM Tools the card shows a new code.

The server needs the address of DM Tools. Either type it in the DM Tools card once, or set `DEFAULT_URL` at the top of
`server/dmtools.js` so a Pi that updates itself pairs without anybody touching it. The card only shows on the display of
the server itself (the browser on the Pi), never on a phone.

The profiles DM Tools sees are the ones of the server's own user. Create more of them from DM Tools ("Save current
lighting"), or with the profile api using that user's id, which the card endpoint answers on the Pi:

| Endpoint | Description |
| --- | --- |
| `GET /api/dmtools` | State of the link: `{url, state, code, codeExpires, userId, lastSync, error}`, `state` is `off`, `pairing`, `linked` or `offline` |
| `POST /api/dmtools` `{url}` | Set the address of DM Tools, answers the state |
| `DELETE /api/dmtools` | Forget the address and the token, the controller can be paired again |

These answer `403` to anything but the server itself (its own display), because the code and the user id decide who can
switch the profiles and the rest of the api is open to the whole network. The server needs outbound access to DM Tools,
nothing else.

## Finding the server (mDNS)

The server announces itself on the local network as the service `_pkautomation._tcp` (`server/mdns.js`), so devices
don't need to know its IP address. The TXT record has `protocol` (`https`), `path` (`/api`) and `version`. After
finding it, `GET /api/info` confirms what it is.

| Platform | How to look for it |
| --- | --- |
| This project | `node server/discover.js` prints `https://<ip>:8443/api` |
| Linux | `avahi-browse -rt _pkautomation._tcp` |
| macOS | `dns-sd -B _pkautomation._tcp` |
| Python | `zeroconf` (`ServiceBrowser(zc, "_pkautomation._tcp.local.", handler)`) |
| Android / iOS | `NsdManager` / `NWBrowser` (Bonjour) with the type `_pkautomation._tcp` |

* mDNS only works inside one subnet, guest Wi-Fi or VLANs usually block it. UDP port 5353 must not be blocked.
* The server uses the self-signed certificate, clients have to trust it or skip the verification.
* On the Pi `avahi-daemon` and the server can both run, they share the port.

## Hardware

This project uses a raspberry pi 4 model B with WS2812B led strips and relay boards for the IO switching.
Furthermore it uses 3.3V to 5V logic converters for the peripherals.

Here a list of components:

* [Raspberry Pi]()
* [Led-strip]()
* [Relay board]()
* [Logic convertors]()

## Running on the Raspberry Pi

Three scripts in `scripts/`. None of them reads environment variables: every setting has a default at the top of the
script and is changed with a parameter (`--help` lists them).

| Script | What it does |
| --- | --- |
| `pk-clone.sh` | Once, clones the repository onto the Pi. Contains the GitHub token, so it is **not in git** (see `.gitignore`), copy it to the Pi with `scp`. |
| `pk-update.sh` | Pulls the newest version of the branch, installs the packages when a `package-lock.json` changed and builds the frontend when its files changed. A failed build keeps the previous one. Exit code 1 means a problem, what is installed can still be started. |
| `pk-start.sh` | Starts the server and opens the website in Chromium (fullscreen kiosk for the touch display, started again if it closes). Runs as long as the server does, stop it with Ctrl+C. |

```
sudo apt install git chromium-browser          # once, Node.js 18 or newer is needed as well
bash pk-clone.sh --branch new_version          # once, clones into ./PK_Automation
bash PK_Automation/scripts/pk-update.sh ; bash PK_Automation/scripts/pk-start.sh
```

The first update installs and builds, which takes a few minutes on the Pi. Use `;` between update and start so the Pi
still starts when GitHub can't be reached.

The clone saves the token in `.git/pk-credentials` (only readable by its owner), git uses it for every later pull. The
remote URL stays clean and the scripts never print the token. `pk-update.sh --token <new token>` replaces it. A token
given as a parameter is visible to other users of the Pi in the process list while the script runs.

Common parameters: `pk-clone.sh` `--repo --target --branch --token`, `pk-update.sh` `--branch --token --force-build
--retries --node-memory`, `pk-start.sh` `--browser kiosk|headless|none --display --url --browser-bin --server-wait`.
`headless` runs the browser without a window, so nothing is shown on the display.

Start it when the desktop starts (it needs the display):

* Raspberry Pi OS with labwc: add `bash /home/pi/PK_Automation/scripts/pk-update.sh ; bash /home/pi/PK_Automation/scripts/pk-start.sh >> /home/pi/pk.log 2>&1 &`
  to `~/.config/labwc/autostart`.
* X11 / LXDE: create `~/.config/autostart/pk-automation.desktop` with `[Desktop Entry]`, `Type=Application` and
  `Exec=bash -c "bash /home/pi/PK_Automation/scripts/pk-update.sh ; bash /home/pi/PK_Automation/scripts/pk-start.sh"`.

The browser ignores the warning of the self-signed certificate and may play music without a tap. The server's data
(`server/data`) stays when updating. `rpio` uses `/dev/gpiomem`, so the scripts don't need `sudo` when the user is in
the `gpio` group.

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
* [RPIO](https://www.npmjs.com/package/rpio):
  Used to control the GPIOs of the rPI, also includes support for I2C, SPI, PWM.

On project setup use the command `npm install` to install all libraries.

## Infos

Selfsigning SSL cert: [Click here](https://stackoverflow.com/questions/11744975/enabling-https-on-express-js)

Progressive Web Apps: [Click here](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

Additional effects: [Click here](https://www.tweaking4all.com/hardware/arduino/adruino-led-strip-effects/)