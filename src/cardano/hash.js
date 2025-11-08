import { blake2b } from "@noble/hashes/blake2.js";

/*
 * blake2b with a 28-byte (224-bit) output.
 * @param {Uint8Array | string} data - The input data to hash.
 * @returns {Uint8Array} The 28-byte hash.
 */
export function blake2b224(data) {
  return blake2b(data, { dkLen: 28 });
}
