import { Stage } from "./stage.js";

/**
 * Represents the L1Channel struct.
 */
export class L1Channel {
  /**
   * @param {Stage} stage - An instance of the Stage class (e.g., Stage.Opened(100)).
   * @param {number} amount (from u64)
   */
  constructor(stage, amount) {
    this.stage = stage;
    this.amount = amount;
  }
}
