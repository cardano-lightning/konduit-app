import * as hex from "../utils/hex.js";
import * as cbor from "../cardano/cbor.js";
import { sign, verify } from "../cardano/keys.js";

/**
 * @typedef {object} Cheque
 * @property {import('./chequeBody.js').ChequeBody} body
 * @property {Uint8Array} signature
 */

export class Cheque {
  /**
   * @param {import('./chequeBody.js').ChequeBody} body
   * @param {Uint8Array} signature
   */
  constructor(body, signature) {
    this.body = body;
    this.signature = signature;
  }

  /**
   * Creates a new Cheque by signing the tagged body.
   * @param {Uint8Array} signingKey - The private key to sign with.
   * @param {Uint8Array} tag - A domain-separation tag.
   * @param {import('./chequeBody.js').ChequeBody} body - The body of the cheque.
   * @returns {Cheque} A new Cheque instance.
   */
  static make(signingKey, tag, body) {
    return new Cheque(body, sign(signingKey, body.taggedBytes(tag)));
  }

  /**
   * Verifies the cheque's signature against the tagged body.
   * @param {Uint8Array} verificationKey - The public key to verify with.
   * @param {Uint8Array} tag - The domain-separation tag.
   * @returns {boolean} True if the signature is valid, false otherwise.
   */
  verify(verificationKey, tag) {
    return verify(verificationKey, this.body.taggedBytes(tag), this.signature);
  }

  /**
   * Returns the cheque as an Aiken-formatted string.
   * @returns {string}
   */
  asAiken() {
    return `(${this.body.asAiken()}, #"${hex.encode(this.signature)}")`;
  }

  /**
   * Encodes the cheque to CBOR.
   * @returns {Uint8Array} The CBOR-encoded cheque.
   */
  toCbor() {
    // Assumes cbor.encodeAsIndefiniteRaw is a custom function in your cbor module
    // that takes an array of Uint8Arrays.
    return cbor.encodeAsIndefiniteRaw([
      this.body.toCbor(),
      cbor.encode(this.signature),
    ]);
  }
}
