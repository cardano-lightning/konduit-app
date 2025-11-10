/**
 * Abbreviates a string by keeping the specified number of characters
 * at the start and end, replacing the middle section with an ellipsis.
 *
 * @param {string} str - The string to abbreviate.
 * @param {number} prefixLen - The number of characters to keep at the start.
 * @param {number} suffixLen - The number of characters to keep at the end.
 * @returns {string} The abbreviated string.
 */
export const abbreviate = (str, prefixLen, suffixLen) => {
    if (!str || (str.length <= prefixLen + suffixLen)) {
      return str;
    }
    return `${str.substring(0, prefixLen)}...${str.substring(str.length - suffixLen)}`;
};
