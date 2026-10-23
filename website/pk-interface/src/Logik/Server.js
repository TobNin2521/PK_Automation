import ADDRESS from "./Network";

// One shared connection to the event stream of the server, it reconnects on its own.
// "state": the queue/playlist changed (gets the full state), "skip": play the next track now,
// "led": the state of an LED device changed (gets the new state).
let source = null;
const listeners = { state: new Set(), skip: new Set(), led: new Set() };

const connect = () => {
    if(source !== null) return;
    source = new EventSource(ADDRESS + "/api/events");
    source.addEventListener("state", (e) => {
        const state = JSON.parse(e.data);
        listeners.state.forEach(cb => cb(state));
    });
    source.addEventListener("skip", () => {
        listeners.skip.forEach(cb => cb());
    });
    source.addEventListener("led", (e) => {
        const led = JSON.parse(e.data);
        listeners.led.forEach(cb => cb(led));
    });
};

// Returns the function to unsubscribe
const Subscribe = (type, callback) => {
    connect();
    listeners[type].add(callback);
    return () => { listeners[type].delete(callback); };
};

export {Subscribe};
