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
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]);
    const tagStr = "konduitIsAwesome";
    const encoder = new TextEncoder();
    const tag = encoder.encode(tagStr);
    const secret = new Uint8Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]);
    const verificationKey = toVerificationKey(signingKey);

    // --- Create ---
    const unlocked = Unlocked.make(signingKey, tag, 0, 100, 0, secret);

    // --- Test Instance ---
    expect(unlocked).toBeInstanceOf(Unlocked);
    expect(unlocked.secret).toEqual(secret);
    expect(unlocked.body).toBeInstanceOf(ChequeBody);
    expect(unlocked.signature).toBeInstanceOf(Uint8Array);

    // --- Test Body / Lock ---
    const expectedLock = sha256(secret);
    expect(unlocked.body.lock).toEqual(expectedLock);
    expect(unlocked.body.index).toBe(0);
    expect(unlocked.body.amount).toBe(100);

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
  });
});
