import { AdaptorInfo } from "./adaptorInfo.js";
// --- JSDoc Type Definitions ---
// Define placeholder structures for your custom types.
// Modify these to match your actual data structures.

/**
 * @typedef {object} L1Channel
 * @property {string} channelId - Example property: The Layer 1 channel identifier.
 * @property {string} state - Example property: The current state of the L1 channel.
 */

/**
 * @typedef {object} MixedReceipt
 * @property {string} receiptHash - Example property: The hash of the mixed receipt.
 * @property {Array<string>} signatures - Example property: A list of signatures.
 */

// --- Channel Class ---

/**
 * Manages the state of a channel, including L1 and L2 information.
 * Designed to be storable in IndexedDB via serialisation.
 */
export class Channel {
  /**
   * Creates an instance of a Channel.
   *
   * @param {Uint8Array} tag - A unique tag or identifier for the channel.
   * @param {AdaptorInfo} adaptorInfo - Configuration and info about the adaptor.
   * @param {L1Channel} l1 - The Layer 1 channel information.
   * @param {MixedReceipt} l2 - The Layer 2 mixed receipt information.
   */
  constructor(tag, adaptorInfo, l1, l2) {
    /**
     * A unique tag or identifier for the channel.
     * @type {Uint8Array}
     */
    this.tag = tag;

    /**
     * Configuration and info about the adaptor.
     * @type {AdaptorInfo}
     */
    this.adaptorInfo = adaptorInfo;

    /**
     * The Layer 1 channel information.
     * @type {L1Channel}
     */
    this.l1 = l1;

    /**
     * The Layer 2 mixed receipt information.
     * @type {MixedReceipt}
     */
    this.l2 = l2;
  }

  /**
   * Serialises the Channel instance into a plain object for storage.
   * IndexedDB's "structured clone algorithm" can store plain objects
   * and specific types like Uint8Array, but not class instances (it loses methods).
   *
   * @returns {object} A plain object representation of the Channel.
   */
  serialise() {
    return {
      tag: this.tag,
      adaptorInfo: this.adaptorInfo.serialise(),
      l1: this.l1,
      l2: this.l2,
    };
  }

  /**
   * Deserialises a plain object from storage back into a Channel instance.
   * This static method acts as a "factory" for rebuilding the class.
   *
   * @param {object} data - The plain object retrieved from IndexedDB.
   * @param {Uint8Array} data.tag
   * @param {any} data.adaptorInfo
   * @param {L1Channel} data.l1
   * @param {MixedReceipt} data.l2
   * @returns {Channel} A new Channel instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (!data || !data.tag || !data.adaptorInfo || !data.l1 || !data.l2) {
      throw new Error(
        "Invalid or incomplete data for Channel deserialisation.",
      );
    }

    // Because AdaptorInfo, L1Channel, and MixedReceipt are defined as
    // plain objects (based on the typedefs), we can pass them directly.
    // If they were *also* classes, you would need to call their own
    // .deserialise() methods here, e.g.:
    // const l1 = L1Channel.deserialise(data.l1);

    try {
      return new Channel(
        data.tag,
        AdaptorInfo.deserialise(data.adaptorInfo),
        data.l1,
        data.l2,
      );
    } catch (error) {
      console.error("Failed to deserialise AdaptorInfo:", error);
      throw new Error(`AdaptorInfo deserialisation failed: ${error.message}`);
    }
  }
}
