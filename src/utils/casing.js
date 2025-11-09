/**
 * Converts a single snake_case string to camelCase.
 * e.g., "first_name" -> "firstName"
 *
 * @param {string} s The snake_case string.
 * @returns {string} The camelCase string.
 */
export const toCamel = (s) => {
  if (typeof s !== "string") return s;
  return s.replace(/(_\w)/g, (m) => m[1].toUpperCase());
};

/**
 * Converts a single camelCase string to snake_case.
 * e.g., "firstName" -> "first_name"
 * e.g., "myUserID" -> "my_user_i_d"
 *
 * @param {string} s The camelCase string.
 * @returns {string} The snake_case string.
 */
export const toSnake = (s) => {
  if (typeof s !== "string") return s;
  // This regex finds all capital letters and replaces them
  // with an underscore and the lowercase version.
  // Note: "UserID" becomes "_user_i_d".
  return s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Recursively converts all keys in an object from snake_case to camelCase.
 * This also handles nested arrays of objects.
 *
 * @param {Object|Array} o The object or array to process.
 * @returns {Object|Array} A new object or array with camelCase keys.
 */
export const keysToCamel = (o) => {
  // 1. Handle Arrays:
  // If it's an array, map over it and recursively call keysToCamel on each item.
  if (Array.isArray(o)) {
    return o.map((i) => keysToCamel(i));
  }

  // 2. Handle Objects:
  // We check for (o && o.constructor === Object) to only process plain objects,
  // not other types like Date, RegExp, or null.
  if (o && o.constructor === Object) {
    // Use reduce to build a new object
    return Object.keys(o).reduce((newObj, key) => {
      // Convert the current key to camelCase
      const newKey = toCamel(key);

      // Recursively call keysToCamel on the value
      const newValue = keysToCamel(o[key]);

      // Assign the new key and processed value to the new object
      newObj[newKey] = newValue;
      return newObj;
    }, {});
  }

  // 3. Base Case:
  // If it's not an array or a plain object (e.g., string, number, null),
  // return the value as-is.
  return o;
};

/**
 * Recursively converts all keys in an object from camelCase to snake_case.
 * This also handles nested arrays of objects.
 *
 * @param {Object|Array} o The object or array to process.
 * @returns {Object|Array} A new object or array with snake_case keys.
 */
export const keysToSnake = (o) => {
  // 1. Handle Arrays:
  if (Array.isArray(o)) {
    return o.map((i) => keysToSnake(i));
  }

  // 2. Handle Objects:
  if (o && o.constructor === Object) {
    return Object.keys(o).reduce((newObj, key) => {
      // Convert the current key to snake_case
      const newKey = toSnake(key);

      // Recursively call keysToSnake on the value
      const newValue = keysToSnake(o[key]);

      newObj[newKey] = newValue;
      return newObj;
    }, {});
  }

  // 3. Base Case:
  return o;
};
