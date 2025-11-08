import { sha256 } from "@noble/hashes/sha2.js";

import { verify } from "../cardano/keys.js";
import * as uint8Array from "../utils/uint8Array.js";

import { Cheque } from "./cheque.js";
import { Unlocked } from "./unlocked.js";

/**
 * Represents a cheque that is either locked (Cheque) or unlocked (Unlocked).
 * Corresponds to the MixedCheque enum in Rust.
 */
export class MixedCheque {
  /**
   * @param {"Cheque" | "Unlocked"} variant
   * @param {Cheque | Unlocked} value
   */
  constructor(variant, value) {
    this.variant = variant;
    this.value = value;
  }

  /** @param {Unlocked} unlocked */
  static fromUnlocked(unlocked) {
    return new MixedCheque("Unlocked", unlocked);
  }

  /** @param {Cheque} cheque */
  static fromCheque(cheque) {
    return new MixedCheque("Cheque", cheque);
  }

  /** @returns {boolean} */
  isCheque() {
    return this.variant === "Cheque";
  }

  /** @returns {number} */
  index() {
    return this.value.body.index;
  }

  /** @returns {number} */
  amount() {
    return this.value.body.amount;
  }

  /** @returns {Unlocked | null} */
  asUnlocked() {
    return this.variant === "Unlocked" ? this.value : null;
  }

  /** @returns {Cheque | null} */
  asCheque() {
    return this.variant === "Cheque" ? this.value : null;
  }

  /**
   * Verifies the integrity of the inner cheque or unlocked value.
   * @param {Uint8Array} verificationKey
   * @param {Uint8Array} tag
   * @returns {boolean}
   */
  verify(verificationKey, tag) {
    if (this.isCheque()) {
      // this.value is a Cheque
      return this.value.verify(verificationKey, tag);
    } else {
      // this.value is an Unlocked
      // We must emulate the Rust `verify_no_time`
      const unlocked = this.value;

      // 1. Verify the signature
      const isValidSig = verify(
        verificationKey,
        unlocked.body.taggedBytes(tag),
        unlocked.signature,
      );
      if (!isValidSig) {
        return false;
      }

      // 2. Verify the secret matches the lock
      const lock = sha256(unlocked.secret);
      return uint8Array.equals(lock, unlocked.body.lock);
    }
  }

  /**
   * Comparator function for sorting.
   * Sorts by index, then by type (Cheque < Unlocked).
   * @param {MixedCheque} a
   * @param {MixedCheque} b
   */
  static compare(a, b) {
    const indexA = a.index();
    const indexB = b.index();

    if (indexA !== indexB) {
      return indexA - indexB;
    }

    // Indexes are equal, sort by type
    // Cheque (false) comes before Unlocked (true)
    const aIsUnlocked = !a.isCheque();
    const bIsUnlocked = !b.isCheque();

    if (aIsUnlocked === bIsUnlocked) {
      return 0;
    }
    return aIsUnlocked ? 1 : -1; // Based on Rust Ord: Unlocked > Cheque
  }
}
