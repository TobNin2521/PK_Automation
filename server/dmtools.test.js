const dmtools = require("./dmtools");

const URL = "https://dm.example";

const fakeStore = () => {
    const make = () => {
        let data = {};
        return {
            get: (key, fallback) => data[key] !== undefined ? data[key] : fallback,
            set: (key, value) => { data[key] = JSON.parse(JSON.stringify(value)); },
            delete: (key) => { delete data[key]; },
            flush: () => {}
        };
    };
    return { settings: make(), secrets: make() };
};

describe("DM Tools link", () => {
    let store;
    let profiles;
    let calls;          // every request to DM Tools
    let syncStatus;     // 200, or 401 while the controller is not paired
    let syncReply;
    let pairReply;
    let link;

    const syncCalls = () => calls.filter(c => c.path === "/api/pk/sync");
    const pairCalls = () => calls.filter(c => c.path === "/api/pk/pair");

    beforeEach(() => {
        store = fakeStore();
        calls = [];
        syncStatus = 200;
        syncReply = { command: null, pollMs: 2000 };
        pairReply = { code: "K7QM4XTD", expiresAt: new Date(Date.now() + 15 * 60000).toISOString() };
        profiles = {
            createUser: jest.fn(() => "new-user-id-0123456789"),
            list: jest.fn(() => [
                { id: "aaa111", name: "Combat", playlistId: "x", leds: {}, created: 1, updated: 1 },
                { id: "bbb222", name: "Tavern", playlistId: "", leds: {}, created: 1, updated: 1 }
            ]),
            apply: jest.fn(async () => ({ playlist: "applied", leds: { bar: "applied" } })),
            create: jest.fn(async (userId, input) => ({ id: "ccc333", name: input.name }))
        };
        const fakeFetch = async (url, options) => {
            const path = url.slice(URL.length);
            calls.push({ path: path, headers: options.headers, body: JSON.parse(options.body) });
            if (path === "/api/pk/pair") return { ok: true, status: 200, json: async () => pairReply };
            return { ok: syncStatus === 200, status: syncStatus, json: async () => syncReply };
        };
        link = dmtools.create({ profiles: profiles, store: store, fetch: fakeFetch, log: () => {} });
        store.settings.set("dmtoolsUrl", URL);
    });

    afterEach(() => link.stop());

    test("Stays off without an address", async () => {
        store.settings.delete("dmtoolsUrl");
        await link.sync();
        expect(calls).toHaveLength(0);
        expect(link.status()).toMatchObject({ state: "off", url: null });
    });

    test("Makes up its own token and user once", async () => {
        await link.sync();
        const saved = store.secrets.get("dmtools");
        expect(saved.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(saved.userId).toBe("new-user-id-0123456789");

        await link.sync();
        expect(store.secrets.get("dmtools")).toEqual(saved);
        expect(profiles.createUser).toHaveBeenCalledTimes(1);
    });

    test("Reports id and name of the profiles, with its token", async () => {
        await link.sync();
        const token = store.secrets.get("dmtools").token;
        expect(syncCalls()[0].headers.Authorization).toBe("Bearer " + token);
        expect(syncCalls()[0].body).toEqual({
            profiles: [{ id: "aaa111", name: "Combat" }, { id: "bbb222", name: "Tavern" }]
        });
        expect(link.status().state).toBe("linked");
    });

    test("Makes a user again when its own is gone", async () => {
        store.secrets.set("dmtools", { token: "t".repeat(43), userId: "lost-user-id-0123456789" });
        profiles.list.mockImplementationOnce(() => {
            const err = new Error("Unknown user id");
            err.code = "UNKNOWN_USER";
            throw err;
        });
        await link.sync();
        expect(store.secrets.get("dmtools").userId).toBe("new-user-id-0123456789");
        expect(syncCalls()).toHaveLength(1);
    });

    describe("pairing", () => {
        test("Registers its token and shows the code while DM Tools does not know it", async () => {
            syncStatus = 401;
            await link.sync();

            const token = store.secrets.get("dmtools").token;
            expect(pairCalls()).toHaveLength(1);
            expect(pairCalls()[0].body).toEqual({ token: token });
            // The token travels in the body, not as a login
            expect(pairCalls()[0].headers.Authorization).toBeUndefined();
            expect(link.status()).toMatchObject({ state: "pairing", code: "K7QM-4XTD" });
        });

        test("Does not ask for a new code while the last one holds", async () => {
            syncStatus = 401;
            await link.sync();
            await link.sync();
            expect(syncCalls()).toHaveLength(2);
            expect(pairCalls()).toHaveLength(1);
        });

        test("Asks for a new code when the last one is about to expire", async () => {
            pairReply = { code: "AAAA2222", expiresAt: new Date(Date.now() + 10000).toISOString() };
            syncStatus = 401;
            await link.sync();
            pairReply = { code: "BBBB3333", expiresAt: new Date(Date.now() + 15 * 60000).toISOString() };
            await link.sync();
            expect(pairCalls()).toHaveLength(2);
            expect(link.status().code).toBe("BBBB-3333");
        });

        test("Is linked as soon as the game master has typed the code", async () => {
            syncStatus = 401;
            await link.sync();
            syncStatus = 200;
            await link.sync();
            expect(link.status()).toMatchObject({ state: "linked", code: null });
        });

        test("Shows no code when DM Tools says it is paired already", async () => {
            pairReply = { paired: true };
            syncStatus = 401;
            await link.sync();
            expect(link.status().code).toBeNull();
        });

        test("Shows a new code and counts requests from zero again when the controller was removed in DM Tools", async () => {
            syncReply = { command: { seq: 5, action: "apply", profile: "aaa111" }, pollMs: 2000 };
            await link.sync();
            expect(profiles.apply).toHaveBeenCalledTimes(1);

            syncStatus = 401;           // removed in DM Tools
            await link.sync();
            expect(link.status().state).toBe("pairing");

            syncStatus = 200;           // added again, its requests start at 1
            syncReply = { command: { seq: 1, action: "apply", profile: "bbb222" }, pollMs: 2000 };
            await link.sync();
            expect(profiles.apply).toHaveBeenCalledTimes(2);
            expect(profiles.apply).toHaveBeenLastCalledWith("new-user-id-0123456789", "bbb222");
        });
    });

    describe("requests of the game master", () => {
        test("Applies a profile once and confirms it on the next call", async () => {
            syncReply = { command: { seq: 4, action: "apply", profile: "aaa111" }, pollMs: 2000 };

            await link.sync();
            await link.sync();   // DM Tools asks again, it has not seen the confirmation yet

            expect(profiles.apply).toHaveBeenCalledTimes(1);
            expect(profiles.apply).toHaveBeenCalledWith("new-user-id-0123456789", "aaa111");
            expect(syncCalls()[1].body.ack).toBe(4);
            expect(syncCalls()[1].body.active).toBe("aaa111");
            expect(store.settings.get("dmtoolsActive")).toBe("aaa111");
        });

        test("Treats a request without an action as applying a profile", async () => {
            syncReply = { command: { seq: 1, profile: "bbb222" }, pollMs: 2000 };
            await link.sync();
            expect(profiles.apply).toHaveBeenCalledWith("new-user-id-0123456789", "bbb222");
        });

        test("Confirms a profile it cannot apply instead of retrying forever", async () => {
            profiles.apply.mockRejectedValue(new Error("Unknown profile"));
            syncReply = { command: { seq: 2, action: "apply", profile: "gone" }, pollMs: 2000 };

            await link.sync();
            await link.sync();

            expect(syncCalls()[1].body.ack).toBe(2);
            expect(syncCalls()[1].body.active).toBeUndefined();
        });

        test("Does not call a profile active when none of its parts worked", async () => {
            profiles.apply.mockResolvedValue({ playlist: "failed: x", leds: { bar: "failed: offline" } });
            syncReply = { command: { seq: 1, action: "apply", profile: "aaa111" }, pollMs: 2000 };

            await link.sync();
            await link.sync();

            expect(syncCalls()[1].body.active).toBeUndefined();
        });

        test("Does not report an active profile that no longer exists", async () => {
            store.settings.set("dmtoolsActive", "deleted-profile");
            await link.sync();
            expect(syncCalls()[0].body.active).toBeUndefined();
        });

        test("Saves the current lighting as a profile and confirms it", async () => {
            syncReply = { command: { seq: 3, action: "save", name: "Boss fight" }, pollMs: 2000 };

            await link.sync();
            await link.sync();

            expect(profiles.create).toHaveBeenCalledTimes(1);
            expect(profiles.create).toHaveBeenCalledWith("new-user-id-0123456789", {
                name: "Boss fight",
                fromCurrent: true
            });
            expect(profiles.apply).not.toHaveBeenCalled();
            expect(syncCalls()[1].body.ack).toBe(3);
        });

        test("Confirms a save that fails instead of retrying forever", async () => {
            profiles.create.mockRejectedValue(new Error("A profile with this name already exists"));
            syncReply = { command: { seq: 1, action: "save", name: "Combat" }, pollMs: 2000 };

            await link.sync();
            await link.sync();

            expect(profiles.create).toHaveBeenCalledTimes(1);
            expect(syncCalls()[1].body.ack).toBe(1);
        });
    });

    describe("address", () => {
        test("Keeps only the origin of the address and starts the link", () => {
            store.settings.delete("dmtoolsUrl");
            link.setUrl(URL + "/some/page?x=1");
            expect(store.settings.get("dmtoolsUrl")).toBe(URL);
            expect(link.status().url).toBe(URL);
        });

        test.each([
            ["a url that is not http(s)", "ftp://dm.example"],
            ["text that is no url", "dm example"],
            ["nothing", undefined]
        ])("Rejects %s", (_label, input) => {
            expect(() => link.setUrl(input)).toThrow(RangeError);
        });

        test("reset forgets the address and the token but keeps the user", () => {
            store.secrets.set("dmtools", { token: "t".repeat(43), userId: "user-1" });
            link.reset();
            expect(store.settings.get("dmtoolsUrl")).toBeUndefined();
            expect(store.secrets.get("dmtools")).toEqual({ userId: "user-1" });
            expect(link.status()).toMatchObject({ state: "off", url: null, userId: "user-1" });
        });
    });
});
