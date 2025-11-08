import { describe, it, expect } from "vitest";
import { bech32 } from "bech32";

import * as hex from "../utils/hex.js";

import { toVerificationKey } from "./keys.js";
import { verificationKeyToAddress } from "./address.js";
import { networkTypes } from "./network.js";

describe("verificationKeyToAddress", () => {
  it("should make address", () => {
    const skey =
      "0000000000000000000000000000000000000000000000000000000000000000";
    const expectedAddress =
      "addr_test1vr9exkzjnh6898pjg632qv7tnqs6h073dhjg3qq9jp9tcsg8d6n35";
    const vkey = toVerificationKey(hex.decode(skey));
    const generatedAddress = verificationKeyToAddress(
      networkTypes.PREPROD,
      vkey,
    );
    expect(generatedAddress).toBe(expectedAddress);
  });

  it("should correctly generate a MAINNET address from a bech32 verification key", () => {
    const vkBech32 =
      "addr_vk1w0l2sr2zgfm26ztc6nl9xy8ghsk5sh6ldwemlpmp9xylzy4dtf7st80zhd";
    const expectedAddress =
      "addr1vx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzers66hrl8";

    const { words: vkWords } = bech32.decode(vkBech32, 100);
    const verificationKeyBytes = new Uint8Array(bech32.fromWords(vkWords));

    const generatedAddress = verificationKeyToAddress(
      networkTypes.MAINNET,
      verificationKeyBytes,
    );
    expect(generatedAddress).toBe(expectedAddress);
  });

  it("should correctly generate a PREPROD address from a bech32 verification key", () => {
    const vkBech32 =
      "addr_vk1w0l2sr2zgfm26ztc6nl9xy8ghsk5sh6ldwemlpmp9xylzy4dtf7st80zhd";
    const expectedAddress =
      "addr_test1vz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzerspjrlsz";

    const { words: vkWords } = bech32.decode(vkBech32, 100);
    const verificationKeyBytes = new Uint8Array(bech32.fromWords(vkWords));

    const generatedAddress = verificationKeyToAddress(
      networkTypes.PREPROD,
      verificationKeyBytes,
    );
    expect(generatedAddress).toBe(expectedAddress);
  });

  it("should correctly generate a TESTNET address (with addr_test hrp)", () => {
    const vkBech32 =
      "addr_vk1w0l2sr2zgfm26ztc6nl9xy8ghsk5sh6ldwemlpmp9xylzy4dtf7st80zhd";
    const { words: vkWords } = bech32.decode(vkBech32, 100);
    const verificationKeyBytes = new Uint8Array(bech32.fromWords(vkWords));
    const generatedAddress = verificationKeyToAddress(
      networkTypes.PREPROD,
      verificationKeyBytes,
    );
    expect(generatedAddress.startsWith("addr_test1")).toBe(true);
    expect(generatedAddress).not.toBe(
      "addr1vx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzers66hrl8",
    );
  });
});
