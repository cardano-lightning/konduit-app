import { describe, it, expect } from "vitest";
import { TestSquash } from "./testSquash.js";
import { Squash } from "./squash.js";
import { SigningKeytag } from "./signingKeytag.js";

describe("TestSquash", () => {
  describe("make", () => {
    it("should create a TestSquash instance with correct properties", () => {
      const signingKey = new Uint8Array(32).fill(1);
      const tag = new TextEncoder().encode("test-squash-tag");
      const index = 5;
      const amount = 100;
      const exclude = [1, 3];

      const testSquash = TestSquash.make(
        signingKey,
        tag,
        index,
        amount,
        exclude,
      );

      expect(testSquash).toBeInstanceOf(TestSquash);
      expect(testSquash.signingKeytag).toBeInstanceOf(SigningKeytag);
      expect(testSquash.squash).toBeInstanceOf(Squash);
      expect(testSquash.squash.body.index).toBe(5);
      expect(testSquash.squash.body.amount).toBe(100);
      expect(testSquash.squash.body.exclude).toEqual([1, 3]);
    });
  });

  describe("fromSeed", () => {
    it("should generate a deterministic squash from a seed", () => {
      const seed1 = new Uint8Array([1, 2, 3, 4, 5]);

      const ts1 = TestSquash.fromSeed(seed1);
      const ts2 = TestSquash.fromSeed(seed1);

      // Verify that both instances are fully identical
      expect(ts1).toBeInstanceOf(TestSquash);
      expect(ts2).toBeInstanceOf(TestSquash);

      // Check that all derived properties are the same
      expect(ts1.signingKeytag.signingKey).toEqual(
        ts2.signingKeytag.signingKey,
      );
      expect(ts1.signingKeytag.tag).toEqual(ts2.signingKeytag.tag);
      expect(ts1.squash.body).toEqual(ts2.squash.body); // Checks index, amount, exclude
      expect(ts1.squash.signature).toEqual(ts2.squash.signature);

      // Check aiken strings as a final confirmation
      expect(ts1.asAiken()).toEqual(ts2.asAiken());
    });

    it("should generate different squashes from different seeds", () => {
      const seed1 = new Uint8Array([1, 2, 3, 4, 5]);
      const seed2 = new Uint8Array([6, 7, 8, 9, 10]);

      const ts1 = TestSquash.fromSeed(seed1);
      const ts2 = TestSquash.fromSeed(seed2);

      // Verify that the instances are different
      // Note: hash collisions are possible but extremely unlikely
      expect(ts1.signingKeytag.signingKey).not.toEqual(
        ts2.signingKeytag.signingKey,
      );
      expect(ts1.squash.body.index).not.toEqual(ts2.squash.body.index);
      expect(ts1.squash.signature).not.toEqual(ts2.squash.signature);
      expect(ts1.asAiken()).not.toEqual(ts2.asAiken());
    });
  });
});
