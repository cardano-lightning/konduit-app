import * as cbor from "cbor-x";
import { concat } from "../utils/uint8Array.js";

export const encoder = new cbor.Encoder({ tagUint8Array: false });

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
