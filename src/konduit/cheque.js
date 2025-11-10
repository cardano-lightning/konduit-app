import * as hex from "../utils/hex.js";
import * as cbor from "../cardano/cbor.js";
import { sign, verify } from "../cardano/keys.js";
import { ChequeBody } from "./chequeBody.js";

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
   * Serialises the Cheque instance into a plain object for storage.
   * @returns {object} A plain object representation.
   */
  serialise() {
    return {
      body: this.body.serialise(),
      signature: this.signature,
    };
  }

  /**
   * Deserialises a plain object from storage back into a Cheque instance.
   * @param {object} data - The plain object.
   * @param {any} data.body
   * @param {Uint8Array} data.signature
   * @returns {Cheque} A new Cheque instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (!data || !data.body || !(data.signature instanceof Uint8Array)) {
      throw new Error("Invalid or incomplete data for Cheque deserialisation.");
    }
    try {
      const body = ChequeBody.deserialise(data.body);
      return new Cheque(body, data.signature);
    } catch (error) {
      throw new Error(`Cheque deserialisation failed: ${error.message}`);
    }
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
