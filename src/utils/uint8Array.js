/**
 * Concatenates multiple Uint8Array instances into a single new Uint8Array.
 *
 * @param {Uint8Array[]} arrays - An array of Uint8Array instances to concatenate.
 * @returns {Uint8Array} A new Uint8Array containing the combined data.
 */
export function concat(arrays) {
  let totalLength = 0;
  for (const arr of arrays) {
    if (typeof arr.length !== "number") {
      console.error("Found bad item in array:", arr);
    }
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Equals (byte for byte)
 *
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {bool} true if a and b are equal
 */
export function equals(a, b) {
  if (a.length !== b.length) return false;
  return a.every((byte, i) => byte === b[i]);
}
