import { sha256 } from "@noble/hashes/sha2.js";

import { verify } from "../cardano/keys.js";
import * as uint8Array from "../utils/uint8Array.js";
import * as cbor from "../cardano/cbor.js";

import { Cheque } from "./cheque.js";
import { Unlocked } from "./unlocked.js";
import { ChequeBody } from "./chequeBody.js";

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

  serialise() {
    return {
      variant: this.variant,
      value: this.value.serialise(),
    };
  }

  /**
   * Deserialises a plain object from storage back into a MixedCheque instance.
   * @param {object} data - The plain object.
   * @param {"Cheque" | "Unlocked"} data.variant
   * @param {any} data.value
   * @returns {MixedCheque} A new MixedCheque instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (!data || !data.variant || !data.value) {
      throw new Error(
        "Invalid or incomplete data for MixedCheque deserialisation.",
      );
    }

    try {
      if (data.variant === "Cheque") {
        return MixedCheque.fromCheque(Cheque.deserialise(data.value));
      } else if (data.variant === "Unlocked") {
        return MixedCheque.fromUnlocked(Unlocked.deserialise(data.value));
      } else {
        throw new Error(`Unknown MixedCheque variant: ${data.variant}`);
      }
    } catch (error) {
      throw new Error(`MixedCheque deserialisation failed: ${error.message}`);
    }
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
    // @ts-expect-error TS2322
    return this.variant === "Unlocked" ? this.value : null;
  }

  /** @returns {Cheque | null} */
  asCheque() {
    // @ts-expect-error TS2322
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
      // @ts-expect-error TS2322
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
      // @ts-expect-error TS2322
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
  /**
   * Encodes the MixedCheque to CBOR as a tagged enum.
   * Calls the .toCbor() method of the inner Cheque or Unlocked value
   * and tags the resulting bytes.
   * Tag 122 = Cheque
   * Tag 121 = Unlocked
   * @returns {Uint8Array} The CBOR-encoded MixedCheque.
   */
  toCbor() {
    if (this.isCheque()) {
      return cbor.encodeTaggedRaw(122, this.value.toCbor()); // Tag 122 for Cheque
    } else {
      return cbor.encodeTaggedRaw(121, this.value.toCbor()); // Tag 121 for Unlocked
    }
  }

  /**
   * Decodes a MixedCheque from CBOR bytes.
   * @param {Uint8Array} cborBytes - The CBOR-encoded MixedCheque.
   * @returns {MixedCheque} A new MixedCheque instance.
   * @throws {Error} If CBOR is invalid or doesn't represent a MixedCheque.
   */
  static fromCbor(cborBytes) {
    try {
      const decoded = cbor.decode(cborBytes);
      // if (
      //   !decoded || instanceof(decoded) == "Tag"
      // ) {
      //   throw new Error(
      //     "Invalid CBOR structure for MixedCheque. Expected a Tag(bytes).",
      //   );
      // }
      return MixedCheque.fromCborDecoded(decoded.tag, decoded.value);
    } catch (error) {
      throw new Error(`MixedCheque fromCbor failed: ${error.message}`);
    }
  }

  /**
   * @param {number} tag
   * @param {any[]} value
   */
  static fromCborDecoded(tag, value) {
    try {
      const v0 = value[0];
      const chequeBody = new ChequeBody(
        v0[0],
        v0[1],
        v0[2],
        new Uint8Array(v0[3]),
      );
      const signature = new Uint8Array(value[1]);
      if (tag === 121) {
        return MixedCheque.fromUnlocked(
          new Unlocked(chequeBody, signature, new Uint8Array(value[2])),
        );
      } else if (tag === 122) {
        return MixedCheque.fromCheque(new Cheque(chequeBody, signature));
      } else {
        throw new Error(`Unknown MixedCheque CBOR tag: ${tag}`);
      }
    } catch (error) {
      throw new Error(`MixedCheque fromCbor failed: ${error.message}`);
    }
  }
}
