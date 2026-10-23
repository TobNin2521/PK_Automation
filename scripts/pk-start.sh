#!/usr/bin/env bash
#
# PK Automation, part 2 of 2: start the server and open the frontend.
#   1. starts the server
#   2. opens the website in Chromium (fullscreen kiosk for the touch display)
#
# The browser is started again when it closes. The script runs as long as the server does,
# stop it with Ctrl+C or by killing it, the server and the browser are stopped too.
# Exit code: 0 stopped, 1 the server did not start or stopped, 2 wrong parameters.
# It needs the display, so start it from the desktop session (see the README).
#
# The script doesn't read environment variables, everything is set below and can be
# overwritten with parameters:

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # --root           the project folder
URL="https://127.0.0.1:8443"                              # --url            address of the website
BROWSER_MODE="kiosk"                                      # --browser        kiosk, headless (no window, nothing on the display) or none
BROWSER_BIN=""                                            # --browser-bin    Chromium to use, empty = find one
DISPLAY_NAME=":0"                                         # --display        the display the browser opens on
PROFILE_DIR=""                                            # --browser-profile  profile of the browser, empty = .browser-profile in the project
SERVER_WAIT=60                                            # --server-wait    seconds to wait for the server
BROWSER_DELAY=3                                           # --browser-delay  seconds before the browser is started again

usage() {
    sed -n '2,/^$/p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    echo "Parameters (defaults): --root \"$ROOT\" --url $URL --browser $BROWSER_MODE --browser-bin \"\""
    echo "                      --display $DISPLAY_NAME --browser-profile \"\" --server-wait $SERVER_WAIT --browser-delay $BROWSER_DELAY"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --root|--url|--browser|--browser-bin|--display|--browser-profile|--server-wait|--browser-delay)
            if [ $# -lt 2 ]; then echo "$1 needs a value" >&2; exit 2; fi
            case "$1" in
                --root) ROOT="$2" ;;
                --url) URL="$2" ;;
                --browser) BROWSER_MODE="$2" ;;
                --browser-bin) BROWSER_BIN="$2" ;;
                --display) DISPLAY_NAME="$2" ;;
                --browser-profile) PROFILE_DIR="$2" ;;
                --server-wait) SERVER_WAIT="$2" ;;
                --browser-delay) BROWSER_DELAY="$2" ;;
            esac
            shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown parameter: $1" >&2; usage >&2; exit 2 ;;
    esac
done

case "$BROWSER_MODE" in
    kiosk|headless|none) ;;
    *) echo "--browser must be kiosk, headless or none" >&2; exit 2 ;;
esac

SERVER_DIR="$ROOT/server"
[ -n "$PROFILE_DIR" ] || PROFILE_DIR="$ROOT/.browser-profile"
SERVER_PID=""
BROWSER_LOOP_PID=""

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

start_server() {
    cd "$SERVER_DIR" || exit 1
    log "Starting the server"
    node server.js &
    SERVER_PID=$!
}

wait_for_server() {
    local i
    for i in $(seq 1 "$SERVER_WAIT"); do
        kill -0 "$SERVER_PID" 2>/dev/null || return 1
        curl -ksf "$URL/api/info" > /dev/null && return 0
        sleep 1
    done
    return 1
}

find_browser() {
    local name
    if [ -n "$BROWSER_BIN" ]; then
        echo "$BROWSER_BIN"
        return 0
    fi
    for name in chromium-browser chromium google-chrome; do
        command -v "$name" && return 0
    done
    return 1
}

# The browser is started again when it closes or crashes
browser_loop() {
    local browser="$1"
    local flags=(
        --user-data-dir="$PROFILE_DIR"
        --ignore-certificate-errors
        --autoplay-policy=no-user-gesture-required
        --noerrdialogs --disable-infobars --disable-session-crashed-bubble --no-first-run
        --check-for-update-interval=31536000 --password-store=basic
        --overscroll-history-navigation=0 --disable-pinch
    )
    if [ "$BROWSER_MODE" = "headless" ]; then
        flags+=(--headless=new --disable-gpu --remote-debugging-port=9222)
    else
        flags+=(--kiosk)
    fi
    while true; do
        DISPLAY="$DISPLAY_NAME" "$browser" "${flags[@]}" "$URL"
        log "The browser closed, starting it again in $BROWSER_DELAY seconds"
        sleep "$BROWSER_DELAY"
    done
}

start_browser() {
    [ "$BROWSER_MODE" = "none" ] && return 0
    local browser
    browser="$(find_browser)" || { log "No Chromium found (sudo apt install chromium-browser), open $URL yourself"; return 0; }
    # The screen stays on while nobody touches it
    if [ "$BROWSER_MODE" = "kiosk" ] && command -v xset > /dev/null; then
        DISPLAY="$DISPLAY_NAME" xset s off -dpms s noblank 2>/dev/null || true
    fi
    log "Opening $URL in $browser ($BROWSER_MODE)"
    browser_loop "$browser" &
    BROWSER_LOOP_PID=$!
}

cleanup() {
    trap - EXIT INT TERM
    if [ -n "$BROWSER_LOOP_PID" ]; then
        pkill -P "$BROWSER_LOOP_PID" 2>/dev/null
        kill "$BROWSER_LOOP_PID" 2>/dev/null
    fi
    if [ -n "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null
        wait "$SERVER_PID" 2>/dev/null
    fi
}
trap 'cleanup; exit 0' INT TERM
trap cleanup EXIT

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$NODE_MAJOR" -lt 18 ]; then
    log "Node.js 18 or newer is needed (found: $(node -v 2>/dev/null || echo none))"
    exit 1
fi
if [ ! -f "$ROOT/website/pk-interface/build/index.html" ]; then
    log "There is no frontend build yet, run pk-update.sh first"
fi

start_server
if wait_for_server; then
    start_browser
else
    log "The server did not start, see the messages above"
    exit 1
fi

# From here on the script lives as long as the server does
wait "$SERVER_PID"
code=$?
log "The server stopped (exit code $code)"
exit "$code"
