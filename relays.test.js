const relays = require("./relays")(false);

describe("Unit tests for relay class", () => {
    test("Test Parse function", () => {
        expect(relays.ParseDataIfString({red:0, green:0, blue:0})).toEqual({red:0, green:0, blue:0});
        expect(relays.ParseDataIfString('{"red":0,"green":0,"blue":0}')).toEqual({red:0, green:0, blue:0});
        expect(relays.ParseDataIfString({})).toEqual({});
        expect(relays.ParseDataIfString("{}")).toEqual({});
    });
});