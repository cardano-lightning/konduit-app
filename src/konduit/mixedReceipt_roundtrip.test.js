import { describe, it, expect } from "vitest";

import { MixedReceipt } from "./mixedReceipt.js";
import { MixedCheque } from "./mixedCheque.js";
import { Cheque } from "./cheque.js";
import { Unlocked } from "./unlocked.js";
import { ChequeBody } from "./chequeBody.js";
import { Squash } from "./squash.js";
import { SquashBody } from "./squashBody.js";

const MOCK_SIGNING_KEY = new Uint8Array(32).fill(1);
const MOCK_TAG = new Uint8Array([10, 20, 30]);

const createRealSquash = (
  /** @type {number} */ amount,
  /** @type {number} */ index,
  /** @type {number[]} */ exclude,
) => {
  const body = new SquashBody(amount, index, exclude);
  const signature = new Uint8Array(64).fill(index);
  return new Squash(body, signature);
};

const createRealCheque = (/** @type {number} */ index) => {
  const body = new ChequeBody(
    index,
    index * 100,
    1000 + index,
    new Uint8Array([index, 2, 3, 4]), // mock lock
  );
  return Cheque.make(MOCK_SIGNING_KEY, MOCK_TAG, body);
};

const createRealUnlocked = (/** @type {number} */ index) => {
  const secret = new Uint8Array([index, 5, 6, 7]);
  return Unlocked.make(
    MOCK_SIGNING_KEY,
    MOCK_TAG,
    index,
    index * 100,
    1000 + index,
    secret,
  );
};

// --- Test Suite ---

describe("MixedReceipt serialise/deserialise roundtrip (no mocks)", () => {
  it("should correctly serialise and deserialise a complex receipt", () => {
    // 1. Create the original data using real classes
    const originalSquash = createRealSquash(2000, 5, [1, 3]);
    const mixedCheques = [
      MixedCheque.fromCheque(createRealCheque(6)),
      MixedCheque.fromUnlocked(createRealUnlocked(7)),
      MixedCheque.fromCheque(createRealCheque(8)),
      MixedCheque.fromUnlocked(createRealUnlocked(10)),
    ];
    const originalReceipt = new MixedReceipt(originalSquash, mixedCheques);

    // 2. Serialise
    const serialisedData = originalReceipt.serialise();

    // 3. Deserialise
    const deserialisedReceipt = MixedReceipt.deserialise(serialisedData);

    // 4. Verify
    // .toEqual() performs a deep comparison of the objects
    expect(deserialisedReceipt).toEqual(originalReceipt);

    // 5. Verify (optional) class types are restored
    expect(deserialisedReceipt).toBeInstanceOf(MixedReceipt);
    expect(deserialisedReceipt.squash).toBeInstanceOf(Squash);
    expect(deserialisedReceipt.squash.body).toBeInstanceOf(SquashBody);
    expect(deserialisedReceipt.mixedCheques[0]).toBeInstanceOf(MixedCheque);
    expect(deserialisedReceipt.mixedCheques[0].value).toBeInstanceOf(Cheque);
    expect(deserialisedReceipt.mixedCheques[0].value.body).toBeInstanceOf(
      ChequeBody,
    );
    expect(deserialisedReceipt.mixedCheques[1].value).toBeInstanceOf(Unlocked);
    expect(deserialisedReceipt.mixedCheques[1].value.body).toBeInstanceOf(
      ChequeBody,
    );
  });

  it("should correctly roundtrip an empty receipt", () => {
    const originalSquash = createRealSquash(100, 0, []);
    const originalReceipt = new MixedReceipt(originalSquash, []);

    const serialisedData = originalReceipt.serialise();
    const deserialisedReceipt = MixedReceipt.deserialise(serialisedData);

    expect(deserialisedReceipt).toEqual(originalReceipt);
    expect(deserialisedReceipt.mixedCheques.length).toBe(0);
    expect(deserialisedReceipt.squash.body.index).toBe(0);
  });

  describe("CBOR Roundtrip", () => {
    it("should correctly serialise and deserialise a mixed receipt", () => {
      // 1. Create the original data using real classes
      const cheque6 = createRealCheque(6);
      const unlocked7 = createRealUnlocked(7);
      const originalSquash = createRealSquash(2000, 5, [1, 3]);
      const mixedCheques = [
        MixedCheque.fromCheque(cheque6),
        MixedCheque.fromUnlocked(unlocked7),
        MixedCheque.fromCheque(createRealCheque(8)),
        MixedCheque.fromUnlocked(createRealUnlocked(10)),
      ];
      const receipt = new MixedReceipt(originalSquash, mixedCheques);
      const cborData = receipt.toCbor();
      expect(cborData).toBeInstanceOf(Uint8Array);

      const decoded = MixedReceipt.fromCbor(cborData);

      // Check squash
      expect(decoded.squash).toBeInstanceOf(Squash);
      expect(decoded.squash.body.index).toBe(receipt.squash.body.index);
      expect(decoded.squash.body.amount).toBe(receipt.squash.body.amount);
      expect(decoded.squash.body.exclude).toEqual(receipt.squash.body.exclude);
      expect(decoded.squash.signature).toEqual(receipt.squash.signature);

      // Check mixed cheques
      expect(decoded.mixedCheques.length).toBe(receipt.mixedCheques.length);

      // Cheque6
      const decodedCheque = decoded.mixedCheques[0].asCheque();
      expect(decodedCheque.body.index).toBe(cheque6.body.index);
      expect(decodedCheque.signature).toEqual(cheque6.signature);

      // unlocked7
      const decodedUnlocked = decoded.mixedCheques[1].asUnlocked();
      expect(decodedUnlocked.body.index).toBe(unlocked7.body.index);
      expect(decodedUnlocked.secret).toEqual(unlocked7.secret);
    });
  });
});
