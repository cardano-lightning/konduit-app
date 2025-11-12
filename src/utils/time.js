export function timestampSecs() {
  return Math.floor(Date.now() / 1000);
}

/**
 * @param {number} x
 */
export function sinceSecs(x) {
  return timestampSecs() - x;
}
