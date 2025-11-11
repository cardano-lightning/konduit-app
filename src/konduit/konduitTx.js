import { timestampSecs } from "../utils/time.js";
import * as hex from "../utils/hex.js";

/**
 * A unique identifier, typically a Uint8Array.
 * @typedef {Uint8Array} Tag
 */

/**
 * Represents a step in the transaction process.
 * @typedef {"Open" | "Add" | "Sub" | "Close" | "Respond" | "Unlock" | "Expire" | "Elapse"} Step
 */

/**
 * A tuple representing a tag of the channel and the step of that channel
 * @typedef {[Uint8Array, Step]} TaggedStep
 */

/**
 * Represents the tag for the wallet's role in the transaction.
 * @typedef {"FundsIn" | "FundsOut" | "Facilitate" | "Other"} WalletTag
 */

/**
 * Represents the current status of the transaction.
 * Failed indicates that we've given up expecting to see it.
 * @typedef {"Pending" | "Confirmed" | "Failed" | "Other"} Phase
 */

// --- KonduitTx Class ---

/**
 * Represents a Konduit transaction, tracking its state and history.
 */
export class KonduitTx {
  /**
   * The transaction hash.
   * @type {Uint8Array}
   */
  txHash;

  /**
   * The tag indicating the wallet's role (e.g., "FundsIn").
   * @type {WalletTag}
   */
  walletTag;

  /**
   * The current phase of the transaction (e.g., "Pending").
   * @type {Phase}
   */
  phase;

  /**
   * An array of steps taken in this transaction, each as a [Tag, Step] tuple.
   * @type {Array<TaggedStep>}
   */
  steps;

  /**
   * The POSIX timestamp (in seconds) when the transaction was last updated.
   * @type {number}
   */
  updatedAt;

  /**
   * Creates an instance of a KonduitTx.
   *
   * @param {Uint8Array} txHash - The transaction hash.
   * @param {WalletTag} walletTag - The tag indicating the wallet's role.
   * @param {Phase} phase - The current phase of the transaction.
   * @param {Array<TaggedStep>} steps - An array of [Tag, Step] tuples.
   * @param {number | null} [updatedAt=null] - The timestamp of the last update. If null, defaults to current time.
   */
  constructor(txHash, walletTag, phase, steps, updatedAt = null) {
    this.txHash = txHash;
    this.walletTag = walletTag;
    this.phase = phase;
    this.steps = steps;
    this.updatedAt = updatedAt ?? timestampSecs();
  }

  // --- Public Methods ---

  /**
   * Sets the transaction phase to "Confirmed" and updates the timestamp.
   */
  confirm() {
    if (this.phase !== "Confirmed") {
      this.phase = "Confirmed";
      this.updatedAt = timestampSecs();
    }
  }

  /**
   * Sets the transaction phase to "Failed" and updates the timestamp.
   */
  failed() {
    if (this.phase !== "Failed") {
      this.phase = "Failed";
      this.updatedAt = timestampSecs();
    }
  }

  // --- Serialisation ---

  /**
   * Serialises the KonduitTx instance into a plain object for storage.
   * @returns {object} A plain object representation.
   */
  serialise() {
    return {
      txHash: hex.encode(this.txHash),
      walletTag: this.walletTag,
      phase: this.phase,
      steps: this.steps.map(([tag, step]) => [hex.encode(tag), step]),
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Deserialises a plain object from storage back into a KonduitTx instance.
   * @param {any} data - The plain object.
   * @returns {KonduitTx} A new KonduitTx instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (
      !data ||
      typeof data.txHash !== "string" ||
      typeof data.walletTag !== "string" ||
      typeof data.phase !== "string" ||
      !Array.isArray(data.steps) ||
      typeof data.updatedAt !== "number"
    ) {
      throw new Error(
        "Invalid or incomplete data for KonduitTx deserialisation.",
      );
    }

    // We trust the shape of the 'steps' array data for terseness,
    // as seen in the other deserialise examples.
    try {
      return new KonduitTx(
        hex.decode(data.txHash),
        data.walletTag,
        data.phase,
        data.steps.map(([tag, step]) => [hex.decode(tag), step]),
        data.updatedAt,
      );
    } catch (error) {
      // This catch is mainly for future-proofing if the constructor adds logic
      throw new Error(`KonduitTx deserialisation failed: ${error.message}`);
    }
  }
}
