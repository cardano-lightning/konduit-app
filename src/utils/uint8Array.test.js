import { describe, it, expect } from "vitest";
import { concat } from "./uint8Array.js"; // Assuming this test file is in the same directory as the module

describe("concat", () => {
  it("Should concatenate multiple arrays", () => {
    const arr1 = new Uint8Array([1, 2, 3]);
    const arr2 = new Uint8Array([4, 5]);
    const arr3 = new Uint8Array([6, 7, 8, 9]);
    const expected = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const actual = concat([arr1, arr2, arr3]);
    // .toEqual() performs a deep comparison, which is correct for arrays
    expect(actual).toEqual(expected);
  });

  it("Should handle empty arrays in the list", () => {
    const arr4 = new Uint8Array([10, 20]);
    const arr5 = new Uint8Array([]);
    const arr6 = new Uint8Array([30]);
    const expected = new Uint8Array([10, 20, 30]);

    expect(concat([arr4, arr5, arr6])).toEqual(expected);
  });

  it("Should work with a single array", () => {
    const arr7 = new Uint8Array([100, 200]);
    const expected = new Uint8Array([100, 200]);

    expect(concat([arr7])).toEqual(expected);
  });

  it("Should return an empty array when given an empty array", () => {
    const expected = new Uint8Array([]);
    expect(concat([])).toEqual(expected);
  });

  it("Should return an empty array when all inputs are empty", () => {
    const expected = new Uint8Array([]);
    expect(concat([new Uint8Array([]), new Uint8Array([])])).toEqual(expected);
  });
});
