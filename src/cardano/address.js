import { bech32 } from "bech32";
import { networkTypes } from "./network.js";
import { blake2b224 } from "./hash.js";

/**
 * Converts a verification key into a base address (type 6).
 * This address type consists of a header byte and the 28-byte hash
 * (Blake2b-224) of the verification key. It does not include a
 * delegation part.
 *
 * @param {import('./network.js').{networkTypes} network - The network type (MAINNET, PREPROD, etc.).
 * @param {Uint8Array} verificationKey - The public verification key.
 * @returns {string} The bech32 encoded base address (e.g., "addr1...").
 * @throws {Error} If keys.hashVerificationKey is not a function or fails.
 */
export function verificationKeyToAddress(network, verificationKey) {
  const header = constructHeader(network, PaymentType.KEY, DelegationType.NONE);
  const keyHash = blake2b224(verificationKey);

  if (!keyHash || keyHash.length !== 28) {
    throw new Error("Invalid key hash generated. Must be 28 bytes.");
  }

  const addressBytes = new Uint8Array(29);
  addressBytes.set([header], 0);
  addressBytes.set(keyHash, 1);

  const hrp = network === networkTypes.MAINNET ? "addr" : "addr_test";
  const words = bech32.toWords(addressBytes);
  const bech32Address = bech32.encode(hrp, words, 90);

  return bech32Address;
}

/**
 * @enum {number} Defines the payment part type for a Shelley address.
 * Corresponds to bit 0 of the header type.
 */
export const PaymentType = {
  /** Payment part is a PaymentKeyHash (bit 0 = 0) */
  KEY: 0,
  /** Payment part is a ScriptHash (bit 0 = 1) */
  SCRIPT: 1,
};

/**
 * @enum {number} Defines the delegation part type for a Shelley address.
 * Corresponds to bits 1 and 2 of the header type.
 */
const DelegationType = {
  /** Delegation part is a StakeKeyHash (bits 1-2 = 00) */
  KEY: 0,
  /** Delegation part is a ScriptHash (bits 1-2 = 01) */
  SCRIPT: 1,
  /** Delegation part is a Pointer (bits 1-2 = 10) */
  POINTER: 2,
  /** No delegation part (bits 1-2 = 11) */
  NONE: 3,
};

/**
 * Constructs the 8-bit header byte for a Shelley address.
 *
 * The header byte is structured as: `t t t t n n n n`
 * - `t t t t` (bits 4-7): Header type (0-7), based on payment and delegation.
 * - `n n n n` (bits 0-3): Network tag (0 for testnet, 1 for mainnet).
 *
 * @param {string} network - The network type, from `networkTypes` in `store.js`. (e.g., "MAINNET", "PREPROD")
 * @param {PaymentType} payment - The type of the payment part (PaymentType.KEY or PaymentType.SCRIPT).
 * @param {DelegationType} delegation - The type of the delegation part (DelegationType.KEY, SCRIPT, POINTER, or NONE).
 * @returns {number} The 8-bit address header byte.
 * @throws {Error} If payment or delegation types are invalid.
 */
function constructHeader(network, payment, delegation) {
  if (payment !== PaymentType.KEY && payment !== PaymentType.SCRIPT) {
    throw new Error(
      "Invalid payment type. Must be PaymentType.KEY or PaymentType.SCRIPT.",
    );
  }

  if (delegation < DelegationType.KEY || delegation > DelegationType.NONE) {
    throw new Error("Invalid delegation type. Must be one of DelegationType.");
  }

  // Network tag (lower 4 bits)
  // 0001 (0x1) for Mainnet
  // 0000 (0x0) for Testnets (Preprod, Preview, Custom)
  const networkTag = network === networkTypes.MAINNET ? 0x1 : 0x0;

  // Header type (upper 4 bits)
  // The header type is a number from 0 to 7.
  // Bit 0: PaymentType (0 for KEY, 1 for SCRIPT)
  // Bits 1-2: DelegationType (0-3)
  // Bit 3: Unused (always 0)
  const headerTypeNum = (delegation << 1) | payment;

  // Shift the header type number to the upper 4 bits
  const headerTypeBits = headerTypeNum << 4;

  // Combine the header type and network tag
  const headerByte = headerTypeBits | networkTag;

  return headerByte;
}
