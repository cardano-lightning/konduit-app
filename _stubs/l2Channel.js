import { Cheque } from "./cheque.js";
import { MixedReceipt } from "./mixedReceipt.js";
import { Squash } from "./squash.js";
// Assuming L1Channel, Keytag, Duration, Stage, and MixedReceiptUpdateError
// are defined in other files, possibly like this:
import { L1Channel } from "./l1Channel.js";
import { Stage } from "./stage.js";
import { Duration } from "./time.js";
// import { MixedReceiptUpdateError } from "./mixedReceipt.js";

/**
 * Custom error class for cheque-related failures.
 */
export class ChequeError extends Error {
  /**
   * @param {string | undefined} message
   */
  constructor(message) {
    super(message);
    this.name = "ChequeError";
  }
}

/**
 * Custom error class for L2 channel squash update failures.
 *
 */
export class L2ChannelUpdateSquashError extends Error {
  /**
   * @param {string} message
   * @param {Error | null} [cause] - The original error (e.g., from MixedReceipt)
   */
  constructor(message, cause = null) {
    super(message);
    this.name = "L2ChannelUpdateSquashError";
    this.cause = cause;
  }
}

/**
 * @typedef {object} L2ChannelInfo
 * @property {Uint8Array} tag
 * @property {Uint8Array} adaptorKey
 * @property {number} closePeriod
 * @property {URL} adaptorUrl
 * @property {number} fee
 */

/**
 * Represents the Layer 2 channel state.
 *
 */
export class L2Channel {
  /**
   * @param {L2ChannelInfo} info
   * @param {L1Channel | null} l1Channel - L1Channel with greatest available funds.
   * @param {MixedReceipt | null} [mixedReceipt] - Current evidence of funds owed.
   */
  constructor(info, l1Channel, mixedReceipt = null) {
    this.info = info;
    this.l1Channel = l1Channel;
    this.mixedReceipt = mixedReceipt;
  }

  /**
   * Creates a new L2Channel instance.
   * @param {L2ChannelInfo} info
   * @param {L1Channel} l1Channel
   * @returns {L2Channel}
   *
   */
  static new(info, l1Channel) {
    return new L2Channel(info, l1Channel, null);
  }

  /**
   * Creates a new L2Channel from a list of L1 channels,
   * selecting the one with the most funds in an 'Opened' state.
   * @param {L2ChannelInfo} info
   * @param {L1Channel[]} l1Channels
   * @returns {L2Channel}
   *
   */
  static fromChannels(info, l1Channels) {
    const l1Channel = l1Channels
      .filter((item) => item.stage.variant === "Opened")
      .reduce((best, current) => {
        if (!best) return current;
        return current.amount > best.amount ? current : best;
      }, null);

    return new L2Channel(info, l1Channel, null);
  }

  // --- Methods ---

  /**
   * Total amount of squashed + unlocked cheques.
   * @returns {number}
   *
   */
  owed() {
    return this.mixedReceipt ? this.mixedReceipt.amount() : 0;
  }

  /**
   * Total amount of squashed + all mixed cheques (locked + unlocked).
   * @returns {number}
   *
   */
  committed() {
    return this.mixedReceipt ? this.mixedReceipt.committed() : 0;
  }

  /**
   * Checks if the channel can quote a certain amount.
   * @param {number} amount
   * @returns {boolean}
   *
   */
  canQuote(amount) {
    return this.capacity() > 0 && this.available() >= amount;
  }

  /**
   * How many more cheques can be issued before the channel is full.
   * @returns {number}
   *
   */
  capacity() {
    return this.mixedReceipt ? this.mixedReceipt.capacity() : 0;
  }

  /**
   * Calculates the available funds in the channel.
   * @returns {number}
   *
   */
  available() {
    if (!this.mixedReceipt) {
      return 0; //
    }
    if (!this.l1Channel) {
      return 0; //
    }
    // Assuming Stage is an object { variant: "Opened" | ..., value: any }
    let stage = this.l1Channel.stage;
    if (stage.variant == "Opened") {
      const subbed = stage.value.subbed;
      const committed = this.committed();

      if (committed < subbed) {
        // This should happen only if there exists mimics
        return 0; //
      }
      const rel_committed = committed - subbed;
      const held = this.l1Channel.amount;

      if (rel_committed > held) {
        // This should happen only if there exists mimics
        return 0; //
      }
      return held - rel_committed; //
    } else {
      return 0;
    }
  }

  /**
   * Updates the active L1 channel based on a new list of channels.
   * Selects the L1 channel with the max claimable amount, then max available amount.
   * @param {L1Channel[]} channels
   *
   */
  updateFromL1(channels) {
    const owed = this.owed();

    const best_l1 = channels
      .map((channel) => {
        let key = { claimable: 0, available: 0 };
        if (channel.stage.variant === "Opened") {
          const subbed = channel.stage.value.subbed;
          if (owed >= subbed) {
            //
            key.claimable = Math.min(owed - subbed, channel.amount);
            key.available = channel.amount;
          }
        }
        return { channel, key };
      })
      .sort((a, b) => {
        // Sort by claimable (desc), then available (desc)
        if (a.key.claimable !== b.key.claimable) {
          return b.key.claimable - a.key.claimable;
        }
        return b.key.available - a.key.available;
      })
      .shift(); // Get the best one

    this.l1Channel = best_l1 ? best_l1.channel : null; //
  }

  /**
   * Adds a new cheque to the mixed receipt.
   * @param {Cheque} cheque
   * @param {Duration} timeout - The current time or slot to check against.
   * @throws {ChequeError}
   *
   */
  addCheque(cheque, timeout) {
    // Assuming keytag.split() exists and returns [key, tag]
    const key = this.info.adaptorKey;
    const tag = this.info.tag;

    if (!cheque.verify(key, tag)) {
      throw new ChequeError("Bad signature"); // Corrected logic
    }
    // Using `cheque.body` based on cheque.js
    if (cheque.body.timeout >= timeout) {
      throw new ChequeError("Expires too soon"); //
    }
    if (!this.l1Channel) {
      throw new ChequeError("No L1 channel"); //
    }
    if (!this.mixedReceipt) {
      throw new ChequeError("Channel not initiated"); //
    }
    if (this.l1Channel.stage.variant !== "Opened") {
      throw new ChequeError("Channel stage not Opened"); //
    }
    const subbed = this.l1Channel.stage.value;
    const committed = this.mixedReceipt.committed();

    // Porting this logic directly from Rust, even if it seems unusual.
    let available = 0;
    if (committed > subbed) {
      available = Math.max(committed - subbed, this.l1Channel.amount); //
    }

    if (available > cheque.body.amount) {
      throw new ChequeError("Amount unavailable"); //
    }

    // mixedReceipt.insert(cheque) throws on error in JS, so no unwrap needed.
    this.mixedReceipt.insert(cheque); //
  }

  /**
   * Updates the channel state with a new squash.
   * @param {Squash} squash
   * @returns {boolean} - True if the update is complete.
   * @throws {L2ChannelUpdateSquashError}
   *
   */
  updateSquash(squash) {
    const key = this.info.adaptorKey;
    const tag = this.info.tag;
    if (!squash.verify(key, tag)) {
      throw new L2ChannelUpdateSquashError("Bad signature");
    }
    if (!this.l1Channel) {
      throw new L2ChannelUpdateSquashError("No L1 channel");
    }
    if (this.l1Channel.stage.variant !== "Opened") {
      throw new L2ChannelUpdateSquashError("Channel stage not Opened");
    }

    if (!this.mixedReceipt) {
      // JS MixedReceipt.new throws, so no .unwrap()
      this.mixedReceipt = MixedReceipt.new(squash, []);
      return true;
    }

    try {
      // mixed_receipt.update can throw MixedReceiptUpdateError
      return this.mixedReceipt.update(squash);
    } catch (e) {
      // Wrap the original error
      throw new L2ChannelUpdateSquashError(
        `Mixed Receipt Error: ${e.message}`,
        e,
      );
    }
  }
}
