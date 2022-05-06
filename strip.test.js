const strip = require("./strip")(false);

describe("Unit tests for strip class", () => {
    test("Test set brightness function", () => {
        strip.SetBrightness(0);
        expect(strip.channel.brightness).toBe(0);
        strip.SetBrightness(-100);
        expect(strip.channel.brightness).toBe(0);
        strip.SetBrightness(300);
        expect(strip.channel.brightness).toBe(255);
        strip.SetBrightness(100);
        expect(strip.channel.brightness).toBe(100);
        strip.SetBrightness("123");
        expect(strip.channel.brightness).toBe(200);
    });

    test("Test random number generator", () => {
        let random = strip.getRandomInt(0, 100);
        expect(random).toBeGreaterThanOrEqual(0);
        expect(random).toBeLessThanOrEqual(100);
        random = strip.getRandomInt(5, 10)
        expect(random).toBeGreaterThanOrEqual(5);
        expect(random).toBeLessThanOrEqual(10);
        random = strip.getRandomInt(-5, 5);
        expect(random).toBeGreaterThanOrEqual(-5);
        expect(random).toBeLessThanOrEqual(5);
        random = strip.getRandomInt(-10, -5);
        expect(random).toBeGreaterThanOrEqual(-10);
        expect(random).toBeLessThanOrEqual(-5);
        random = strip.getRandomInt(30, 100);
        expect(random).toBeGreaterThanOrEqual(30);
        expect(random).toBeLessThanOrEqual(100);
    });

    test("Test RGB to Int function", () => {
        expect(strip.Rgb2Int(0, 0, 0)).toBe(0);
        expect(strip.Rgb2Int(0, 255, 255)).toBe(65535);
        expect(strip.Rgb2Int(0, 0, 255)).toBe(255);
        expect(strip.Rgb2Int(255, 255, 255)).toBe(16777215);
    });

    test("Test Int to Red function", () => {
        expect(strip.Int2R(0)).toBe(0);
        expect(() => strip.Int2R("0")).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2R(0.5)).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2R(-1)).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2R(16777216)).toThrow("Must provide an integer between 0 and 16777215");
        expect(strip.Int2R(16777215)).toBe(255);
        expect(strip.Int2R(65535)).toBe(0);
        expect(strip.Int2R(255)).toBe(0);
    });

    test("Test Int to Green function", () => {
        expect(strip.Int2G(0)).toBe(0);
        expect(() => strip.Int2G("0")).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2G(0.5)).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2G(-1)).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2G(16777216)).toThrow("Must provide an integer between 0 and 16777215");
        expect(strip.Int2G(16777215)).toBe(255);
        expect(strip.Int2G(65535)).toBe(255);
        expect(strip.Int2G(255)).toBe(0);
    });

    test("Test Int to Blue function", () => {
        expect(strip.Int2B(0)).toBe(0);
        expect(() => strip.Int2B("0")).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2B(0.5)).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2B(-1)).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2B(16777216)).toThrow("Must provide an integer between 0 and 16777215");
        expect(strip.Int2B(16777215)).toBe(255);
        expect(strip.Int2B(65535)).toBe(255);
        expect(strip.Int2B(255)).toBe(255);
    });

    test("Test Int to RGB function", () => {
        expect(strip.Int2Rgb(0)).toEqual({red:0, green:0, blue:0});
        expect(() => strip.Int2Rgb("0")).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2Rgb(0.5)).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2Rgb(-1)).toThrow("Must provide an integer between 0 and 16777215");
        expect(() => strip.Int2Rgb(16777216)).toThrow("Must provide an integer between 0 and 16777215");
        expect(strip.Int2Rgb(16777215)).toEqual({red:255, green:255, blue:255});
        expect(strip.Int2Rgb(65535)).toEqual({red:0, green:255, blue:255});
        expect(strip.Int2Rgb(255)).toEqual({red:0, green:0, blue:255});
    });
    
    test("Test Parse function", () => {
        expect(strip.ParseDataIfString({red:0, green:0, blue:0})).toEqual({red:0, green:0, blue:0});
        expect(strip.ParseDataIfString('{"red":0,"green":0,"blue":0}')).toEqual({red:0, green:0, blue:0});
        expect(strip.ParseDataIfString({})).toEqual({});
        expect(strip.ParseDataIfString("{}")).toEqual({});
    });
});