import { sha256 } from "@noble/hashes/sha2.js";

import { concat } from "../utils/uint8Array.js";

import { SigningKeytag } from "./signingKeytag.js";
import { Squash } from "./squash.js";
import { SquashBody } from "./squashBody.js";

/**
 * A test data generator for creating and inspecting a Squash operation.
 * It bundles the signing information (SigningKeytag) with the
 * resulting signed object (Squash).
 */
export class TestSquash {
  /**
   * @param {SigningKeytag} signingKeytag - The key and tag combination used for signing.
   * @param {Squash} squash - The resulting signed squash object.
   */
  constructor(signingKeytag, squash) {
    this.signingKeytag = signingKeytag;
    this.squash = squash;
  }

  /**
   * Creates a new TestSquash instance from base parameters.
   *
   * @param {Uint8Array} signingKey - The private key to sign with.
   * @param {Uint8Array} tag - A domain-separation tag.
   * @param {number} index - The index for the squash body.
   * @param {number} amount - The amount for the squash body.
   * @param {number[]} exclude - The list of excluded indices for the squash body.
   * @returns {TestSquash} A new TestSquash instance.
   */
  static make(signingKey, tag, index, amount, exclude) {
    const signingKeytag = new SigningKeytag(signingKey, tag);
    const body = new SquashBody(amount, index, exclude);
    if (!body.verify()) {
      console.warn("Creating a TestSquash with an invalid body.");
    }
    const squash = Squash.make(signingKey, tag, body);
    return new TestSquash(signingKeytag, squash);
  }

  /**
   * Creates a new, deterministic TestSquash instance from a single seed.
   * All parameters (signingKey, tag, body) are derived from the seed.
   * This is useful for generating reproducible test vectors.
   *
   * @param {Uint8Array} seed - The input seed to derive all parameters.
   * @returns {TestSquash} A new, deterministically generated TestSquash.
   */
  static fromSeed(seed) {
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
    let exclude = [];
    if (index > 0) {
      const ex1 =
        bytesToNumber(sha256(concat([seed, new Uint8Array([4])]))) % index;
      const ex2 =
        bytesToNumber(sha256(concat([seed, new Uint8Array([5])]))) % index;
      const ex3 =
        bytesToNumber(sha256(concat([seed, new Uint8Array([6])]))) % index;

      const excludeSet = new Set([ex1, ex2, ex3]);
      exclude = Array.from(excludeSet).sort((a, b) => a - b);
    }
    return TestSquash.make(signingKey, tag, index, amount, exclude);
  }
  /**
   * @returns {string} An aiken like expression
   */
  asAiken() {
    return ` TestSquash { signing_keytag : ${this.signingKeytag.asAiken()} ,  squash : ${this.squash.asAiken()} } `;
  }
}
