import { sha256 } from "@noble/hashes/sha2.js";

import { concat } from "../utils/uint8Array.js";

import { SigningKeytag } from "./signingKeytag.js";
import { Cheque } from "./cheque.js";
import { ChequeBody } from "./chequeBody.js";

/**
 * A test data generator for creating and inspecting a Cheque.
 * It bundles the signing information (SigningKeytag) with the
 * resulting signed object (Cheque).
 */
export class TestCheque {
  /**
   * @param {SigningKeytag} signingKeytag - The key and tag combination used for signing.
   * @param {Cheque} cheque - The resulting signed cheque object.
   */
  constructor(signingKeytag, cheque) {
    this.signingKeytag = signingKeytag;
    this.cheque = cheque;
  }

  /**
   * Creates a new TestCheque instance from base parameters.
   *
   * @param {Uint8Array} signingKey - The private key to sign with.
   * @param {Uint8Array} tag - A domain-separation tag.
   * @param {number} index - The index for the cheque body.
   * @param {number} amount - The amount for the cheque body.
   * @param {number} timeout - The timeout for the cheque body.
   * @param {Uint8Array} lock - The lock for the cheque body.
   * @returns {TestCheque} A new TestCheque instance.
   */
  static make(signingKey, tag, index, amount, timeout, lock) {
    const signingKeytag = new SigningKeytag(signingKey, tag);
    const body = new ChequeBody(index, amount, timeout, lock);
    // ChequeBody does not have a .verify() method, so we skip it.
    const cheque = Cheque.make(signingKey, tag, body);
    return new TestCheque(signingKeytag, cheque);
  }

  /**
   * Creates a new, deterministic TestCheque instance from a single seed.
   * All parameters (signingKey, tag, body) are derived from the seed.
   * This is useful for generating reproducible test vectors.
   *
   * @param {Uint8Array} seed - The input seed to derive all parameters.
   * @returns {TestCheque} A new, deterministically generated TestCheque.
   */
  static fromSeed(seed) {
    /**
     * Helper to convert first 4 bytes of a Uint8Array to a number.
     * @param {Uint8Array} bytes
     * @returns {number}
     */
    const bytesToNumber = (bytes) => {
      const buffer = new Uint8Array(4);
      buffer.set(bytes.slice(0, 4));
      const view = new DataView(buffer.buffer);
      return view.getUint32(0, true);
    };

    const signingKey = sha256(concat([seed, new Uint8Array([0])]));
    const tag = sha256(concat([seed, new Uint8Array([1])])).slice(0, 16);
    const index =
      bytesToNumber(sha256(concat([seed, new Uint8Array([2])]))) & 0x7fffffff;
    const amount =
      bytesToNumber(sha256(concat([seed, new Uint8Array([3])]))) & 0x7fffffff;
    const timeout =
      bytesToNumber(sha256(concat([seed, new Uint8Array([4])]))) & 0x7fffffff;
    const lock = sha256(concat([seed, new Uint8Array([5])]));
    return TestCheque.make(signingKey, tag, index, amount, timeout, lock);
  }

  /**
   * @returns {string} For aiken
   */
  asAiken() {
    return ` TestCheque { signing_keytag : ${this.signingKeytag.asAiken()} ,  cheque : ${this.cheque.asAiken()} } `;
  }
}
