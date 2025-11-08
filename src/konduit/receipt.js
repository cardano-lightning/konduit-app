import { Squash } from "./squash.js";
import { Unlocked } from "./unlocked.js";
import { MAX_UNSQUASHED } from "./constants.js";

/**
 * Represents a final, redeemable receipt, containing a signed squash
 * and a list of verified unlocked cheques.
 * Corresponds to receipt.rs
 */
export class Receipt {
  /**
   * Internal constructor. Use Receipt.new() for verification.
   * @param {Squash} squash
   * @param {Unlocked[]} unlockeds (Assumed to be sorted by index)
   */
  constructor(squash, unlockeds) {
    this.squash = squash;
    this.unlockeds = unlockeds;
  }

  /**
   * Creates a new, verified Receipt.
   * This ensures all unlocked cheques are valid against the squash.
   * Based on logic from receipt.rs
   * @param {Squash} squash
   * @param {Unlocked[]} unlockeds
   * @returns {Receipt}
   */
  static new(squash, unlockeds) {
    if (unlockeds.length > MAX_UNSQUASHED) {
      throw new Error("Too many unlocked cheques");
    }

    const sorted = [];
    const seenIndices = new Set();

    for (const unlocked of unlockeds) {
      const index = unlocked.body.index;

      // Check if the squash already covers this index
      if (squash.body.isIndexSquashed(index)) {
        throw new Error(`Index ${index} is already squashed`);
      }

      // Check for duplicate indices
      if (seenIndices.has(index)) {
        throw new Error(`Duplicate index ${index}`);
      }
      seenIndices.add(index);
      sorted.push(unlocked);
    }

    // Sort the unlocked cheques by their index
    sorted.sort((a, b) => a.body.index - b.body.index);

    return new Receipt(squash, sorted);
  }

  /**
   * Calculates the total redeemable amount.
   * This is the sum of the squashed amount and all unlocked cheques.
   * @returns {number}
   */
  amount() {
    const unlockedAmount = this.unlockeds.reduce(
      (sum, u) => sum + u.body.amount,
      0,
    );
    return this.squash.body.amount + unlockedAmount;
  }
}
