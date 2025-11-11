import { describe, it, expect } from "vitest";

import { toVerificationKey } from "../cardano/keys.js";

import { Squash } from "./squash.js";
import { SquashBody } from "./squashBody.js";

describe("Squash", () => {
  it("should correctly create, verify, and format a squash", () => {
    // --- Setup ---
    const signingKey = new Uint8Array(32).fill(0);
    const tagStr = "konduitSquashTag";
    const encoder = new TextEncoder();
    const tag = encoder.encode(tagStr);

    // Create a valid body
    const body = new SquashBody(100, 5, [0, 2, 4]);
    // self-verify the body is valid (based on squashBody.test.js)
    expect(body.verify()).toBe(true);

    // --- Create ---
    const squash = Squash.make(signingKey, tag, body);

    // Test that a squash object is created
    expect(squash).toBeInstanceOf(Squash);
    expect(squash.body).toBe(body);
    expect(squash.signature).toBeInstanceOf(Uint8Array);
    expect(squash.signature.length).toBeGreaterThan(0);

    // --- Verify ---
    const verificationKey = toVerificationKey(signingKey);
    expect(squash.verify(verificationKey, tag)).toBe(true);

    // Test verification failure with a bad key
    const badKey = new Uint8Array(32).fill(1); // Different key
    expect(squash.verify(badKey, tag)).toBe(false);

    // Test verification failure with a bad tag
    const badTag = encoder.encode("wrongTag");
    expect(squash.verify(verificationKey, badTag)).toBe(false);

    // --- CBOR ---
    const cborData = squash.toCbor();
    expect(cborData).toBeInstanceOf(Uint8Array);
    expect(cborData.length).toBeGreaterThan(0);

    // --- CBOR Roundtrip ---
    const decoded = Squash.fromCbor(cborData);
    expect(decoded).toBeInstanceOf(Squash);
    expect(decoded.body).toBeInstanceOf(SquashBody);
    expect(decoded.body.amount).toBe(body.amount);
    expect(decoded.body.index).toBe(body.index);
    expect(decoded.body.exclude).toEqual(body.exclude);
    expect(decoded.signature).toEqual(squash.signature);
  });
});
