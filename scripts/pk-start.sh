#!/usr/bin/env bash
#
# PK Automation, part 2 of 2: start the server and open the frontend.
#   1. starts the server
#   2. opens the website in Chromium (fullscreen for the touch display)
#
# The browser is not started again when it is closed. The script runs as long as the server does,
# stop it with Ctrl+C or by killing it, the server and the browser are stopped too.
# Started again while it runs, it replaces the running one: that one is stopped (with its server and
# browser) before the new server starts, so code pulled by pk-update.sh goes live.
# Exit code: 0 stopped, 1 the server did not start or stopped, 2 wrong parameters.
# It needs the display, so start it from the desktop session (see the README).
#
# The script doesn't read environment variables, everything is set below and can be
# overwritten with parameters:

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # --root           the project folder
URL="https://127.0.0.1:8443"                              # --url            address of the website
BROWSER_MODE="fullscreen"                                      # --browser        fullscreen, headless (no window, nothing on the display) or none
BROWSER_BIN=""                                            # --browser-bin    Chromium to use, empty = find one
WAYLAND_NAME="wayland-1"                                  # --wayland        Wayland socket of the desktop (Raspberry Pi OS labwc), empty = use X11 with --display
DISPLAY_NAME=":0"                                         # --display        the X11 display, only used when --wayland is empty
PROFILE_DIR=""                                            # --browser-profile  profile of the browser, empty = .browser-profile in the project
SERVER_WAIT=60                                            # --server-wait    seconds to wait for the server
STOP_WAIT=20                                              # --stop-wait      seconds to wait for a running one to stop

usage() {
    sed -n '2,/^$/p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    echo "Parameters (defaults): --root \"$ROOT\" --url $URL --browser $BROWSER_MODE --browser-bin \"\""
    echo "                      --wayland \"$WAYLAND_NAME\" --display $DISPLAY_NAME --browser-profile \"\" --server-wait $SERVER_WAIT"
    echo "                      --stop-wait $STOP_WAIT"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --root|--url|--browser|--browser-bin|--wayland|--display|--browser-profile|--server-wait|--stop-wait)
            if [ $# -lt 2 ]; then echo "$1 needs a value" >&2; exit 2; fi
            case "$1" in
                --root) ROOT="$2" ;;
                --url) URL="$2" ;;
                --browser) BROWSER_MODE="$2" ;;
                --browser-bin) BROWSER_BIN="$2" ;;
                --wayland) WAYLAND_NAME="$2" ;;
                --display) DISPLAY_NAME="$2" ;;
                --browser-profile) PROFILE_DIR="$2" ;;
                --server-wait) SERVER_WAIT="$2" ;;
                --stop-wait) STOP_WAIT="$2" ;;
            esac
            shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown parameter: $1" >&2; usage >&2; exit 2 ;;
    esac
done

case "$BROWSER_MODE" in
    fullscreen|headless|none) ;;
    *) echo "--browser must be fullscreen, headless or none" >&2; exit 2 ;;
esac

SERVER_DIR="$ROOT/server"
[ -n "$PROFILE_DIR" ] || PROFILE_DIR="$ROOT/.browser-profile"
PID_FILE="$ROOT/.pk-start.pid"      # PID of the running script, so a new start can replace it
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
SERVER_PID=""
BROWSER_LOOP_PID=""

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# The PID is a running pk-start.sh other than this one (the PID in an old file may belong to something else by now)
is_pk_start() {
    local pid="$1"
    case "$pid" in ''|*[!0-9]*) return 1 ;; esac
    [ "$pid" != "$$" ] || return 1
    kill -0 "$pid" 2>/dev/null || return 1
    [ -r "/proc/$pid/cmdline" ] || return 0
    tr '\0' ' ' < "/proc/$pid/cmdline" | grep -qF "$SCRIPT_NAME"
}

# Something answers on the address of the website
port_in_use() {
    curl -ks -o /dev/null --max-time 2 "$URL"
}

# Stops a pk-start.sh that is still running. TERM lets it stop its server and browser itself, one that doesn't stop
# in time is killed together with its server. Then waits until the port is free, so the old server can't answer
# in place of the new one
stop_previous() {
    local old i
    old="$(cat "$PID_FILE" 2>/dev/null)"
    if is_pk_start "$old"; then
        log "PK Automation is already running (PID $old), stopping it"
        kill -TERM "$old" 2>/dev/null
        for i in $(seq 1 "$STOP_WAIT"); do
            kill -0 "$old" 2>/dev/null || break
            sleep 1
        done
        if kill -0 "$old" 2>/dev/null; then
            log "It did not stop within ${STOP_WAIT}s, killing it"
            pkill -KILL -P "$old" 2>/dev/null
            kill -KILL "$old" 2>/dev/null
        fi
    fi
    for i in $(seq 1 "$STOP_WAIT"); do
        port_in_use || return 0
        sleep 1
    done
    log "Something else still answers on $URL (not started by $SCRIPT_NAME), stop it first"
    return 1
}

# The Chromium of a stopped instance may need a moment to close. A new one started before that only hands the
# address to the closing one. The lock in the profile names the process holding it (host-PID)
wait_for_old_browser() {
    local lock pid i
    lock="$(readlink "$PROFILE_DIR/SingletonLock" 2>/dev/null)" || return 0
    pid="${lock##*-}"
    case "$pid" in ''|*[!0-9]*) return 0 ;; esac
    for i in $(seq 1 10); do
        kill -0 "$pid" 2>/dev/null || return 0
        sleep 1
    done
    log "The previous browser is still open, the website may open in it"
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

# The browser is started once, closing it does not start it again
run_browser() {
    local browser="$1"
    local flags=(
        --user-data-dir="$PROFILE_DIR"
        --ignore-certificate-errors
        --autoplay-policy=no-user-gesture-required
        --noerrdialogs --disable-infobars --disable-session-crashed-bubble --no-first-run
        --check-for-update-interval=31536000 --password-store=basic
        --overscroll-history-navigation=0 --disable-pinch
    )
    # Native Wayland: through XWayland a fullscreen window may never be shown (labwc)
    local -a display_env=(DISPLAY="$DISPLAY_NAME")
    if [ -n "$WAYLAND_NAME" ]; then
        display_env=(WAYLAND_DISPLAY="$WAYLAND_NAME" XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}")
        flags+=(--ozone-platform=wayland)
    fi
    if [ "$BROWSER_MODE" = "headless" ]; then
        flags+=(--headless=new --disable-gpu --remote-debugging-port=9222)
    else
        flags+=(--start-fullscreen)
    fi
    env "${display_env[@]}" "$browser" "${flags[@]}" "$URL"
    log "The browser closed, the server keeps running"
}

start_browser() {
    [ "$BROWSER_MODE" = "none" ] && return 0
    local browser
    browser="$(find_browser)" || { log "No Chromium found (sudo apt install chromium-browser), open $URL yourself"; return 0; }
    # The screen stays on while nobody touches it
    if [ "$BROWSER_MODE" = "fullscreen" ] && [ -z "$WAYLAND_NAME" ] && command -v xset > /dev/null; then
        DISPLAY="$DISPLAY_NAME" xset s off -dpms s noblank 2>/dev/null || true
    fi
    wait_for_old_browser
    log "Opening $URL in $browser ($BROWSER_MODE)"
    run_browser "$browser" &
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
    # Only our own file: an instance that replaced this one has already written its PID there
    if [ "$(cat "$PID_FILE" 2>/dev/null)" = "$$" ]; then rm -f "$PID_FILE"; fi
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

stop_previous || exit 1
echo "$$" > "$PID_FILE"

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
