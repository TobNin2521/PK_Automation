/***************************************************************************
 *
 *           mDNS (Bonjour/Avahi) announcement - PK-Automation
 *
 *   Announces the server as the service _pkautomation._tcp on the local
 *   network, so devices can find it without knowing its IP address.
 *   The TXT record tells how to reach the api:
 *     protocol  http or https
 *     path      base path of the api (/api)
 *     version   version of the api
 *
 **************************************************************************/

const { Bonjour } = require("bonjour-service");

const SERVICE_TYPE = "pkautomation";
const SERVICE_NAME = "PK Automation";

let bonjour = null;

const publish = (port, secure) => {
    try {
        bonjour = new Bonjour();
        const service = bonjour.publish({
            name: SERVICE_NAME,
            type: SERVICE_TYPE,
            port: port,
            txt: { protocol: secure ? "https" : "http", path: "/api", version: "1" }
        });
        service.on("up", () => console.log("mDNS: announced as _" + SERVICE_TYPE + "._tcp on port " + port));
        service.on("error", (err) => console.log("mDNS error:", err.message));
    }
    catch (err) {
        // The server works without it, devices just can't find it by name
        console.log("mDNS not available:", err.message);
    }
};

// Says goodbye to the network so the devices don't keep a stale entry
const unpublish = (done) => {
    if (bonjour === null) return done();
    const current = bonjour;
    bonjour = null;
    current.unpublishAll(() => {
        current.destroy();
        done();
    });
};

["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => unpublish(() => process.exit(0)));
});

module.exports = {
    publish,
    unpublish
};
