/***************************************************************************
 *
 *   Looks for PK-Automation servers on the network (mDNS) and prints the
 *   address of their api. Usage: node discover.js [seconds to search]
 *
 **************************************************************************/

const { Bonjour } = require("bonjour-service");

const bonjour = new Bonjour();
const seconds = Number(process.argv[2]) || 5;
let found = 0;

console.log("Searching for _pkautomation._tcp for " + seconds + " seconds...");
bonjour.find({ type: "pkautomation" }, (service) => {
    found++;
    // Prefer an IPv4 address
    const address = (service.addresses || []).find(a => a.includes(".")) || service.host;
    const txt = service.txt || {};
    console.log(service.name + ": " + (txt.protocol || "http") + "://" + address + ":" + service.port + (txt.path || ""));
});

setTimeout(() => {
    if (found === 0) console.log("Nothing found");
    bonjour.destroy();
    process.exit(0);
}, seconds * 1000);
