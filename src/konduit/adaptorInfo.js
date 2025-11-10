import * as hex from "../utils/hex.js";

/**
 * Holds configuration information for an adaptor.
 *
 * This class stores data using camelCase properties (e.g., `adaptorKey`)
 * but serialises to and deserialises from a snake_case object
 * (e.g., `adaptor_key`) as specified.
 */
export class AdaptorInfo {
  /**
   * Creates an instance of AdaptorInfo.
   * It's recommended to use `AdaptorInfo.deserialise` to create
   * an instance from raw data.
   *
   * @param {Uint8Array} adaptorKey - The adaptor's public key.
   * @param {number} closePeriod - The close period.
   * @param {number} fee - The fee.
   * @param {number} maxTagLength - The maximum tag length.
   * @param {Uint8Array} deployerVkey - The deployer's verification key.
   * @param {Uint8Array} scriptHash - The script hash.
   */
  constructor(
    adaptorKey,
    closePeriod,
    fee,
    maxTagLength,
    deployerVkey,
    scriptHash,
  ) {
    this.adaptorKey = adaptorKey;
    this.closePeriod = closePeriod;
    this.fee = fee;
    this.maxTagLength = maxTagLength;
    this.deployerVkey = deployerVkey;
    this.scriptHash = scriptHash;
  }

  /**
   * Serialises the AdaptorInfo instance into a plain object with
   * snake_case keys and hex strings for byte arrays.
   *
   * @returns {{adaptor_key: string, close_period: number, fee: number, max_tag_length: number, deployer_vkey: string, script_hash: string}}
   * A plain object suitable for JSON or IndexedDB.
   */
  serialise() {
    return {
      adaptor_key: hex.encode(this.adaptorKey),
      close_period: this.closePeriod,
      fee: this.fee,
      max_tag_length: this.maxTagLength,
      deployer_vkey: hex.encode(this.deployerVkey),
      script_hash: hex.encode(this.scriptHash),
    };
  }

  /**
   * Deserialises a plain object (from JSON or DB) into an AdaptorInfo instance.
   * Expects snake_case keys and hex strings for byte arrays.
   *
   * @param {object} data - The plain object.
   * @param {string} data.adaptorKey
   * @param {number} data.closePeriod
   * @param {number} data.fee
   * @param {number} data.maxTagLength
   * @param {string} data.deployerVkey
   * @param {string} data.scriptHash
   * @returns {AdaptorInfo} A new AdaptorInfo instance.
   * @throws {Error} If data is invalid.
   */
  static deserialise(data) {
    if (
      !data ||
      data.adaptorKey == null ||
      data.closePeriod == null ||
      data.fee == null ||
      data.maxTagLength == null ||
      data.deployerVkey == null ||
      data.scriptHash == null
    ) {
      throw new Error(
        "Invalid or incomplete data for AdaptorInfo deserialisation.",
      );
    }

    try {
      return new AdaptorInfo(
        hex.decode(data.adaptorKey),
        Number(data.closePeriod),
        Number(data.fee),
        Number(data.maxTagLength),
        hex.decode(data.deployerVkey),
        hex.decode(data.scriptHash),
      );
    } catch (error) {
      console.error("Failed to deserialise AdaptorInfo:", error);
      throw new Error(`AdaptorInfo deserialisation failed: ${error.message}`);
    }
  }
}
