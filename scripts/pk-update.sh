#!/usr/bin/env bash
#
# PK Automation, part 1 of 2: get the newest version and build it.
#   1. pulls the newest version of the branch from GitHub
#   2. installs the packages (only when a package-lock.json changed)
#   3. builds the frontend (only when files of the frontend changed)
#
# Exit code: 0 everything is up to date, 1 the update or the build failed (what is installed
# stays as it was and can still be started), 2 wrong parameters.
# So that the Pi starts even without network, run it like this:  pk-update.sh ; pk-start.sh
#
# The script doesn't read environment variables, everything is set below and can be
# overwritten with parameters:

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # --root         the project folder
BRANCH=""                                                 # --branch       branch to run, empty = the checked out one
TOKEN=""                                                  # --token        GitHub token, saved for the next updates
FORCE_BUILD=0                                             # --force-build  build even when nothing changed
RETRIES=3                                                 # --retries      tries to reach GitHub (the network may not be up yet)
RETRY_DELAY=5                                             # --retry-delay  seconds between the tries
NODE_MEMORY=1024                                          # --node-memory  MB of memory for the build (a Pi runs out of memory easily)

usage() {
    sed -n '2,/^$/p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    echo "Parameters (defaults): --root \"$ROOT\" --branch \"$BRANCH\" --token \"\" --force-build"
    echo "                      --retries $RETRIES --retry-delay $RETRY_DELAY --node-memory $NODE_MEMORY"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --root|--branch|--token|--retries|--retry-delay|--node-memory)
            if [ $# -lt 2 ]; then echo "$1 needs a value" >&2; exit 2; fi
            case "$1" in
                --root) ROOT="$2" ;;
                --branch) BRANCH="$2" ;;
                --token) TOKEN="$2" ;;
                --retries) RETRIES="$2" ;;
                --retry-delay) RETRY_DELAY="$2" ;;
                --node-memory) NODE_MEMORY="$2" ;;
            esac
            shift 2 ;;
        --force-build) FORCE_BUILD=1; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown parameter: $1" >&2; usage >&2; exit 2 ;;
    esac
done

SERVER_DIR="$ROOT/server"
WEB_DIR="$ROOT/website/pk-interface"
CREDENTIALS="$ROOT/.git/pk-credentials"
FAILED=0

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Runs a command up to $RETRIES times
retry() {
    local attempt=1
    while true; do
        "$@" && return 0
        [ "$attempt" -ge "$RETRIES" ] && return 1
        attempt=$((attempt + 1))
        sleep "$RETRY_DELAY"
    done
}

# Git gets the token from a file in the .git folder, so it is neither in the remote URL nor in the output
save_credentials() {
    local host
    host="$(git -C "$ROOT" remote get-url origin | sed -e 's#^[a-z]*://##' -e 's#/.*##' -e 's#.*@##')"
    ( umask 077; printf 'https://x-access-token:%s@%s\n' "$TOKEN" "$host" > "$CREDENTIALS" )
    chmod 600 "$CREDENTIALS" 2>/dev/null
    log "Saved the GitHub token"
}

update_repo() {
    [ -n "$TOKEN" ] && save_credentials
    # The folder may have been moved since the credentials were saved
    [ -f "$CREDENTIALS" ] && git -C "$ROOT" config credential.helper "store --file=$CREDENTIALS"
    if [ -n "$BRANCH" ]; then
        # A branch that was created on GitHub after the clone is not known here yet
        retry env GIT_TERMINAL_PROMPT=0 git -C "$ROOT" fetch --quiet origin "$BRANCH" 2>/dev/null
        git -C "$ROOT" checkout --quiet "$BRANCH" 2>/dev/null \
            || git -C "$ROOT" checkout --quiet -b "$BRANCH" "origin/$BRANCH" 2>/dev/null \
            || { log "Could not switch to branch $BRANCH"; return 1; }
    fi
    local branch
    branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)"
    log "Updating branch $branch from GitHub"
    if ! retry env GIT_TERMINAL_PROMPT=0 git -C "$ROOT" pull --ff-only --quiet origin "$branch"; then
        log "Update failed (no network, wrong token, or local changes in the way)"
        return 1
    fi
    log "Now at $(git -C "$ROOT" rev-parse --short HEAD): $(git -C "$ROOT" log -1 --format=%s)"
}

# npm ci, but only when package-lock.json is different from the last install
install_deps() {
    local dir="$1" hash marker
    [ -f "$dir/package-lock.json" ] || return 0
    hash="$(sha256sum "$dir/package-lock.json" | cut -d' ' -f1)"
    marker="$dir/node_modules/.pk-installed"
    if [ -d "$dir/node_modules" ] && [ "$(cat "$marker" 2>/dev/null)" = "$hash" ]; then
        return 0
    fi
    log "Installing the packages in $dir"
    (cd "$dir" && npm ci --no-audit --no-fund) || return 1
    echo "$hash" > "$marker"
}

# The frontend only has to be built when its files changed since the last build
frontend_needs_build() {
    local built head
    [ "$FORCE_BUILD" = "1" ] && return 0
    [ -f "$WEB_DIR/build/index.html" ] || return 0
    built="$(cat "$WEB_DIR/build/.pk-commit" 2>/dev/null)"
    [ -n "$built" ] || return 0
    head="$(git -C "$ROOT" rev-parse HEAD)"
    [ "$built" = "$head" ] && return 1
    # A commit that git doesn't know (history was rewritten) can't be compared
    git -C "$ROOT" cat-file -e "$built^{commit}" 2>/dev/null || return 0
    git -C "$ROOT" diff --quiet "$built" "$head" -- website/pk-interface && return 1
    return 0
}

# Builds next to the current build, so a failed build doesn't take the working one away
build_frontend() {
    log "Building the frontend (this takes a few minutes on the Pi)"
    rm -rf "$WEB_DIR/build.new"
    (cd "$WEB_DIR" && CI=false GENERATE_SOURCEMAP=false BUILD_PATH=build.new \
        NODE_OPTIONS="--max-old-space-size=$NODE_MEMORY" npm run build) || {
        rm -rf "$WEB_DIR/build.new"
        log "Build failed"
        return 1
    }
    rm -rf "$WEB_DIR/build"
    mv "$WEB_DIR/build.new" "$WEB_DIR/build"
    git -C "$ROOT" rev-parse HEAD > "$WEB_DIR/build/.pk-commit"
}

if ! git -C "$ROOT" rev-parse --git-dir > /dev/null 2>&1; then
    log "$ROOT is not a git repository"
    exit 1
fi

update_repo || FAILED=1
install_deps "$SERVER_DIR" || { log "Could not install the server packages"; FAILED=1; }
install_deps "$WEB_DIR" || { log "Could not install the frontend packages"; FAILED=1; }
if frontend_needs_build; then
    build_frontend || { log "The previous frontend build stays"; FAILED=1; }
fi
if [ ! -f "$WEB_DIR/build/index.html" ]; then
    log "There is no frontend build, the website won't work"
    FAILED=1
fi

[ "$FAILED" = "0" ] && log "Up to date" || log "Finished with problems, the installed version can still be started"
exit "$FAILED"
