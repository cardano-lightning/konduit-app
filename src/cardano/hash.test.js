import { describe, it, expect } from "vitest";
import * as hex from "../utils/hex.js";

import { blake2b224 } from "./hash.js";

// Helper to convert test strings to Uint8Array
const enc = new TextEncoder();

describe("blake2b-224 Hashing", () => {
  it("should return a hash of the correct length (28 bytes)", () => {
    const input = enc.encode("test data");
    const hash = blake2b224(input);
    expect(hash.length).toBe(28);
  });

  it("(Test Vector 1)", () => {
    const input = new Uint8Array([]);
    // Test vector from RFC 7693
    const expectedHex =
      "836cc68931c2e4e3e838602eca1902591d216837bafddfe6f0c8cb07";
    const hash = blake2b224(input);
    expect(hex.encode(hash)).toBe(expectedHex);
  });

  it("(Test Vector 2)", () => {
    const input = enc.encode("abc");
    const expectedHex =
      "9bd237b02a29e43bdd6738afa5b53ff0eee178d6210b618e4511aec8";
    const hash = blake2b224(input);
    expect(hex.encode(hash)).toBe(expectedHex);
  });

  it("(Test Vector 3)", () => {
    const input = enc.encode("The quick brown fox jumps over the lazy dog");
    const expectedHex =
      "477c3985751dd4d1b8c93827ea5310b33bb02a26463a050dffd3e857";
    const hash = blake2b224(input);
    expect(hex.encode(hash)).toBe(expectedHex);
  });

  it("(Test Vector 4)", () => {
    const input = hex.decode("010203");
    const expectedHex =
      "57b5f532b362f7ad847e86b1c8e453cdf4c1f27f73e5db80a93134cd";
    const hash = blake2b224(input);
    expect(hex.encode(hash)).toBe(expectedHex);
  });
});
