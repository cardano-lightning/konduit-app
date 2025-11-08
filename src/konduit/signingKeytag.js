/// FOR TESTING PURPOSES ONLY ///
import * as hex from "../utils/hex.js";
import { toVerificationKey } from "../cardano/keys.js";

/**
 * Represents a SigningKeytag, holding its configuration
 * and private key for interacting with a payment channel.
 */
export class SigningKeytag {
  /**
   * Creates a new SigningKeytag.
   * @param {Uint8Array} signingKey - The private key for signing messages.
   * @param {Uint8Array} tag - The domain-separation tag to use for this channel.
   */
  constructor(signingKey, tag) {
    this.signingKey = signingKey;
    this.tag = tag;
    this.verificationKey = toVerificationKey(signingKey);
  }

  /**
   * Helper to safely decode a Uint8Array to a string if it's valid UTF-8.
   * @param {Uint8Array} bytes - The bytes to decode.
   * @returns {string} The decoded string, or a hex fallback.
   */
  safeDecodeUTF8(bytes) {
    try {
      // Use TextDecoder with 'fatal: true' to throw an error on invalid UTF-8
      const decoder = new TextDecoder("utf-8", { fatal: true });
      return decoder.decode(bytes);
    } catch (e) {
      // Fallback to hex if decoding fails
      return `(Invalid UTF-8 data: ${hex.encode(bytes)})`;
    }
  }

  /**
   * Returns a "pretty JSON" representation of the consumer's configuration.
   * (Note: This is not valid Aiken syntax, but formatted as requested).
   * @returns {string} A formatted JSON string.
   */
  asAiken() {
    return ` SigningKeytag { signing_key : #"${hex.encode(this.signingKey)}",  verification_key : #"${hex.encode(this.verificationKey)}",  tag : #"${hex.encode(this.tag)}",  }`;
  }
}
