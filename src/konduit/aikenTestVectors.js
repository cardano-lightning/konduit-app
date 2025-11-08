import { TestSquash } from "./testSquash.js";
import { TestCheque } from "./testCheque.js";

/**
 * This script generates one deterministic TestSquash and one deterministic TestCheque
 * and prints their 'asAiken' (pretty JSON) representations to the console.
 * * This is useful for creating reproducible test vectors.
 */
function generateAndPrintVectors() {
  const seedSquash = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
  const testSquash = TestSquash.fromSeed(seedSquash);

  console.log(testSquash.asAiken());

  const seedCheque = new Uint8Array([10, 20, 30, 40, 50, 60, 70]);
  const testCheque = TestCheque.fromSeed(seedCheque);

  console.log(testCheque.asAiken());
}

// Run the generator
generateAndPrintVectors();
