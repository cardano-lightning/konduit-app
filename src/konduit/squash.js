import * as hex from "../utils/hex.js";
import * as cbor from "../cardano/cbor.js";
import { sign, verify } from "../cardano/keys.js";
import { SquashBody } from "./squashBody.js";

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
   * Serialises the Squash instance into a plain object for storage.
   * @returns {object} A plain object representation.
   */
  serialise() {
    return {
      body: this.body.serialise(),
      signature: hex.encode(this.signature),
    };
  }

  /**
   * Deserialises a plain object from storage back into a Squash instance.
   * @param {object} data - The plain object.
   * @param {any} data.body
   * @param {string} data.signature
   * @returns {Squash} A new Squash instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (!data || !data.body || !data.signature) {
      throw new Error("Invalid or incomplete data for Squash deserialisation.");
    }
    try {
      const body = SquashBody.deserialise(data.body);
      return new Squash(body, hex.decode(data.signature));
    } catch (error) {
      throw new Error(`Squash deserialisation failed: ${error.message}`);
    }
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
   * Creates a new Squash instance by signing the tagged body.
   * @param {Uint8Array} signingKey - The private key to sign with.
   * @param {Uint8Array} tag - A domain-separation tag.
   * @returns {Squash} A new Squash instance.
   */
  static makeZero(signingKey, tag) {
    return Squash.make(signingKey, tag, SquashBody.zero());
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

  /**
   * Decodes a Squash from CBOR bytes.
   * @param {Uint8Array} cborBytes - The CBOR-encoded squash.
   * @returns {Squash} A new Squash instance.
   * @throws {Error} If CBOR is invalid or doesn't represent a Squash.
   */
  static fromCbor(cborBytes) {
    try {
      const decoded = cbor.decode(cborBytes);

      if (
        !Array.isArray(decoded) ||
        decoded.length !== 2 ||
        !Array.isArray(decoded[0]) || // The decoded body should be an array
        !decoded[1] // Check for signature (will catch null/undefined)
      ) {
        throw new Error(
          "Invalid CBOR structure for Squash. Expected [body, signature].",
        );
      }

      // Re-encode the decoded body array to get its CBOR bytes.
      const bodyCborBytes = cbor.encodeAsIndefinite(decoded[0]);
      const body = SquashBody.fromCbor(bodyCborBytes);
      // Coerce signature to Uint8Array
      const signature = new Uint8Array(decoded[1]);

      return new Squash(body, signature);
    } catch (error) {
      throw new Error(`Squash fromCbor failed: ${error.message}`);
    }
  }
}
