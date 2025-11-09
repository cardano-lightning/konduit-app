import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  L2Channel,
  ChequeError,
  L2ChannelUpdateSquashError,
} from "./l2Channel.js";

import { Cheque } from "./cheque.js";
import { ChequeBody } from "./chequeBody.js";
import { Squash } from "./squash.js";
import { SquashBody } from "./squashBody.js";
import { MixedReceipt } from "./mixedReceipt.js";
import { Stage } from "./stage.js";
import { L1Channel } from "./l1Channel.js";

// --- Mock Dependencies ---
// We tell Vitest to mock the modules that contain complex logic.
// This replaces the real Cheque, Squash, and MixedReceipt
// with mock constructors.
vi.mock("./cheque.js");
vi.mock("./squash.js");
vi.mock("./mixedReceipt.js");

// --- Test Setup ---

const mockInfo = {
  tag: new Uint8Array([1]),
  adaptorKey: new Uint8Array([2]),
  closePeriod: 100,
  adaptorUrl: new URL("http://example.com"),
  fee: 5,
};

const createDefaultL1 = () => new L1Channel(Stage.Opened(50), 1000);

const createDefaultSquash = () => {
  // Use real SquashBody
  const body = new SquashBody(100, 0, []);
  // Use mocked Squash constructor
  const squash = new Squash(body, new Uint8Array(64)); // Dummy sig
  // Add mock methods to the *instance*
  squash.verify = vi.fn(() => true);
  return squash;
};

const createDefaultChannel = () => {
  const l1 = createDefaultL1();
  const squash = createDefaultSquash();

  // Create a mock receipt instance that behaves like the old MockMixedReceipt
  const receipt = {
    squash: squash,
    mixedCheques: [],
    amount: vi.fn(() => squash.body.amount),
    committed: vi.fn(() => squash.body.amount),
    capacity: vi.fn(() => 10),
    insert: vi.fn((cheque) => {
      if (receipt.capacity() <= 0) throw new Error("Receipt is full");
      receipt.mixedCheques.push(cheque);
    }),
    update: vi.fn((newSquash) => {
      if (newSquash.body.index < receipt.squash.body.index) {
        throw new Error("Invalid squash index");
      }
      receipt.squash = newSquash;
      return true; // Return 'is_complete'
    }),
  };

  // Configure the mocked MixedReceipt.new static method to return our mock instance
  vi.mocked(MixedReceipt.new).mockReturnValue(receipt);

  const channel = new L2Channel(mockInfo, l1, receipt);
  return channel;
};

// --- Test Suites ---

describe("L2Channel", () => {
  beforeEach(() => {
    // Clear all mock call history before each test
    vi.mocked(Cheque).mockClear();
    vi.mocked(Squash).mockClear();
    vi.mocked(MixedReceipt).mockClear();
    if (MixedReceipt.new) {
      vi.mocked(MixedReceipt.new).mockClear();
    }
  });

  describe("Construction", () => {
    it("should construct with L2Channel.new", () => {
      const l1 = createDefaultL1();
      const channel = L2Channel.new(mockInfo, l1);
      expect(channel.info).toEqual(mockInfo);
      expect(channel.l1Channel).toEqual(l1);
      expect(channel.mixedReceipt).toBe(null);
    });

    it("should construct with L2Channel.fromChannels", () => {
      const l1_opened_100 = new L1Channel(Stage.Opened(0), 100);
      const l1_opened_500 = new L1Channel(Stage.Opened(0), 500);
      const l1_closed = new L1Channel(Stage.Closed(0, 0), 1000);

      const channel = L2Channel.fromChannels(mockInfo, [
        l1_opened_100,
        l1_closed,
        l1_opened_500,
      ]);

      expect(channel.l1Channel).toEqual(l1_opened_500);
    });
  });

  describe("Getters (owed, committed, capacity, available)", () => {
    it("should return correct owed amount", () => {
      const channel = createDefaultChannel();
      channel.mixedReceipt.amount.mockReturnValue(150);
      expect(channel.owed()).toBe(150);
    });

    it("should return 0 owed if no receipt", () => {
      const channel = L2Channel.new(mockInfo, createDefaultL1());
      expect(channel.owed()).toBe(0);
    });

    it("should return correct committed amount", () => {
      const channel = createDefaultChannel();
      channel.mixedReceipt.committed.mockReturnValue(170);
      expect(channel.committed()).toBe(170);
    });

    it("should return correct capacity", () => {
      const channel = createDefaultChannel();
      channel.mixedReceipt.capacity.mockReturnValue(8);
      expect(channel.capacity()).toBe(8);
    });

    it("should calculate available amount correctly", () => {
      // l1Channel = Stage.Opened(50), amount 1000
      // receipt.committed = 100
      // subbed = 50
      // committed = 100
      // rel_committed = 100 - 50 = 50
      // held = 1000
      // available = 1000 - 50 = 950
      const channel = createDefaultChannel();
      channel.mixedReceipt.committed.mockReturnValue(100); // Set explicitly
      expect(channel.available()).toBe(950);
    });

    it("should return 0 available if no mixedReceipt", () => {
      const channel = L2Channel.new(mockInfo, createDefaultL1());
      expect(channel.available()).toBe(0);
    });

    it("should return 0 available if no l1Channel", () => {
      const channel = createDefaultChannel();
      channel.l1Channel = null;
      expect(channel.available()).toBe(0);
    });

    it("should return 0 available if l1Channel is not Opened", () => {
      const channel = createDefaultChannel();
      channel.l1Channel.stage = Stage.Closed(50, 999);
      expect(channel.available()).toBe(0);
    });

    it("should return 0 available if committed < subbed (mimics)", () => {
      const channel = createDefaultChannel();
      channel.mixedReceipt.committed.mockReturnValue(40); // 40 < 50
      expect(channel.available()).toBe(0);
    });

    it("should return 0 available if rel_committed > held (mimics)", () => {
      const channel = createDefaultChannel();
      channel.l1Channel.amount = 30; // held = 30
      channel.mixedReceipt.committed.mockReturnValue(100); // 100
      // rel_committed = 100 - 50 = 50
      // 50 > 30, so available = 0
      expect(channel.available()).toBe(0);
    });
  });

  describe("updateFromL1", () => {
    it("should pick the best L1 channel", () => {
      const channel = createDefaultChannel();
      channel.mixedReceipt.amount.mockReturnValue(100); // owed = 100
      // subbed = 50, so (owed - subbed) = 50

      // (min(owed - subbed, amount), amount)
      // l1_a: (min(50, 100), 100) -> (50, 100)
      const l1_a = new L1Channel(Stage.Opened(50), 100);
      // l1_b: (min(50, 20), 20) -> (20, 20)
      const l1_b = new L1Channel(Stage.Opened(50), 20);
      // l1_c: (min(50, 500), 500) -> (50, 500)
      const l1_c = new L1Channel(Stage.Opened(50), 500);
      // l1_d: (0, 0)
      const l1_d = new L1Channel(Stage.Closed(50, 999), 9999);

      channel.updateFromL1([l1_a, l1_b, l1_c, l1_d]);
      // l1_c is best: (50, 500) beats (50, 100) on 2nd key
      expect(channel.l1Channel).toEqual(l1_c);
    });
  });

  describe("addCheque", () => {
    it("should add a valid cheque", () => {
      const channel = createDefaultChannel();
      // Use real ChequeBody, mocked Cheque
      const body = new ChequeBody(1, 100, 10, new Uint8Array(32).fill(3));
      const cheque = new Cheque(body, new Uint8Array(64)); // Dummy sig
      cheque.body = body;
      cheque.verify = vi.fn(() => true); // Mock verify on the instance

      channel.addCheque(cheque, 20); // current time = 20
      expect(channel.mixedReceipt.insert).toHaveBeenCalledWith(cheque);
    });

    it("should throw on bad signature", () => {
      const channel = createDefaultChannel();
      const body = new ChequeBody(1, 100, 10, new Uint8Array(32).fill(3));
      const cheque = new Cheque(body, new Uint8Array(64));
      cheque.body = body;
      cheque.verify.mockReturnValue(false); // Signature is bad
      expect(() => channel.addCheque(cheque, 20)).toThrow("ChequeError");
    });

    it("should throw if expires too soon", () => {
      const channel = createDefaultChannel();
      const body = new ChequeBody(1, 100, 30, new Uint8Array(32).fill(3));
      const cheque = new Cheque(body, new Uint8Array(64));
      cheque.verify = vi.fn(() => true);
      expect(() => channel.addCheque(cheque, 20)).toThrow("ChequeError");
    });

    it("should throw if no l1Channel", () => {
      const channel = createDefaultChannel();
      channel.l1Channel = null;
      const body = new ChequeBody(1, 100, 10, new Uint8Array(32).fill(3));
      const cheque = new Cheque(body, new Uint8Array(64));
      cheque.verify = vi.fn(() => true);
      expect(() => channel.addCheque(cheque, 20)).toThrow("ChequeError");
    });

    it("should throw if no mixedReceipt", () => {
      const channel = L2Channel.new(mockInfo, createDefaultL1());
      const body = new ChequeBody(1, 100, 10, new Uint8Array(32).fill(3));
      const cheque = new Cheque(body, new Uint8Array(64));
      cheque.verify = vi.fn(() => true);
      expect(() => channel.addCheque(cheque, 20)).toThrow("ChequeError");
    });

    it("should throw if l1Channel not Opened", () => {
      const channel = createDefaultChannel();
      channel.l1Channel.stage = Stage.Responded();
      const body = new ChequeBody(1, 100, 10, new Uint8Array(32).fill(3));
      const cheque = new Cheque(body, new Uint8Array(64));
      cheque.verify = vi.fn(() => true);
      expect(() => channel.addCheque(cheque, 20)).toThrow("ChequeError");
    });

    it("should throw if amount unavailable", () => {
      const channel = createDefaultChannel();
      channel.l1Channel.amount = 1000;
      channel.mixedReceipt.committed.mockReturnValue(100);
      // available (per addCheque logic) = max(100-50, 1000) = 1000

      const cheque_ok_body = new ChequeBody(
        1,
        1001,
        10,
        new Uint8Array(32).fill(4),
      );
      const cheque_ok = new Cheque(cheque_ok_body, new Uint8Array(64));
      cheque_ok.verify = vi.fn(() => true);
      expect(() => channel.addCheque(cheque_ok, 20)).not.toThrow("ChequeError");

      const cheque_bad_body = new ChequeBody(
        1,
        999,
        10,
        new Uint8Array(32).fill(4),
      );
      const cheque_bad = new Cheque(cheque_bad_body, new Uint8Array(64));
      cheque_bad.verify = vi.fn(() => true);
      // This will throw AmountUnavailable because 1000 > 999
      expect(() => channel.addCheque(cheque_bad, 20)).toThrow("ChequeError");
    });
  });

  describe("updateSquash", () => {
    it("should update squash on an initiated channel", () => {
      const channel = createDefaultChannel();
      const body = new SquashBody(200, 1, []);
      const newSquash = new Squash(body, new Uint8Array(64));
      newSquash.verify = vi.fn(() => true); // mock instance verify
      const result = channel.updateSquash(newSquash);

      expect(channel.mixedReceipt.update).toHaveBeenCalledWith(newSquash);
      expect(result).toBe(true);
    });

    it("should initialize receipt if none exists", () => {
      const channel = L2Channel.new(mockInfo, createDefaultL1());
      expect(channel.mixedReceipt).toBe(null);

      const body = new SquashBody(100, 0, []);
      const newSquash = new Squash(body, new Uint8Array(64));
      newSquash.verify = vi.fn(() => true);

      // We need to mock MixedReceipt.new for this test
      const newReceipt = { squash: newSquash, mixedCheques: [] };
      vi.mocked(MixedReceipt.new).mockReturnValue(newReceipt);

      const result = channel.updateSquash(newSquash);

      expect(result).toBe(true);
      expect(channel.mixedReceipt).toEqual(newReceipt);
      expect(vi.mocked(MixedReceipt.new)).toHaveBeenCalledWith(newSquash, []);
    });

    it("should throw on bad signature", () => {
      const channel = createDefaultChannel();
      const body = new SquashBody(200, 1, []);
      const newSquash = new Squash(body, new Uint8Array(64));
      newSquash.verify.mockReturnValue(false); // Bad signature
      expect(() => channel.updateSquash(newSquash)).toThrow(
        "L2ChannelUpdateSquashError",
      );
    });

    it("should throw if no l1Channel", () => {
      const channel = createDefaultChannel();
      channel.l1Channel = null;
      const body = new SquashBody(200, 1, []);
      const newSquash = new Squash(body, new Uint8Array(64));
      newSquash.verify = vi.fn(() => true);
      expect(() => channel.updateSquash(newSquash)).toThrow(
        "L2ChannelUpdateSquashError",
      );
    });

    it("should throw if l1Channel not Opened", () => {
      const channel = createDefaultChannel();
      channel.l1Channel.stage = Stage.Closed(0, 0);
      const body = new SquashBody(200, 1, []);
      const newSquash = new Squash(body, new Uint8Array(64));
      newSquash.verify = vi.fn(() => true);
      expect(() => channel.updateSquash(newSquash)).toThrow(
        "L2ChannelUpdateSquashError",
      );
    });

    it("should forward errors from mixedReceipt.update", () => {
      const channel = createDefaultChannel();
      channel.mixedReceipt.update.mockImplementation(() => {
        throw new Error("MixedReceiptUpdateError");
      });
      const body = new SquashBody(200, 1, []);
      const newSquash = new Squash(body, new Uint8Array(64));
      newSquash.verify = vi.fn(() => true);
      expect(() => channel.updateSquash(newSquash)).toThrow(
        "L2ChannelUpdateSquashError",
      );
    });
  });
});
