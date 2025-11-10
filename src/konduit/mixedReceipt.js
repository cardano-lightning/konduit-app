import { sha256 } from "@noble/hashes/sha2.js";

import * as uint8Array from "../utils/uint8Array.js";

import { Squash } from "./squash.js";
import { MixedCheque } from "./mixedCheque.js";
import { Unlocked } from "./unlocked.js";
import { MAX_UNSQUASHED } from "./constants.js";
import { Receipt } from "./receipt.js";

export class MixedReceipt {
  /**
   * Internal constructor. Use MixedReceipt.new() for verification.
   * @param {Squash} squash
   * @param {MixedCheque[]} mixedCheques (Assumed to be sorted)
   */
  constructor(squash, mixedCheques) {
    this.squash = squash;
    this.mixedCheques = mixedCheques;
  }

  /**
   * Creates a new, verified MixedReceipt.
   * Based on logic from mixed_receipt.rs [cite: mixed_receipt.rs]
   * @param {Squash} squash
   * @param {MixedCheque[]} mixedCheques
   * @returns {MixedReceipt}
   */
  static new(squash, mixedCheques) {
    if (mixedCheques.length > MAX_UNSQUASHED) {
      throw new Error("Too many unsquashed cheques");
    }

    const sorted = [];
    const seenIndices = new Set();

    for (const mixedCheque of mixedCheques) {
      const index = mixedCheque.index();
      if (squash.body.isIndexSquashed(index)) {
        throw new Error(`Index ${index} is already squashed`);
      }
      if (seenIndices.has(index)) {
        throw new Error(`Duplicate index ${index}`);
      }
      seenIndices.add(index);
      sorted.push(mixedCheque);
    }

    // Sort by index, then type
    sorted.sort(MixedCheque.compare);

    return new MixedReceipt(squash, sorted);
  }
  /**
   * Serialises the MixedReceipt instance into a plain object for storage.
   * @returns {object} A plain object representation.
   */
  serialise() {
    return {
      squash: this.squash.serialise(),
      mixedCheques: this.mixedCheques.map((mc) => mc.serialise()),
    };
  }

  /**
   * Deserialises a plain object from storage back into a MixedReceipt instance.
   * Assumes 'Squash' class also has a static .deserialise() method.
   * @param {object} data - The plain object.
   * @param {any} data.squash
   * @param {Array<any>} data.mixedCheques
   * @returns {MixedReceipt} A new MixedReceipt instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (!data || !data.squash || !Array.isArray(data.mixedCheques)) {
      throw new Error(
        "Invalid or incomplete data for MixedReceipt deserialisation.",
      );
    }

    try {
      // We must assume Squash.deserialise exists, as we don't have the file.
      const squash = Squash.deserialise(data.squash);
      const mixedCheques = data.mixedCheques.map((mcData) =>
        MixedCheque.deserialise(mcData),
      );

      // Note: This bypasses the 'MixedReceipt.new()' verification logic
      // to restore the exact saved state.
      return new MixedReceipt(squash, mixedCheques);
    } catch (error) {
      throw new Error(`MixedReceipt deserialisation failed: ${error.message}`);
    }
  }

  /** @returns {number} */
  maxIndex() {
    const squashIndex = this.squash.body.index;
    const lastCheque = this.mixedCheques[this.mixedCheques.length - 1];
    return Math.max(squashIndex, lastCheque ? lastCheque.index() : 0);
  }

  /** @returns {number} */
  capacity() {
    return MAX_UNSQUASHED - this.mixedCheques.length;
  }

  /** @returns {import('./cheque.js').Cheque[]} */
  cheques() {
    return (
      this.mixedCheques
        .filter((mc) => mc.isCheque())
        .map((mc) => mc.asCheque()) || []
    );
  }

  /** @returns {import('./unlocked.js').Unlocked[]} */
  unlockeds() {
    return this.mixedCheques
      .filter((mc) => !mc.isCheque())
      .map((mc) => mc.asUnlocked());
  }

  /**
   * Finds matching locked cheques and turns them into Unlocked.
   * @param {Uint8Array} secret
   */
  unlock(secret) {
    const lock = sha256(secret);
    this.mixedCheques = this.mixedCheques.map((mc) => {
      if (mc.isCheque() && uint8Array.equals(mc.value.body.lock, lock)) {
        const cheque = mc.asCheque();
        const unlocked = new Unlocked(cheque.body, cheque.signature, secret);
        return MixedCheque.fromUnlocked(unlocked);
      }
      return mc;
    });
  }

  /**
   * Derives receipt
   * @returns {import('./receipt.js').Receipt}
   */
  receipt() {
    return new Receipt(this.squash, this.unlockeds());
  }

  /**
   * Total amount of squashed + unlocked cheques.
   * @returns {number}
   */
  amount() {
    const unlockedAmount = this.unlockeds().reduce(
      (sum, u) => sum + u.body.amount,
      0,
    );
    return this.squash.body.amount + unlockedAmount;
  }

  /**
   * Total amount of squashed + all mixed cheques.
   * @returns {number}
   */
  committed() {
    const mixedAmount = this.mixedCheques.reduce(
      (sum, mc) => sum + mc.amount(),
      0,
    );
    return this.squash.body.amount + mixedAmount;
  }

  /**
   * Inserts a new (locked) cheque into the sorted list.
   * @param {import('./cheque.js').Cheque} cheque
   */
  insert(cheque) {
    const index = cheque.body.index;
    if (this.mixedCheques.length >= MAX_UNSQUASHED) {
      throw new Error("Receipt is full");
    }

    // Find insertion position
    const pos = this.mixedCheques.findIndex((mc) => mc.index() >= index);

    if (pos !== -1 && this.mixedCheques[pos].index() === index) {
      throw new Error(`Duplicate index ${index}`);
    }

    const mixedCheque = MixedCheque.fromCheque(cheque);
    if (pos === -1) {
      // Add to end
      this.mixedCheques.push(mixedCheque);
    } else {
      // Insert at position
      this.mixedCheques.splice(pos, 0, mixedCheque);
    }
  }

  /**
   * Removes expired (locked) cheques from the list.
   * @param {number[]} indexes - List of cheque indices to expire.
   */
  expire(indexes) {
    const indexSet = new Set(indexes);
    this.mixedCheques = this.mixedCheques.filter((mc) => {
      if (mc.isCheque() && indexSet.has(mc.index())) {
        return false; // Remove (expire) this cheque
      }
      return true; // Keep this cheque
    });
  }

  /**
   * Updates the receipt with a new squash.
   * This is the complex logic from mixed_receipt.rs [cite: mixed_receipt.rs]
   * @param {Squash} newSquash
   * @returns {boolean} - True if update is complete (no unlockeds left).
   */
  update(newSquash) {
    const currentBody = this.squash.body.clone();
    const proposedBody = newSquash.body;

    for (const mixedCheque of this.mixedCheques) {
      const index = mixedCheque.index();

      // Only check cheques that are covered by the new squash
      if (proposedBody.isIndexSquashed(index)) {
        if (mixedCheque.isCheque()) {
          // A locked cheque is being squashed. This is an error.
          throw new Error("Squash cannot include a (locked) cheque.");
        } else {
          // An unlocked cheque is being squashed. Add it to our simulation.
          currentBody.squash(mixedCheque.asUnlocked().body);
        }
      }
    }

    // Verify the simulated body matches the proposed one
    if (!currentBody.equals(proposedBody)) {
      throw new Error(
        "Squash body was not reproduced. Proposed squash is invalid.",
      );
    }

    // Update is valid. Commit the changes.
    this.squash = newSquash;

    // Retain only cheques that are *not* covered by the new squash
    this.mixedCheques = this.mixedCheques.filter(
      (mc) => !this.squash.body.isIndexSquashed(mc.index()),
    );

    // Return true if update is "complete" (no unlockeds left)
    return this.unlockeds().length === 0;
  }

  /**
   * Simulates squashing all unlocked cheques.
   * @returns {import('./squashBody.js').SquashBody}
   */
  makeSquashBody() {
    const squashBody = this.squash.body.clone();
    for (const mixedCheque of this.mixedCheques) {
      if (!mixedCheque.isCheque()) {
        // It's unlocked, add it to the simulation
        squashBody.squash(mixedCheque.asUnlocked().body);
      }
    }
    return squashBody;
  }
}
