import { describe, it, expect } from "vitest";
import { toVerificationKey } from "../cardano/keys.js";
import * as hex from "../utils/hex.js";

import { Cheque } from "./cheque.js";
import { ChequeBody } from "./chequeBody.js";

describe("Cheque", () => {
  it("should correctly create, verify, and format a cheque", () => {
    // --- Setup ---
    const signingKey = new Uint8Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]);
    const tagStr = "konduitIsAwesome";
    const encoder = new TextEncoder();
    const tag = encoder.encode(tagStr);

    const lock = new Uint8Array([
      9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
      9, 9, 9, 9, 9, 9, 9,
    ]);
    const body = new ChequeBody(0, 100, 0, lock);

    // --- Create ---
    const cheque = Cheque.make(signingKey, tag, body);

    // Test that a cheque object is created
    expect(cheque).toBeInstanceOf(Cheque);
    expect(cheque.body).toBe(body);
    expect(cheque.signature).toBeInstanceOf(Uint8Array);
    expect(cheque.signature.length).toBe(64);

    // --- Verify ---
    const verificationKey = toVerificationKey(signingKey);
    expect(cheque.verify(verificationKey, tag)).toBe(true);

    // Test verification failure with a bad key
    const badKey = new Uint8Array(32).fill(1);
    expect(cheque.verify(badKey, tag)).toBe(false);

    // Test verification failure with a bad tag
    const badTag = encoder.encode("wrongTag");
    expect(cheque.verify(verificationKey, badTag)).toBe(false);

    // --- Format ---
    const aikenString = cheque.asAiken();
    const hexSignature = hex.encode(cheque.signature);

    // Check that the Aiken string is formatted as expected
    expect(aikenString).toContain(body.asAiken());
    expect(aikenString).toContain(hexSignature);

    // --- CBOR ---
    const cborData = cheque.toCbor();
    expect(cborData).toBeInstanceOf(Uint8Array);
    expect(cborData.length).toBeGreaterThan(0);

    // --- CBOR Roundtrip ---
    const bodyCbor = body.toCbor();
    const decodedBody = ChequeBody.fromCbor(bodyCbor);
    expect(decodedBody).toBeInstanceOf(ChequeBody);
    expect(decodedBody.index).toBe(body.index);
    expect(decodedBody.amount).toBe(body.amount);
    expect(decodedBody.timeout).toBe(body.timeout);
    expect(decodedBody.lock).toStrictEqual(body.lock);

    const chequeCbor = cheque.toCbor();
    const decodedCheque = Cheque.fromCbor(chequeCbor);
    expect(decodedCheque).toBeInstanceOf(Cheque);
    expect(decodedCheque.body).toBeInstanceOf(ChequeBody);
    expect(decodedCheque.body.index).toBe(body.index);
    expect(decodedCheque.body.amount).toBe(body.amount);
    expect(decodedCheque.body.timeout).toBe(body.timeout);
    expect(decodedCheque.body.lock).toEqual(body.lock);
    expect(decodedCheque.signature).toEqual(cheque.signature);
  });
  it("should correctly create, verify, and format a cheque", () => {
    // --- Setup ---
    const signingKey = new Uint8Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]);
    const tagStr = "konduitIsAwesome";
    const encoder = new TextEncoder();
    const tag = encoder.encode(tagStr);

    const lock = new Uint8Array([
      9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
      9, 9, 9, 9, 9, 9, 9,
    ]);
    const body = new ChequeBody(0, 100, 1399999999999923, lock);
    console.log(hex.encode(body.toCbor()));

    // --- Create ---
    const cheque = Cheque.make(signingKey, tag, body);

    // --- CBOR ---
    const cborData = cheque.toCbor();
    expect(cborData).toBeInstanceOf(Uint8Array);
    expect(cborData.length).toBeGreaterThan(0);

    // --- CBOR Roundtrip ---
    const bodyCbor = body.toCbor();
    const decodedBody = ChequeBody.fromCbor(bodyCbor);
    expect(decodedBody).toBeInstanceOf(ChequeBody);
    expect(decodedBody.index).toBe(body.index);
    expect(decodedBody.amount).toBe(body.amount);
    expect(decodedBody.timeout).toBe(body.timeout);
    expect(decodedBody.lock).toStrictEqual(body.lock);

    const chequeCbor = cheque.toCbor();
    const decodedCheque = Cheque.fromCbor(chequeCbor);
    expect(decodedCheque).toBeInstanceOf(Cheque);
    expect(decodedCheque.body).toBeInstanceOf(ChequeBody);
    expect(decodedCheque.body.index).toBe(body.index);
    expect(decodedCheque.body.amount).toBe(body.amount);
    expect(decodedCheque.body.timeout).toBe(body.timeout);
    expect(decodedCheque.body.lock).toEqual(body.lock);
    expect(decodedCheque.signature).toEqual(cheque.signature);
  });
});
