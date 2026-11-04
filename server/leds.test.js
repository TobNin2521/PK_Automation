const leds = require("./leds");

// The metadata strings as WLED 0.14 and 16 report them in /json/fxdata
const FXDATA = [
    "",                                                                     // 0 Solid
    "!,!;!,!;!;01",                                                         // 1
    "!;!,!;!;01",                                                           // 2 Breathe
    "Cooling,Spark rate,,2D Blur,Boost;;!;1;pal=35,sx=64,ix=160,m12=1,c2=128" // 3 Fire 2012
];

describe("effect parameters", () => {
    test("Reads the defaults of an effect and leaves out the 2D mapping", () => {
        expect(leds.parseDefaults(FXDATA[3])).toEqual({ pal: 35, sx: 64, ix: 160, c2: 128 });
        expect(leds.parseDefaults("Cooling,Spark rate,,,Boost;;!;1;sx=64,ix=160,m12=1")).toEqual({ sx: 64, ix: 160 });
    });

    test("Reads options as true or false and skips anything that is not a byte", () => {
        expect(leds.parseDefaults("!;;!;;o1=1,o2=0,sx=300,ix=x,c3=16")).toEqual({ o1: true, o2: false, c3: 16 });
    });

    test("Reads the metadata of older firmware that starts with @", () => {
        expect(leds.parseDefaults("@Time [min],Width;;!;;sx=60")).toEqual({ sx: 60 });
    });

    test("An effect without metadata has no defaults", () => {
        expect(leds.parseDefaults("")).toEqual({});
        expect(leds.parseDefaults(undefined)).toEqual({});
        expect(leds.parseDefaults(FXDATA[2])).toEqual({});
    });
});

describe("setLed", () => {
    let posted;
    let fxdataFails;
    const realFetch = global.fetch;

    beforeEach(() => {
        posted = [];
        fxdataFails = false;
        global.fetch = jest.fn(async (url, options) => {
            const path = new URL(url).pathname;
            const json = (data) => ({ ok: true, status: 200, json: async () => data });
            if (options && options.method === "POST") {
                posted.push(JSON.parse(options.body));
                return json({ success: true });
            }
            if (path === "/json/fxdata") {
                if (fxdataFails) return { ok: false, status: 404, json: async () => ({}) };
                return json(FXDATA);
            }
            if (path === "/json/eff") return json(["Solid", "Blink@!,!;!,!;!;01", "Breathe", "Fire 2012@Cooling;;!;1;sx=64"]);
            return json({ on: true, bri: 128, seg: [{ col: [[255, 0, 0]], fx: 0 }] });
        });
    });

    afterEach(() => {
        global.fetch = realFetch;
    });

    test("Sends an effect with the WLED base values and its own defaults", async () => {
        await leds.setLed("bar", { color: [255, 74, 28], brightness: 204, effect: 3 });
        expect(posted[0]).toEqual({
            bri: 204,
            seg: [{
                col: [[255, 74, 28]], fx: 3,
                sx: 64, ix: 160, c1: 128, c2: 128, c3: 16, o1: false, o2: false, o3: false, pal: 35
            }]
        });
    });

    test("An effect without defaults gets the base values, so nothing of the effect before stays", async () => {
        await leds.setLed("bar", { effect: 2 });
        expect(posted[0].seg[0]).toEqual({
            fx: 2, sx: 128, ix: 128, c1: 128, c2: 128, c3: 16, o1: false, o2: false, o3: false, pal: 0
        });
    });

    test("A change without an effect leaves the effect parameters alone", async () => {
        await leds.setLed("bar", { color: [0, 0, 255] });
        expect(posted[0]).toEqual({ seg: [{ col: [[0, 0, 255]] }] });
    });

    test("Older firmware without /json/fxdata: the defaults come from the effect names", async () => {
        fxdataFails = true;     // wand was not used before, so its metadata is loaded now
        await leds.setLed("wand", { effect: 3 });
        expect(posted[0].seg[0]).toMatchObject({ fx: 3, sx: 64, ix: 128 });
    });
});
