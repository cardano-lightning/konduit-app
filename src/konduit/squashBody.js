import * as cbor from "../cardano/cbor.js";
import { concat } from "../utils/uint8Array.js";

/**
 * Represents the body of a squash operation.
 * @property {number} amount - The total amount being squashed.
 * @property {number} index - The index of the squash operation.
 * @property {number[]} exclude - An array of indices to exclude from the squash.
 */
export class SquashBody {
  /**
   * Constructs a new SquashBody.
   * @param {number} amount - The total amount.
   * @param {number} index - The operation index.
   * @param {number[]} exclude - An array of indices to exclude. Assumed to be an iterable.
   */
  constructor(amount, index, exclude) {
    this.amount = amount;
    this.index = index;
    this.exclude = exclude;
  }

  /**
   * Serialises the SquashBody instance into a plain object for storage.
   * @returns {object} A plain object representation.
   */
  serialise() {
    return {
      amount: this.amount,
      index: this.index,
      exclude: [...this.exclude],
    };
  }

  /**
   * Deserialises a plain object from storage back into a SquashBody instance.
   * @param {object} data - The plain object.
   * @param {number} data.index
   * @param {number} data.amount
   * @param {number[]} data.exclude
   * @returns {SquashBody} A new SquashBody instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (
      !data ||
      typeof data.amount !== "number" ||
      typeof data.index !== "number" ||
      !Array.isArray(data.exclude)
    ) {
      throw new Error(
        "Invalid or incomplete data for SquashBody deserialisation.",
      );
    }
    return new SquashBody(data.amount, data.index, data.exclude);
  }

  /**
   * Make a squash body with everything 0.
   * Used to initiate a channel
   * @returns {SquashBody} A new SquashBody instance.
   */
  static zero() {
    return new SquashBody(0, 0, []);
  }
  /**
   * Verifies the integrity and rules of the squash body.
   * Rules:
   * 1. index must be >= 0.
   * 2. exclude must be strictly monotonically increasing (e.g., [1, 3, 5]).
   * 3. All values in exclude must be >= 0.
   * 4. All values in exclude must be < index.
   * @returns {boolean} True if all rules pass, false otherwise.
   */
  verify() {
    if (this.index < 0) {
      return false;
    }
    let lastExcludeVal = -1;
    for (const val of this.exclude) {
      if (val <= lastExcludeVal) {
        return false;
      }
      if (val >= this.index) {
        return false;
      }
      lastExcludeVal = val;
    }

    return true;
  }

  /**
   * Returns the squash body's properties as an array.
   * Note: This returns an iterator for the 'exclude' property.
   * @returns {[number, number, Iterator<number>]} An array containing amount, index, and an iterator for the excluded indices.
   */
  asArray() {
    return [this.amount, this.index, this.exclude[Symbol.iterator]()];
  }

  /**
   * Returns the squash body as an Aiken-formatted string.
   * @returns {string} The Aiken string representation.
   */
  asAiken() {
    // Note: This will likely output [object Object] or similar for the exclude array.
    // You might want to format `this.exclude` more explicitly, e.g., as a hex-encoded list.
    return `(${this.amount}, ${this.index}, [${this.exclude}])`;
  }

  /**
   * Prepends a domain-separation tag to the CBOR-encoded body.
   * This is typically used for creating the message to be signed.
   * @param {Uint8Array} tag - The domain-separation tag.
   * @returns {Uint8Array} The concatenated tag and CBOR-encoded body.
   */
  taggedBytes(tag) {
    return concat([tag, this.toCbor()]);
  }

  /**
   * Encodes the squash body to CBOR as an indefinite-length array.
   * @returns {Uint8Array} The CBOR-encoded squash body.
   */
  toCbor() {
    return cbor.encodeAsIndefinite(this.asArray());
  }
  /**
   * Decodes a SquashBody from CBOR bytes.
   * @param {Uint8Array} cborBytes - The CBOR-encoded squash body.
   * @returns {SquashBody} A new SquashBody instance.
   * @throws {Error} If CBOR is invalid or doesn't represent a SquashBody.
   */
  static fromCbor(cborBytes) {
    try {
      // cbor-x decoder will return a regular array for the indefinite-length array
      const decoded = cbor.decode(cborBytes);

      if (
        !Array.isArray(decoded) ||
        decoded.length !== 3 ||
        typeof decoded[0] !== "number" || // amount
        typeof decoded[1] !== "number" || // index
        !Array.isArray(decoded[2]) // exclude
      ) {
        throw new Error(
          "Invalid CBOR structure for SquashBody. Expected [amount, index, exclude].",
        );
      }

      // The 'exclude' array is already decoded as a JS array
      return new SquashBody(decoded[0], decoded[1], decoded[2]);
    } catch (error) {
      throw new Error(`SquashBody fromCbor failed: ${error.message}`);
    }
  }

  /**
   * Creates a deep copy of the squash body.
   * @returns {SquashBody}
   */
  clone() {
    return new SquashBody(this.amount, this.index, [...this.exclude]);
  }

  /**
   * Squash body is equal
   * @param {SquashBody} other
   * @returns {boolean}
   */
  equals(other) {
    if (this.amount !== other.amount || this.index !== other.index) {
      return false;
    }
    if (this.exclude.length !== other.exclude.length) {
      return false;
    }
    // Assumes excludes are sorted, which they should other.
    return this.exclude.every((val, i) => val === other.exclude[i]);
  }

  /**
   * Checks if a given index is considered squashed.
   * Based on logic from squash_body.rs [cite: squash_body.rs]
   * @param {number} index
   * @returns {boolean}
   */
  isIndexSquashed(index) {
    if (index > this.index) {
      return false;
    }
    return !this.exclude.includes(index);
  }

  /**
   * Adds a cheque body to the squash.
   * This is a port of the logic from squash_body.rs [cite: squash_body.rs]
   * Assumes chequeBody has been verified and is not already squashed.
   * @param {import('./chequeBody.js').ChequeBody} chequeBody
   */
  squash(chequeBody) {
    const chequeIndex = chequeBody.index;

    // Check if chequeIndex was in the exclude list (a "gap")
    const excludePos = this.exclude.indexOf(chequeIndex);
    if (excludePos !== -1) {
      // It was in the list. Remove it and add the amount.
      this.exclude.splice(excludePos, 1);
      this.amount += chequeBody.amount;
      return;
    }

    // It wasn't in the exclude list.
    // It must be a new high index.
    if (this.index < chequeIndex) {
      // Fill the gap between old index and new index
      for (let i = this.index + 1; i < chequeIndex; i++) {
        this.exclude.push(i);
      }
      this.amount += chequeBody.amount;
      this.index = chequeIndex;
      return;
    }

    // If it's not in exclude and not a new high index, it's a duplicate.
    if (chequeIndex <= this.index && !this.exclude.includes(chequeIndex)) {
      throw new Error(
        `DuplicateIndex: Index ${chequeIndex} is already squashed.`,
      );
    }
  }
}
