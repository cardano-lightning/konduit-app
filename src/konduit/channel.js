import * as hex from "../utils/hex.js";
import { concat } from "../utils/uint8Array.js";
import { Adaptor } from "./adaptor.js";
import { AdaptorInfo } from "./adaptorInfo.js";
import { Cheque } from "./cheque.js";
import { ChequeBody } from "./chequeBody.js";
import { L1Channel } from "./l1Channel.js";
import { MixedReceipt } from "./mixedReceipt.js";
import { Squash } from "./squash.js";

/**
 * Manages the state of a channel, including L1 and L2 information.
 * Designed to be storable in IndexedDB via serialisation.
 */
export class Channel {
  /**
   * Creates an instance of a Channel.
   *
   * @param {Uint8Array} verificationKey - Own verification key
   * Althouth this is duplication, it seems more hygenic to keep it here.
   * @param {Uint8Array} tag - A unique tag or identifier for the channel.
   * @param {AdaptorInfo} adaptorInfo - Configuration and info about the adaptor.
   * @param {L1Channel} l1 - The Layer 1 channel information.
   * @param {MixedReceipt} l2 - The Layer 2 mixed receipt information.
   */
  constructor(verificationKey, tag, adaptorInfo, l1, l2) {
    /**
     * Own verification key
     * @type {Uint8Array}
     */
    this.key = verificationKey;

    /**
     * Own keytag
     * @type {Uint8Array}
     */
    this.keytag = concat([verificationKey, tag]);
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
   * @param {Uint8Array} verificationKey - Own verification key
   * @param {Uint8Array<ArrayBufferLike>} tag
   * @param {AdaptorInfo} adaptorInfo
   * @param {L1Channel} l1
   * @param {Squash} squash
   * @returns {Channel}
   */
  static open(verificationKey, tag, adaptorInfo, l1, squash) {
    const mixedReceipt = new MixedReceipt(squash, []);
    return new Channel(verificationKey, tag, adaptorInfo, l1, mixedReceipt);
  }

  /**
   * Send current squash to adaptor
   * */
  squash() {
    return this.adaptor().chSquash(this.l2.squash);
  }

  sync() {
    return Promise.all([this.squash()]);
  }
  /**
   * Send current squash to adaptor
   * */
  adaptor() {
    return new Adaptor(this.keytag, this.adaptorInfo.url);
  }

  /**
   * Make the next cheque body. Index deduced from current. Body
   * WARNING: we don't insert it here since it first needs to be signed.
   * @param {number} amount
   * @param {number} timeout
   * @param {Uint8Array<ArrayBufferLike>} lock
   */
  makeChequeBody(amount, timeout, lock) {
    const index = this.l2.maxIndex() + 1;
    return new ChequeBody(index, amount, timeout, lock);
  }

  /**
   * Insert Cheque
   * @param {Cheque} cheque
   */
  insertCheque(cheque) {
    this.l2.insert(cheque);
  }

  /**
   * Update l1 from list of L1s.
   * TO BE IMPLEMENTED
   * for now rely on local state.
   * */
  updateFromL1(l1s) {
    throw Error("Not yet implemented");
  }

  /**
   * The l2 (mixed receipt is constructed upstream)
   * squash verification
   * @param {MixedReceipt} l2
   */
  updateL2(l2) {
    if (l2.verify(this.key, this.tag)) {
      this.l2 = l2;
      return l2;
    } else {
      throw Error("Not yet implemented");
    }
  }

  /**
   * Get quote from adaptor if funds available.
   * Gets inserted into mixed receipt
   * squash verification
   * returns {Promise<QuoteResult | null>}
   * @param {number} amount_msat - Amount to pay in msats
   * @param {Uint8Array} payee - 33 Byte address
   * @returns {QuoteResponse}
   */
  async quote(amount_msat, payee) {
    return this.adaptor().chQuote(amount_msat, payee);
  }

  /**
   * newCheque
   * Gets inserted into mixed receipt
   * FIXME DOES NOT WORK
   * @param {Cheque} cheque
   * @param {string} invoice
   */
  pay(cheque, invoice) {
    this.insertCheque(cheque);
    return this.adaptor().chPayInvoice(cheque, invoice);
  }

  /**
   * Amount available to be spent
   * */
  available() {
    const l1 = this.l1;
    const l2 = this.l2;
    if (l1 && l2 && l1.stage === "Opened") {
      return l1.amount - l2.committed();
    } else {
      return 0;
    }
  }

  /**
   * Funds unresolved
   * */
  unresolvedCommitment() {
    return this.l2
      .cheques()
      .reduce((acc, curr) => acc + curr.cheque_body.amount, 0);
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
      key: hex.encode(this.key),
      tag: hex.encode(this.tag),
      adaptorInfo: this.adaptorInfo.serialise(),
      l1: this.l1.serialise(),
      l2: this.l2.serialise(),
    };
  }

  /**
   * Deserialises a plain object from storage back into a Channel instance.
   * This static method acts as a "factory" for rebuilding the class.
   *
   * @param {object} data - The plain object retrieved from IndexedDB.
   * @param {string} data.key
   * @param {string} data.tag
   * @param {any} data.adaptorInfo
   * @param {any} data.l1
   * @param {any} data.l2
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
        hex.decode(data.key),
        hex.decode(data.tag),
        AdaptorInfo.deserialise(data.adaptorInfo),
        L1Channel.deserialise(data.l1),
        MixedReceipt.deserialise(data.l2),
      );
    } catch (error) {
      console.error("Failed to deserialise AdaptorInfo:", error);
      throw new Error(`AdaptorInfo deserialisation failed: ${error.message}`);
    }
  }
}
