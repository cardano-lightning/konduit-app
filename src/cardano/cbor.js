import * as cbor from "cbor-x";
import { concat } from "../utils/uint8Array.js";

export const encoder = new cbor.Encoder({
  tagUint8Array: false,
  useFloat32: 0,
  largeBigIntToFloat: false,
});

export const encode = (/** @type {Uint8Array<ArrayBufferLike>} */ x) =>
  encoder.encode(x);

export const encodeAsIndefinite = (
  /** @type {[number, number, Iterator<number, any, any>]} */ x,
) => encoder.encode(x[Symbol.iterator]());

const start = new Uint8Array([0x9f]);
const end = new Uint8Array([0xff]);
export const encodeAsIndefiniteRaw = (
  /** @type {(Uint8Array<ArrayBufferLike> | Buffer<ArrayBufferLike>)[]} */ x,
) => concat([start, ...x, end]);

export const decoder = new cbor.Decoder({ mapsAsObjects: false });
export const decode = (/** @type {Uint8Array} */ x) => decoder.decode(x);
/**
 * Encodes a value with a CBOR tag.
 * @param {any} value - The value to tag.
 * @param {number} tag - The tag number.
 * @returns {Uint8Array}
 */
export const encodeTagged = (tag, value) => {
  return encoder.encode(new cbor.Tag(value, tag));
};

/**
 * Encodes a value with a CBOR tag.
 * @param {Uint8Array} value - The value to tag.
 * @param {number} tag - The tag number.
 * @returns {Uint8Array}
 */
export const encodeTaggedRaw = (tag, value) => {
  return concat([new Uint8Array([taggedArray, tag]), value]);
};
const taggedArray = 0xd8;

const MAX_INT = Math.pow(2, 30);
export const wrapInt = (/** @type { number } */ x) =>
  Math.abs(x) > MAX_INT ? BigInt(x) : x;
