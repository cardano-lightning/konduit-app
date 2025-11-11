import { describe, it, expect, vi } from "vitest";
import { SquashBody } from "./squashBody.js";

describe("SquashBody", () => {
  describe("verify", () => {
    it("should return true for a valid body", () => {
      const body = new SquashBody(100, 5, [0, 2, 4]);
      expect(body.verify()).toBe(true);
    });

    it("should return true for a valid body with an empty exclude list", () => {
      const body = new SquashBody(100, 5, []);
      expect(body.verify()).toBe(true);
    });

    it("should return true for a valid body with index 0 and empty exclude", () => {
      const body = new SquashBody(100, 0, []);
      expect(body.verify()).toBe(true);
    });

    it("should return false if index is less than 0", () => {
      const body = new SquashBody(100, -1, []);
      // Suppress console.error for this expected failure
      const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(body.verify()).toBe(false);
      consoleErrorMock.mockRestore();
    });

    it("should return false if exclude list is not strictly monotonically increasing", () => {
      const body = new SquashBody(100, 5, [1, 3, 2]);
      const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(body.verify()).toBe(false);
      consoleErrorMock.mockRestore();
    });

    it("should return false if exclude list is not strictly increasing (contains duplicates)", () => {
      const body = new SquashBody(100, 5, [1, 3, 3]);
      const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(body.verify()).toBe(false);
      consoleErrorMock.mockRestore();
    });

    it("should return false if an exclude value is equal to the index", () => {
      const body = new SquashBody(100, 5, [1, 3, 5]);
      const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(body.verify()).toBe(false);
      consoleErrorMock.mockRestore();
    });

    it("should return false if an exclude value is greater than the index", () => {
      const body = new SquashBody(100, 5, [1, 3, 6]);
      const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(body.verify()).toBe(false);
      consoleErrorMock.mockRestore();
    });

    it("should return false if an exclude value is less than 0", () => {
      // This fails because -1 is not > lastExcludeVal (which starts at -1)
      const body = new SquashBody(100, 5, [-1, 2]);
      const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(body.verify()).toBe(false);
      consoleErrorMock.mockRestore();
    });
  });

  describe("CBOR Roundtrip", () => {
    it("should correctly serialise and deserialise to/from CBOR", () => {
      const body = new SquashBody(100, 5, [0, 2, 4]);

      const cborData = body.toCbor();
      expect(cborData).toBeInstanceOf(Uint8Array);

      const decoded = SquashBody.fromCbor(cborData);
      expect(decoded).toBeInstanceOf(SquashBody);
      expect(decoded.amount).toBe(body.amount);
      expect(decoded.index).toBe(body.index);
      expect(decoded.exclude).toEqual(body.exclude);
    });

    it("should handle empty exclude list", () => {
      const body = new SquashBody(100, 5, []);
      const cborData = body.toCbor();
      const decoded = SquashBody.fromCbor(cborData);
      expect(decoded.amount).toBe(body.amount);
      expect(decoded.index).toBe(body.index);
      expect(decoded.exclude).toEqual(body.exclude);
    });

    it("should handle zero body", () => {
      const body = SquashBody.zero();
      const cborData = body.toCbor();
      const decoded = SquashBody.fromCbor(cborData);
      expect(decoded.amount).toBe(0);
      expect(decoded.index).toBe(0);
      expect(decoded.exclude).toEqual([]);
    });
  });
});
