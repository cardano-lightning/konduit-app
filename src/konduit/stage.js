import { Duration } from "./time.js";

/**
 * Represents the Rust variant `Stage::Opened(u64)`.
 */
class StageOpened {
  /** * @param {number} subbed (from u64)
   */
  constructor(subbed) {
    this.subbed = subbed;
  }
}

/**
 * Represents the Rust variant `Stage::Closed(u64, Duration)`.
 */
class StageClosed {
  /** * @param {number} subbed (from u64)
   * @param {number} timeout (assuming Duration is a number, from u64)
   */
  constructor(subbed, timeout) {
    this.subbed = subbed;
    this.timeout = timeout;
  }
}

/**
 * Represents the Rust variant `Stage::Responded`.
 * TBC
 */
class StageResponded {
  constructor() {}
}

// --- Stage Enum Wrapper ---

/**
 * Represents the Rust enum `Stage` as a discriminated union.
 * This object will have a `variant` property (e.g., "Opened")
 * and a `value` property (e.g., an instance of StageOpened).
 * * @property {"Opened" | "Closed" | "Responded"} variant
 * @property {StageOpened | StageClosed | StageResponded} value
 */
export class Stage {
  /**
   * @private
   * @param {"Opened" | "Closed" | "Responded"} variant
   * @param {StageOpened | StageClosed | StageResponded} value
   */
  constructor(variant, value) {
    this.variant = variant;
    this.value = value;
  }

  /** * Creates a new 'Opened' Stage.
   * @param {number} subbed (from u64)
   * @returns {Stage}
   */
  static Opened(subbed) {
    return new Stage("Opened", new StageOpened(subbed));
  }

  /** * Creates a new 'Closed' Stage.
   * @param {number} subbed (from u64)
   * @param {number} timeout (from Duration)
   * @returns {Stage}
   */
  static Closed(subbed, timeout) {
    return new Stage("Closed", new StageClosed(subbed, timeout));
  }

  /** * Creates a new 'Responded' Stage.
   * @returns {Stage}
   */
  static Responded() {
    return new Stage("Responded", new StageResponded());
  }
}
