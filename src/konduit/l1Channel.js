import * as hex from "../utils/hex.js";
import * as time from "../utils/time.js";

/**
 * @typedef {"Opened" | "Closed" | "Responded"} L1ChannelStage
 * @typedef {"Pending" | "Confirmed"} L1ChannelPhase
 */

/**
 * Holds state information for the Layer 1 channel.
 *
 * This class stores data using camelCase properties (e.g., `txHash`)
 * and serialises to a plain object with the same keys.
 */
export class L1Channel {
  /**
   * Creates an instance of L1Channel.
   *
   * @param {Uint8Array | null} txHash - The transaction hash. Null if not yet on-chain.
   * @param {number} outputIndex - The output index of the transaction.
   * @param {L1ChannelStage} stage - The current stage of the L1 channel.
   * @param {number} amount - Amount in the channel.
   * @param {number} subbed - Amount subbed. Should be 0 if 'Responded'.
   * @param {number} elapseAt - Timestamp when the channel can be elapsed. Zero if not 'Closed'.
   * @param {L1ChannelPhase} phase - The confirmation phase of the channel state.
   * @param {number} updatedAt - Posix time **in seconds** when last updated
   */
  constructor(
    txHash,
    outputIndex,
    stage,
    amount,
    subbed,
    elapseAt,
    phase,
    updatedAt,
  ) {
    /**
     * The transaction hash. Null if not yet on-chain.
     * @type {Uint8Array | null}
     */
    this.txHash = txHash;

    /**
     * The output index of the transaction.
     * @type {number}
     */
    this.outputIndex = outputIndex;

    /**
     * The current stage of the L1 channel.
     * @type {L1ChannelStage}
     */
    this.stage = stage;

    /**
     * Amount in the channel.
     * @type {number}
     */
    this.amount = amount;

    /**
     * Amount subbed. Should be 0 if 'Responded'.
     * @type {number}
     */
    this.subbed = subbed;

    /**
     * Timestamp when the channel can be elapsed.
     * Zero if not in 'Closed' stage.
     * @type {number}
     */
    this.elapseAt = elapseAt;

    /**
     * The confirmation phase of the channel state.
     * @type {L1ChannelPhase}
     */
    this.phase = phase;

    /**
     * The confirmation phase of the channel state.
     * @type {updatedAt}
     */
    this.updatedAt = updatedAt;
  }

  /**
   * Create l1channel from open tx
   * @param {Uint8Array<ArrayBufferLike>} txHash
   * @param {number} outputIndex
   * @param {number} amount
   * @returns {L1Channel} A new L1Channel instance.
   */
  static open(txHash, outputIndex, amount) {
    const stage = "Opened";
    const subbed = 0;
    const elapseAt = 0;
    const phase = "Pending";
    const updatedAt = time.timestampSecs();
    return new L1Channel(
      txHash,
      outputIndex,
      stage,
      amount,
      subbed,
      elapseAt,
      phase,
      updatedAt,
    );
  }
  /**
   * Serialises the L1Channel instance into a plain object
   *
   * @returns {{txHash: string | null, outputIndex: number, stage: L1ChannelStage, amount: number, subbed: number, elapseAt: number, phase: L1ChannelPhase, updatedAt: number}}
   * A plain object suitable for JSON or IndexedDB.
   */
  serialise() {
    return {
      txHash: this.txHash ? hex.encode(this.txHash) : null,
      outputIndex: this.outputIndex,
      stage: this.stage,
      amount: this.amount,
      subbed: this.subbed,
      elapseAt: this.elapseAt,
      phase: this.phase,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Deserialises a plain object (from JSON or DB) into an L1Channel instance.
   *
   * @param {object} data - The plain object.
   * @param {string | null} data.txHash
   * @param {number} data.outputIndex
   * @param {L1ChannelStage} data.stage
   * @param {number} data.amount
   * @param {number} data.subbed
   * @param {number} data.elapseAt
   * @param {L1ChannelPhase} data.phase
   * @param {number} data.updatedAt
   * @returns {L1Channel} A new L1Channel instance.
   * @throws {Error} If data is invalid.
   */

  static deserialise(data) {
    if (
      !data ||
      data.txHash === undefined || // Note: null is valid, undefined is not
      data.outputIndex == null ||
      data.stage == null ||
      data.amount == null ||
      data.subbed == null ||
      data.elapseAt == null ||
      data.phase == null ||
      data.updatedAt == null
    ) {
      // Renamed from status
      throw new Error(
        "Invalid or incomplete data for L1Channel deserialisation.",
      );
    }

    const validStages = ["Opened", "Closed", "Responded"];
    if (!validStages.includes(data.stage)) {
      throw new Error(
        `Invalid stage: "${data.stage}". Must be one of ${validStages.join(", ")}.`,
      );
    }

    const validPhases = ["Pending", "Confirmed"]; // Renamed from validStatuses
    if (!validPhases.includes(data.phase)) {
      throw new Error(
        `Invalid phase: "${data.phase}". Must be one of ${validPhases.join(", ")}.`,
      );
    }

    try {
      return new L1Channel(
        data.txHash ? hex.decode(data.txHash) : null,
        Number(data.outputIndex),
        data.stage,
        Number(data.amount),
        Number(data.subbed),
        Number(data.elapseAt),
        data.phase,
        data.updatedAt,
      );
    } catch (error) {
      console.error("Failed to deserialise L1Channel:", error);
      throw new Error(`L1Channel deserialisation failed: ${error.message}`);
    }
  }
}
