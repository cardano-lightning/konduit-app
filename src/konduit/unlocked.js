import { sha256 } from "@noble/hashes/sha2.js";

import * as cbor from "../cardano/cbor.js";
import * as hex from "../utils/hex.js";

import { ChequeBody } from "./chequeBody.js";
import { Cheque } from "./cheque.js";

/**
 * Represents an "unlocked" cheque, pairing a cheque's body and signature
 * with the secret required to unlock it.
 */
export class Unlocked {
  /**
   * @param {import('./chequeBody.js').ChequeBody} body
   * @param {Uint8Array} signature
   * @param {Uint8Array} secret
   */
  constructor(body, signature, secret) {
    this.body = body;
    this.signature = signature;
    this.secret = secret;
  }

  /**
   * Serialises the Unlocked instance into a plain object for storage.
   * @returns {object} A plain object representation.
   */
  serialise() {
    return {
      body: this.body.serialise(),
      signature: this.signature,
      secret: this.secret,
    };
  }

  /**
   * Deserialises a plain object from storage back into an Unlocked instance.
   * @param {object} data - The plain object.
   * @param {any} data.body
   * @param {Uint8Array} data.signature
   * @param {Uint8Array} data.secret
   * @returns {Unlocked} A new Unlocked instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (
      !data ||
      !data.body ||
      !(data.signature instanceof Uint8Array) ||
      !(data.secret instanceof Uint8Array)
    ) {
      throw new Error(
        "Invalid or incomplete data for Unlocked deserialisation.",
      );
    }
    try {
      const body = ChequeBody.deserialise(data.body);
      return new Unlocked(body, data.signature, data.secret);
    } catch (error) {
      throw new Error(`Unlocked deserialisation failed: ${error.message}`);
    }
  }

  /**
   * Creates a new Unlocked instance.
   * It first hashes the secret to create a lock, then creates a cheque body,
   * signs it to get a cheque, and finally pairs the body, signature, and secret.
   *
   * @param {Uint8Array} signingKey - The private key to sign with.
   * @param {Uint8Array} tag - A domain-separation tag.
   * @param {number} index - The index for the cheque body.
   * @param {number} amount - The amount for the cheque body.
   * @param {number} timeout - The timeout for the cheque body.
   * @param {Uint8Array} secret - The secret used to generate the lock.
   * @returns {Unlocked} A new Unlocked instance.
   */
  static make(signingKey, tag, index, amount, timeout, secret) {
    let lock = sha256(secret);
    let body = new ChequeBody(index, amount, timeout, lock);
    let cheque = Cheque.make(signingKey, tag, body);
    return new Unlocked(body, cheque.signature, secret);
  }

  /**
   * Returns the unlocked cheque as an Aiken-formatted string.
   * @returns {string}
   */
  asAiken() {
    return `(${this.body.asAiken()}, #"${hex.encode(this.signature)}", #"${hex.encode(this.secret)}", )`;
  }

  /**
   * Encodes the unlocked cheque to CBOR.
   * @returns {Uint8Array} The CBOR-encoded unlocked cheque.
   */
  toCbor() {
    return cbor.encodeAsIndefiniteRaw([
      this.body.toCbor(),
      cbor.encode(this.signature),
      cbor.encode(this.secret),
    ]);
  }
  /**
   * Decodes an Unlocked from CBOR bytes.
   * @param {Uint8Array} cborBytes - The CBOR-encoded unlocked cheque.
   * @returns {Unlocked} A new Unlocked instance.
   * @throws {Error} If CBOR is invalid or doesn't represent an Unlocked.
   */
  static fromCbor(cborBytes) {
    try {
      const decoded = cbor.decode(cborBytes);

      if (
        !Array.isArray(decoded) ||
        decoded.length !== 3 ||
        !Array.isArray(decoded[0]) || // The decoded body should be an array
        !decoded[1] || // Check for signature (will catch null/undefined)
        !decoded[2] // Check for secret (will catch null/undefined)
      ) {
        throw new Error(
          "Invalid CBOR structure for Unlocked. Expected [body, signature, secret].",
        );
      }

      // Re-encode the decoded body array to get its CBOR bytes.
      const bodyCborBytes = cbor.encodeAsIndefinite(decoded[0]);
      const body = ChequeBody.fromCbor(bodyCborBytes);

      // Coerce signature and secret to Uint8Array
      const signature = new Uint8Array(decoded[1]);
      const secret = new Uint8Array(decoded[2]);

      return new Unlocked(body, signature, secret);
    } catch (error) {
      throw new Error(`Unlocked fromCbor failed: ${error.message}`);
    }
  }
}
