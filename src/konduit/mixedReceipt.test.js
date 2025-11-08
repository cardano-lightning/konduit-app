import { describe, it, expect, beforeEach } from "vitest";
import { sha256 } from "@noble/hashes/sha2.js";

import { SquashBody } from "./squashBody.js";
import { Squash } from "./squash.js";
import { ChequeBody } from "./chequeBody.js";
import { Cheque } from "./cheque.js";
import { Unlocked } from "./unlocked.js";
import { MixedCheque } from "./mixedCheque.js";
import { MixedReceipt } from "./mixedReceipt.js";
import { MAX_UNSQUASHED } from "./constants.js";

// --- Test Data Factory ---

// We need mock signatures, but since we don't test verification, they must be 64 bytes
const MOCK_SIG = new Uint8Array(64).fill(1); // 64 bytes, filled with 1
MOCK_SIG[1] = 2; // Add some variation
MOCK_SIG[2] = 3;
const MOCK_SIG_2 = new Uint8Array(64).fill(4); // 64 bytes, filled with 4
MOCK_SIG_2[1] = 5;
MOCK_SIG_2[2] = 6;

// Secrets and Locks
const secretA = new Uint8Array([1, 1, 1]);
const lockA = sha256(secretA);
const secretB = new Uint8Array([2, 2, 2]);
const lockB = sha256(secretB);
const secretC = new Uint8Array([3, 3, 3]);
const lockC = sha256(secretB);

// 1. Base Squash
const createBaseSquashBody = () => new SquashBody(1000, 16, [2, 5, 12, 15]);
const createBaseSquash = () => new Squash(createBaseSquashBody(), MOCK_SIG);

// 2. Cheque Bodies
const body12 = () => new ChequeBody(12, 100, 1, lockA); // index 12
const body15 = () => new ChequeBody(15, 200, 2, lockB); // index 15
const body18 = () => new ChequeBody(18, 300, 3, lockA); // index 18
const body20 = () => new ChequeBody(20, 300, 3, lockC); // index 18

// 3. Unlocked / Locked Cheques
const unlocked12 = () => new Unlocked(body12(), MOCK_SIG, secretA);
const cheque15 = () => new Cheque(body15(), MOCK_SIG);
const cheque18 = () => new Cheque(body18(), MOCK_SIG);
const unlocked20 = () => new Unlocked(body20(), MOCK_SIG, secretC);

// 4. MixedCheques
const mixedUnlocked12 = () => MixedCheque.fromUnlocked(unlocked12());
const mixedCheque15 = () => MixedCheque.fromCheque(cheque15());
const mixedCheque18 = () => MixedCheque.fromCheque(cheque18());

// 5. Base Receipt
const createBaseReceipt = () => {
  return MixedReceipt.new(createBaseSquash(), [
    mixedCheque15(), // index 15
    mixedUnlocked12(), // index 12
    mixedCheque18(), // index 18
  ]);
};

// --- Tests ---

describe("MixedReceipt", () => {
  let receipt;

  beforeEach(() => {
    receipt = createBaseReceipt();
  });

  describe("MixedReceipt.new", () => {
    it("should create a receipt and sort cheques by index", () => {
      expect(receipt.mixedCheques[0].index()).toBe(12);
      expect(receipt.mixedCheques[1].index()).toBe(15);
      expect(receipt.mixedCheques[2].index()).toBe(18);
    });

    it("should throw if a cheque index is already squashed", () => {
      const squashedChequeBody = new ChequeBody(8, 50, 1, lockA); // Index 8 is squashed by base squash
      const squashedCheque = MixedCheque.fromCheque(
        new Cheque(squashedChequeBody, MOCK_SIG),
      );

      expect(() => {
        MixedReceipt.new(createBaseSquash(), [squashedCheque]);
      }).toThrow("Index 8 is already squashed");
    });

    it("should throw on duplicate cheque indices", () => {
      const chequeA = mixedCheque15();
      const chequeB = mixedCheque15();

      expect(() => {
        MixedReceipt.new(createBaseSquash(), [chequeA, chequeB]);
      }).toThrow("Duplicate index 15");
    });
  });

  describe("Helpers", () => {
    it("max_index should return the highest index from cheques", () => {
      expect(receipt.max_index()).toBe(18);
    });

    it("max_index should return the squash index if it is highest", () => {
      const squashBody = new SquashBody(1000, 20, [15]);
      const squash = new Squash(squashBody, MOCK_SIG);
      const r = MixedReceipt.new(squash, [mixedCheque15()]);
      expect(r.max_index()).toBe(20);
    });

    it("capacity should return remaining slots", () => {
      // MAX_UNSQUASHED is now imported (value is 10)
      expect(receipt.capacity()).toBe(MAX_UNSQUASHED - 3);
    });

    it("cheques should return only locked Cheques", () => {
      const cheques = receipt.cheques();
      expect(cheques.length).toBe(2);
      expect(cheques[0].body.index).toBe(15);
      expect(cheques[1].body.index).toBe(18);
    });

    it("unlockeds should return only Unlocked cheques", () => {
      const unlockeds = receipt.unlockeds();
      expect(unlockeds.length).toBe(1);
      expect(unlockeds[0].body.index).toBe(12);
    });
  });

  describe("unlock", () => {
    it("should unlock a matching Cheque with the correct secret", () => {
      // At start, receipt has 1 unlocked (12) and 2 locked (15, 18)
      expect(receipt.unlockeds().length).toBe(1);
      expect(receipt.cheques().length).toBe(2);

      // Unlock cheque 18 (which uses secretA)
      receipt.unlock(secretA);

      expect(receipt.unlockeds().length).toBe(2);
      expect(receipt.cheques().length).toBe(1);
      expect(receipt.unlockeds()[0].body.index).toBe(12);
      expect(receipt.unlockeds()[1].body.index).toBe(18);
      expect(receipt.cheques()[0].body.index).toBe(15);
    });

    it("should not unlock a Cheque with the wrong secret", () => {
      // Cheque 15 uses lockB
      expect(receipt.unlockeds().length).toBe(1);
      receipt.unlock(secretA); // Try to unlock with secretA
      expect(receipt.unlockeds().length).toBe(2); // Only cheque 18 was unlocked
      expect(receipt.cheques().length).toBe(1); // Cheque 15 remains
    });
  });

  describe("amount vs. committed", () => {
    it("amount() should sum squash + UNLOCKED cheques", () => {
      // squash (1000) + unlocked (100)
      expect(receipt.amount()).toBe(1000 + 100);
    });

    it("committed() should sum squash + ALL mixed cheques", () => {
      // squash (1000) + unlocked (100) + locked (200) + locked (300)
      expect(receipt.committed()).toBe(1000 + 100 + 200 + 300);
    });
  });

  describe("insert", () => {
    it("should insert a new cheque in the correct sorted position", () => {
      const body16 = new ChequeBody(16, 500, 4, lockA);
      const cheque16 = new Cheque(body16, MOCK_SIG);

      receipt.insert(cheque16);

      expect(receipt.mixedCheques.length).toBe(4);
      expect(receipt.mixedCheques.map((mc) => mc.index())).toEqual([
        12, 15, 16, 18,
      ]);
    });

    it("should throw when inserting a duplicate index", () => {
      const body15 = new ChequeBody(15, 500, 4, lockA); // index 15
      const cheque15_dupe = new Cheque(body15, MOCK_SIG);

      expect(() => receipt.insert(cheque15_dupe)).toThrow("Duplicate index 15");
    });
  });

  describe("expire", () => {
    it("should remove specified locked cheques", () => {
      expect(receipt.mixedCheques.length).toBe(3);

      // Expire cheque 15
      receipt.expire([15]);

      expect(receipt.mixedCheques.length).toBe(2);
      expect(receipt.mixedCheques.map((mc) => mc.index())).toEqual([12, 18]);
    });

    it("should NOT remove unlocked cheques even if specified", () => {
      // Try to expire unlocked cheque 12
      receipt.expire([12]);
      expect(receipt.mixedCheques.length).toBe(3); // No change
    });
  });

  describe("update", () => {
    it("should update squash, remove squashed unlocked cheques, and return false (incomplete)", () => {
      // Insert additional locked cheque to verify incomplete
      receipt.mixedCheques.push(MixedCheque.fromUnlocked(unlocked20()));

      const newSquashBody = createBaseSquashBody();
      newSquashBody.squash(body12()); // Simulates squashing unlocked 12

      const newSquash = new Squash(newSquashBody, MOCK_SIG_2);

      const isComplete = receipt.update(newSquash);

      // 1. Check return value (false because locked cheques remain)
      expect(isComplete).toBe(false);

      // 2. Check that the squash was updated
      expect(receipt.squash).toBe(newSquash);

      // 3. Check that squashed unlocked cheque (12) is gone
      //    but (15, 18, 20) remain.
      expect(receipt.mixedCheques.length).toBe(3);
      expect(receipt.mixedCheques.map((mc) => mc.index())).toEqual([
        15, 18, 20,
      ]);
    });

    it("should return true if update is complete (no cheques remain)", () => {
      // Create a receipt with *only* an unlocked cheque
      const simpleReceipt = MixedReceipt.new(createBaseSquash(), [
        mixedUnlocked12(),
      ]);

      const newSquashBody = createBaseSquashBody();
      newSquashBody.squash(body12());
      const newSquash = new Squash(newSquashBody, MOCK_SIG_2);

      const isComplete = simpleReceipt.update(newSquash);

      // Returns true because the list of mixed cheques is now empty
      expect(isComplete).toBe(true);
      expect(simpleReceipt.mixedCheques.length).toBe(0);
    });

    it("should throw if update tries to squash a locked cheque", () => {
      // We will create a new squash that *wrongfully* squashes locked cheque 15
      const newSquashBody = createBaseSquashBody();
      newSquashBody.squash(body15()); // This is the error
      const newSquash = new Squash(newSquashBody, MOCK_SIG_2);

      expect(() => receipt.update(newSquash)).toThrow(
        "Squash cannot include a (locked) cheque.",
      );
    });

    it("should throw if the new squash body is not reproduced", () => {
      // We will provide a new squash that *is* valid (only squashes unlocked 12)
      // BUT its signature/body is "wrong" (e.g., amount is wrong)
      const newSquashBody = createBaseSquashBody();
      newSquashBody.squash(body12());

      // Tamper with the amount
      newSquashBody.amount = 9999;

      const newSquash = new Squash(newSquashBody, MOCK_SIG_2);

      expect(() => receipt.update(newSquash)).toThrow(
        "Squash body was not reproduced.",
      );
    });
  });

  describe("makeSquashBody", () => {
    it("should return a new body with unlocked cheques squashed", () => {
      // Receipt has squash (1000, 10, [2, 5]) and unlocked 12 (100)
      const newBody = receipt.makeSquashBody();

      // Check new body
      expect(newBody.amount).toBe(1100);
      expect(newBody.index).toBe(16);
      expect(newBody.exclude).toEqual([2, 5, 15]); // Gap at 11 filled

      // Check that original receipt is unchanged
      expect(receipt.squash.body.amount).toBe(1000);
      expect(receipt.squash.body.index).toBe(16);
    });
  });
});
