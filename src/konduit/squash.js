import * as hex from "../utils/hex.js";
import * as cbor from "../cardano/cbor.js";
import { sign, verify } from "../cardano/keys.js";

/**
 * Represents a signed "squash" operation.
 * @property {import('./squashBody.js').SquashBody} body - The body of the squash operation.
 * @property {Uint8Array} signature - The signature of the tagged squash body.
 */

export class Squash {
  /**
   * Constructs a new Squash instance.
   * @param {import('./squashBody.js').SquashBody} body - The squash body.
   * @param {Uint8Array} signature - The signature.
   */
  constructor(body, signature) {
    this.body = body;
    this.signature = signature;
  }

  /**
   * Creates a new Squash instance by signing the tagged body.
   * @param {Uint8Array} signingKey - The private key to sign with.
   * @param {Uint8Array} tag - A domain-separation tag.
   * @param {import('./squashBody.js').SquashBody} body - The body of the squash operation.
   * @returns {Squash} A new Squash instance.
   */
  static make(signingKey, tag, body) {
    return new Squash(body, sign(signingKey, body.taggedBytes(tag)));
  }

  /**
   * Verifies the squash's signature against the tagged body.
   * @param {Uint8Array} verificationKey - The public key to verify with.
   * @param {Uint8Array} tag - The domain-separation tag.
   * @returns {boolean} True if the signature is valid, false otherwise.
   */
  verify(verificationKey, tag) {
    return (
      this.body.verify() &&
      verify(verificationKey, this.body.taggedBytes(tag), this.signature)
    );
  }

  /**
   * Returns the squash as an Aiken-formatted string.
   * @returns {string} The Aiken string representation.
   */
  asAiken() {
    return `(${this.body.asAiken()}, #"${hex.encode(this.signature)}")`;
  }

  /**
   * Encodes the squash to CBOR.
   * @returns {Uint8Array} The CBOR-encoded squash.
   */
  toCbor() {
    // Corrected: was `signature`, changed to `this.signature`
    // Assumes cbor.encodeAsIndefiniteRaw is a custom function in your cbor module.
    return cbor.encodeAsIndefiniteRaw([
      this.body.toCbor(),
      cbor.encode(this.signature),
    ]);
  }
}
