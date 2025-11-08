import { describe, it, expect } from "vitest";
import { TestCheque } from "./testCheque.js";
import { Cheque } from "./cheque.js";
import { SigningKeytag } from "./signingKeytag.js";

describe("TestCheque", () => {
  describe("make", () => {
    it("should create a TestCheque instance with correct properties", () => {
      const signingKey = new Uint8Array(32).fill(1);
      const tag = new TextEncoder().encode("test-tag");
      const lock = new Uint8Array(32).fill(2);

      const testCheque = TestCheque.make(signingKey, tag, 1, 100, 0, lock);

      expect(testCheque).toBeInstanceOf(TestCheque);
      expect(testCheque.signingKeytag).toBeInstanceOf(SigningKeytag);
      expect(testCheque.cheque).toBeInstanceOf(Cheque);
      expect(testCheque.cheque.body.index).toBe(1);
      expect(testCheque.cheque.body.amount).toBe(100);
      expect(testCheque.cheque.body.lock).toEqual(lock);
    });
  });

  describe("fromSeed", () => {
    it("should generate a deterministic cheque from a seed", () => {
      const seed1 = new Uint8Array([1, 2, 3, 4, 5]);

      const tc1 = TestCheque.fromSeed(seed1);
      const tc2 = TestCheque.fromSeed(seed1);

      // Verify that both instances are fully identical
      expect(tc1).toBeInstanceOf(TestCheque);
      expect(tc2).toBeInstanceOf(TestCheque);

      // Check that all derived properties are the same
      expect(tc1.signingKeytag.signingKey).toEqual(
        tc2.signingKeytag.signingKey,
      );
      expect(tc1.signingKeytag.tag).toEqual(tc2.signingKeytag.tag);
      expect(tc1.cheque.body).toEqual(tc2.cheque.body);
      expect(tc1.cheque.signature).toEqual(tc2.cheque.signature);

      // Check aiken strings as a final confirmation
      expect(tc1.asAiken()).toEqual(tc2.asAiken());
    });

    it("should generate different cheques from different seeds", () => {
      const seed1 = new Uint8Array([1, 2, 3, 4, 5]);
      const seed2 = new Uint8Array([6, 7, 8, 9, 10]);

      const tc1 = TestCheque.fromSeed(seed1);
      const tc2 = TestCheque.fromSeed(seed2);

      // Verify that the instances are different
      expect(tc1.signingKeytag.signingKey).not.toEqual(
        tc2.signingKeytag.signingKey,
      );
      expect(tc1.cheque.body.index).not.toEqual(tc2.cheque.body.index);
      expect(tc1.cheque.signature).not.toEqual(tc2.cheque.signature);
      expect(tc1.asAiken()).not.toEqual(tc2.asAiken());
    });
  });
});
