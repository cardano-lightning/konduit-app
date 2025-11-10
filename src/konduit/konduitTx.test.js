import { describe, it, expect } from "vitest";
import { timestampSecs } from "../utils/time.js";
import { KonduitTx } from "./konduitTx.js";

const MOCK_TIME_1 = 1700000000;

const createTestData = () => ({
  txHash: new Uint8Array([1, 2, 3, 4, 5]),
  walletTag: "FundsIn",
  phase: "Pending",
  steps: [
    [new Uint8Array([1]), "Open"],
    [new Uint8Array([2]), "Add"],
  ],
  updatedAt: MOCK_TIME_1,
});

describe("KonduitTx", () => {
  describe("Constructor", () => {
    it("should correctly assign all properties", () => {
      const data = createTestData();
      const tx = new KonduitTx(
        data.txHash,
        data.walletTag,
        data.phase,
        data.steps,
        data.updatedAt,
      );

      expect(tx.txHash).toBe(data.txHash);
      expect(tx.walletTag).toBe(data.walletTag);
      expect(tx.phase).toBe(data.phase);
      expect(tx.steps).toBe(data.steps);
      expect(tx.updatedAt).toBe(MOCK_TIME_1);
    });

    it("should set updatedAt to current time if null", () => {
      const data = createTestData();

      // Get a timestamp just before creating the object
      const beforeTime = timestampSecs();

      // Pass null for updatedAt
      const tx = new KonduitTx(
        data.txHash,
        data.walletTag,
        data.phase,
        data.steps,
        null,
      );

      // Get a timestamp just after
      const afterTime = timestampSecs();

      // Expect the new timestamp to be within the window
      expect(tx.updatedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(tx.updatedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("confirm", () => {
    it('should set phase to "Confirmed" and update timestamp', async () => {
      const data = createTestData();
      const tx = new KonduitTx(
        data.txHash,
        data.walletTag,
        "Pending",
        data.steps,
        data.updatedAt,
      );

      const originalTime = tx.updatedAt;

      // Wait 1 second to ensure the timestamp will be different
      // This makes the test more robust against high-speed execution.
      await new Promise((resolve) => setTimeout(resolve, 1001));

      tx.confirm();

      expect(tx.phase).toBe("Confirmed");
      expect(tx.updatedAt).toBeGreaterThan(originalTime);
    });

    it('should not update timestamp if phase is already "Confirmed"', () => {
      const data = createTestData();
      const tx = new KonduitTx(
        data.txHash,
        data.walletTag,
        "Confirmed", // Already confirmed
        data.steps,
        data.updatedAt,
      );

      const originalTime = tx.updatedAt;
      tx.confirm();

      expect(tx.phase).toBe("Confirmed");
      expect(tx.updatedAt).toBe(originalTime); // Timestamp should NOT change
    });
  });

  describe("failed", () => {
    it('should set phase to "Failed" and update timestamp', async () => {
      const data = createTestData();
      const tx = new KonduitTx(
        data.txHash,
        data.walletTag,
        "Pending",
        data.steps,
        data.updatedAt,
      );

      const originalTime = tx.updatedAt;

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1001));

      tx.failed();

      expect(tx.phase).toBe("Failed");
      expect(tx.updatedAt).toBeGreaterThan(originalTime);
    });

    it('should not update timestamp if phase is already "Failed"', () => {
      const data = createTestData();
      const tx = new KonduitTx(
        data.txHash,
        data.walletTag,
        "Failed", // Already failed
        data.steps,
        data.updatedAt,
      );

      const originalTime = tx.updatedAt;
      tx.failed();

      expect(tx.phase).toBe("Failed");
      expect(tx.updatedAt).toBe(originalTime); // Timestamp should NOT change
    });
  });

  describe("serialise/deserialise roundtrip", () => {
    it("should correctly serialise and deserialise a KonduitTx", () => {
      // 1. Create the original object
      const data = createTestData();
      const originalTx = new KonduitTx(
        data.txHash,
        data.walletTag,
        data.phase,
        data.steps,
        data.updatedAt,
      );

      // 2. Serialise
      const serialisedData = originalTx.serialise();

      // Check the plain object format
      expect(serialisedData).toEqual({
        txHash: data.txHash,
        walletTag: data.walletTag,
        phase: data.phase,
        steps: data.steps,
        updatedAt: data.updatedAt,
      });

      // 3. Deserialise
      const deserialisedTx = KonduitTx.deserialise(serialisedData);

      // 4. Verify
      expect(deserialisedTx).toBeInstanceOf(KonduitTx);
      expect(deserialisedTx).toEqual(originalTx); // Deep equality check
      expect(deserialisedTx.txHash).toBe(originalTx.txHash);
      expect(deserialisedTx.steps[1][1]).toBe("Add");
    });

    it("should throw an error for invalid serialised data", () => {
      const data = createTestData();
      const serialisedData = {
        txHash: data.txHash,
        walletTag: data.walletTag,
        // phase is missing
        steps: data.steps,
        updatedAt: data.updatedAt,
      };

      expect(() => KonduitTx.deserialise(serialisedData)).toThrow(
        "Invalid or incomplete data for KonduitTx deserialisation.",
      );
    });

    it("should throw an error for data with wrong types", () => {
      const data = createTestData();
      const serialisedData = {
        txHash: "not-a-uint8array", // Invalid type
        walletTag: data.walletTag,
        phase: data.phase,
        steps: data.steps,
        updatedAt: data.updatedAt,
      };

      expect(() => KonduitTx.deserialise(serialisedData)).toThrow(
        "Invalid or incomplete data for KonduitTx deserialisation.",
      );
    });
  });
});
