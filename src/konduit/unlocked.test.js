import { describe, it, expect } from "vitest";
import { Unlocked } from "./unlocked.js";
import { Cheque } from "./cheque.js";
import { ChequeBody } from "./chequeBody.js";
import { toVerificationKey } from "../cardano/keys.js";
import * as hex from "../utils/hex.js";
import { sha256 } from "@noble/hashes/sha2.js";

describe("Unlocked", () => {
  it("should correctly create an unlocked cheque and format it", () => {
    // --- Setup ---
    const signingKey = new Uint8Array([
      0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]);
    const tagStr = "konduitIsAwesome";
    const encoder = new TextEncoder();
    const tag = encoder.encode(tagStr);
    const secret = new Uint8Array([
      0, 1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]);
    const verificationKey = toVerificationKey(signingKey);

    // --- Create ---
    const unlocked = Unlocked.make(
      signingKey,
      tag,
      11,
      123898392,
      172382797782,
      secret,
    );

    // --- Test Instance ---
    expect(unlocked).toBeInstanceOf(Unlocked);
    expect(unlocked.secret).toEqual(secret);
    expect(unlocked.body).toBeInstanceOf(ChequeBody);
    expect(unlocked.signature).toBeInstanceOf(Uint8Array);

    // --- Test Body / Lock ---
    const expectedLock = sha256(secret);
    expect(unlocked.body.lock).toEqual(expectedLock);
    expect(unlocked.body.index).toBe(11);
    expect(unlocked.body.amount).toBe(123898392);
    expect(unlocked.body.timeout).toBe(172382797782);

    // --- Test Signature Verification (indirectly) ---
    // We can re-create the cheque to verify the signature stored in `unlocked` is correct.
    const cheque = Cheque.make(signingKey, tag, unlocked.body);
    expect(unlocked.signature).toEqual(cheque.signature);
    expect(cheque.verify(verificationKey, tag)).toBe(true);

    // --- Test Formatting ---
    const aikenString = unlocked.asAiken();
    expect(aikenString).toContain(unlocked.body.asAiken());
    expect(aikenString).toContain(hex.encode(unlocked.signature));
    expect(aikenString).toContain(hex.encode(secret));

    // --- CBOR Roundtrip ---
    const cborData = unlocked.toCbor();
    const decoded = Unlocked.fromCbor(cborData);

    expect(decoded).toBeInstanceOf(Unlocked);
    expect(decoded.body).toBeInstanceOf(ChequeBody);
    expect(decoded.body.index).toBe(unlocked.body.index);
    expect(decoded.body.amount).toBe(unlocked.body.amount);
    expect(decoded.body.timeout).toBe(unlocked.body.timeout);
    expect(decoded.body.lock).toEqual(unlocked.body.lock);
    expect(decoded.signature).toEqual(unlocked.signature);
    expect(decoded.secret).toEqual(unlocked.secret);
  });
});
