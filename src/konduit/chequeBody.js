import * as cbor from "../cardano/cbor.js";
import * as hex from "../utils/hex.js";
import { concat } from "../utils/uint8Array.js";

/**
 * Represents the body of a cheque, containing its core data.
 * @property {number} index - The index or sequence number of the cheque.
 * @property {number} amount - The value or amount associated with the cheque.
 * @property {number} timeout - A timestamp or slot number indicating when the cheque expires.
 * @property {Uint8Array} lock - A byte array representing the lock (e.g., a public key hash).
 */
export class ChequeBody {
  /**
   * Constructs a new ChequeBody.
   * @param {number} index - The index or sequence number.
   * @param {number} amount - The value or amount.
   * @param {number} timeout - The expiration timestamp or slot.
   * @param {Uint8Array} lock - The lock (e.g., public key hash).
   */
  constructor(index, amount, timeout, lock) {
    this.index = index;
    this.amount = amount;
    this.timeout = timeout;
    this.lock = lock;
  }
  /**
   * Serialises the ChequeBody instance into a plain object for storage.
   * @returns {object} A plain object representation.
   */
  serialise() {
    return {
      index: this.index,
      amount: this.amount,
      timeout: this.timeout,
      lock: hex.encode(this.lock),
    };
  }

  /**
   * Deserialises a plain object from storage back into a ChequeBody instance.
   * @param {object} data - The plain object.
   * @param {number} data.index
   * @param {number} data.amount
   * @param {number} data.timeout
   * @param {string} data.lock
   * @returns {ChequeBody} A new ChequeBody instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (
      !data ||
      typeof data.index !== "number" ||
      typeof data.amount !== "number" ||
      typeof data.timeout !== "number" ||
      typeof data.lock !== "string"
    ) {
      throw new Error(
        "Invalid or incomplete data for ChequeBody deserialisation.",
      );
    }
    return new ChequeBody(
      data.index,
      data.amount,
      data.timeout,
      hex.decode(data.lock),
    );
  }

  /**
   * Returns the cheque body's properties as an array.
   * @returns {[number, number, number, Uint8Array]} An array containing index, amount, timeout, and lock.
   */
  asArray() {
    return [this.index, this.amount, this.timeout, this.lock];
  }

  /**
   * Returns the cheque body as an Aiken-formatted string.
   * @returns {string} The Aiken string representation.
   */
  asAiken() {
    return `(${this.index}, ${this.amount}, ${this.timeout}, #"${hex.encode(this.lock)}")`;
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
   * Encodes the cheque body to CBOR as an indefinite-length array.
   * @returns {Uint8Array} The CBOR-encoded cheque body.
   */
  toCbor() {
    return cbor.encodeAsIndefinite(this.asArray());
  }
  /**
   * Decodes a ChequeBody from CBOR bytes.
   * @param {Uint8Array} cborBytes - The CBOR-encoded cheque body.
   * @returns {ChequeBody} A new ChequeBody instance.
   * @throws {Error} If CBOR is invalid or doesn't represent a ChequeBody.
   */
  static fromCbor(cborBytes) {
    try {
      const decoded = cbor.decode(cborBytes);

      if (
        !Array.isArray(decoded) ||
        decoded.length !== 4 ||
        typeof decoded[0] !== "number" ||
        typeof decoded[1] !== "number" ||
        typeof decoded[2] !== "number" ||
        !(decoded[3] instanceof Uint8Array)
      ) {
        throw new Error("Invalid CBOR structure for ChequeBody.");
      }

      return new ChequeBody(
        decoded[0],
        decoded[1],
        decoded[2],
        new Uint8Array(decoded[3]),
      );
    } catch (error) {
      throw new Error(`ChequeBody fromCbor failed: ${error.message}`);
    }
  }
}
