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
   * The adaptor's public key.
   * @type {Uint8Array}
   */
  adaptorKey;

  /**
   * The close period.
   * @type {number}
   */
  closePeriod;

  /**
   * The fee.
   * @type {number}
   */
  fee;

  /**
   * The maximum tag length.
   * @type {number}
   */
  maxTagLength;

  /**
   * The deployer's verification key.
   * @type {Uint8Array}
   */
  deployerVkey;

  /**
   * The script hash.
   * @type {Uint8Array}
   */
  scriptHash;

  /**
   * The URL of the adaptor.
   * @type {string}
   */
  url;

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
   * @param {string} url - Adaptor Url
   */
  constructor(
    adaptorKey,
    closePeriod,
    fee,
    maxTagLength,
    deployerVkey,
    scriptHash,
    url,
  ) {
    this.adaptorKey = adaptorKey;
    this.closePeriod = closePeriod;
    this.fee = fee;
    this.maxTagLength = maxTagLength;
    this.deployerVkey = deployerVkey;
    this.scriptHash = scriptHash;
    this.url = url;
  }

  /**
   * Serialises the AdaptorInfo instance into a plain object
   *
   * @returns {{adaptorKey: string, closePeriod: number, fee: number, maxTagLength: number, deployerVkey: string, scriptHash: string, url: string}}
   * A plain object suitable for JSON or IndexedDB.
   */
  serialise() {
    return {
      adaptorKey: hex.encode(this.adaptorKey),
      closePeriod: this.closePeriod,
      fee: this.fee,
      maxTagLength: this.maxTagLength,
      deployerVkey: hex.encode(this.deployerVkey),
      scriptHash: hex.encode(this.scriptHash),
      url: this.url,
    };
  }

  /**
   * Deserialises a plain object (from JSON or DB) into an AdaptorInfo instance.
   *
   * @param {object} data - The plain object.
   * @param {string} data.adaptorKey
   * @param {number} data.closePeriod
   * @param {number} data.fee
   * @param {number} data.maxTagLength
   * @param {string} data.deployerVkey
   * @param {string} data.scriptHash
   * @param {string} data.url
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
      data.scriptHash == null ||
      data.url == null
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
        data.url,
      );
    } catch (error) {
      console.error("Failed to deserialise AdaptorInfo:", error);
      throw new Error(`AdaptorInfo deserialisation failed: ${error.message}`);
    }
  }
}
