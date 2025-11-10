export const encode = (/** @type {Uint8Array<ArrayBufferLike>} */ bytes) =>
  [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
export const decode = (/** @type {string} */ hex) =>
  Uint8Array.from((hex.match(/../g) || []).map((h) => parseInt(h, 16)));
