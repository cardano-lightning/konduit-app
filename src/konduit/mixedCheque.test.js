import { describe, it, expect } from "vitest";
import { sha256 } from "@noble/hashes/sha2.js";

import * as hex from "../utils/hex.js";

import { Cheque } from "./cheque.js";
import { ChequeBody } from "./chequeBody.js";
import { Unlocked } from "./unlocked.js";
import { MixedCheque } from "./mixedCheque.js";

// --- Setup ---
const signingKey = new Uint8Array(32).fill(0);
const tagStr = "konduitTestTag";
const encoder = new TextEncoder();
const tag = encoder.encode(tagStr);

const secret = new Uint8Array(32).fill(1);
const lock = sha256(secret);

const rustCheque = hex.decode(
  "d87a9f9f0119270f1b0000000792f1a10058202222222222222222222222222222222222222222222222222222222222222222ff58401ad3303b02e6e45dc8ddf3c7f95d746120785a6bd0067198696d07a5dfbc343bdbcb7fe0bdbe232cd4498fdcd35c242e5ba49bed5c0eaa9fd04ffb90aa2da004ff",
);
const rustUnlocked = hex.decode(
  "d8799f9f0119270f1b0000000792f1a10058209f72ea0cf49536e3c66c787f705186df9a4378083753ae9536d65b3ad7fcddc4ff584029c0bc24c2068aa96f4dc99ac072aa73338d06130ef7b38c3936079c433b4a41b3bd59e1e5db36aae1a6708b0e1855ac9fc182f08e9053d2f6c7be147b6cba0258202222222222222222222222222222222222222222222222222222222222222222ff",
);

describe("MixedCheque", () => {
  describe("CBOR Roundtrip - Cheque Variant", () => {
    it("should correctly serialise and deserialise a Cheque variant", () => {
      const body = new ChequeBody(1, 100, 10, lock);
      const cheque = Cheque.make(signingKey, tag, body);
      const mixedCheque = MixedCheque.fromCheque(cheque);

      const cborData = mixedCheque.toCbor();
      expect(cborData).toBeInstanceOf(Uint8Array);

      const decoded = MixedCheque.fromCbor(cborData);

      expect(decoded).toBeInstanceOf(MixedCheque);
      expect(decoded.variant).toBe("Cheque");
      expect(decoded.isCheque()).toBe(true);
      expect(decoded.value).toBeInstanceOf(Cheque);

      const decodedCheque = decoded.asCheque();
      expect(decodedCheque.body.index).toBe(1);
      expect(decodedCheque.body.amount).toBe(100);
      expect(decodedCheque.body.lock).toEqual(lock);
      expect(decodedCheque.signature).toEqual(cheque.signature);
    });
  });

  describe("CBOR Roundtrip - Unlocked Variant", () => {
    it("should correctly serialise and deserialise an Unlocked variant", () => {
      const unlocked = Unlocked.make(signingKey, tag, 2, 200, 20, secret);
      const mixedUnlocked = MixedCheque.fromUnlocked(unlocked);

      const cborData = mixedUnlocked.toCbor();
      expect(cborData).toBeInstanceOf(Uint8Array);

      const decoded = MixedCheque.fromCbor(cborData);

      expect(decoded).toBeInstanceOf(MixedCheque);
      expect(decoded.variant).toBe("Unlocked");
      expect(decoded.isCheque()).toBe(false);
      expect(decoded.value).toBeInstanceOf(Unlocked);

      const decodedUnlocked = decoded.asUnlocked();
      expect(decodedUnlocked.body.index).toBe(2);
      expect(decodedUnlocked.body.amount).toBe(200);
      expect(decodedUnlocked.body.lock).toEqual(lock);
      expect(decodedUnlocked.signature).toEqual(unlocked.signature);
      expect(decodedUnlocked.secret).toEqual(unlocked.secret);
    });
  });

  describe("CBOR from rust cheque", () => {
    it("should correctly serialise and deserialise an Unlocked variant", () => {
      const decoded = MixedCheque.fromCbor(rustCheque);

      expect(decoded).toBeInstanceOf(MixedCheque);
      expect(decoded.variant).toBe("Cheque");
      const cheque = decoded.asCheque();
      expect(cheque.body.index).toBe(1);
      expect(cheque.body.amount).toBe(9999);
      expect(cheque.body.lock).toEqual(
        hex.decode(
          "2222222222222222222222222222222222222222222222222222222222222222",
        ),
      );
    });
  });

  describe("CBOR from rust cheque", () => {
    it("should correctly serialise and deserialise an Unlocked variant", () => {
      const decoded = MixedCheque.fromCbor(rustUnlocked);

      expect(decoded).toBeInstanceOf(MixedCheque);
      expect(decoded.variant).toBe("Unlocked");
      const unlocked = decoded.asUnlocked();
      expect(unlocked.body.index).toBe(1);
      expect(unlocked.body.amount).toBe(9999);
      expect(unlocked.secret).toEqual(
        hex.decode(
          "2222222222222222222222222222222222222222222222222222222222222222",
        ),
      );
    });
  });
});
