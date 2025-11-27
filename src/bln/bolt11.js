// @ts-nocheck
import { bech32 } from "@scure/base";
import * as secp from "@noble/secp256k1";
import * as bolt11 from "light-bolt11-decoder";
import * as hex from "../utils/hex.js";
import * as uint8Array from "../utils/uint8Array.js";
import { sha256 } from "@noble/hashes/sha2.js";

secp.hashes.sha256 = sha256;

/**
 * @typedef {Object} Invoice
 * @property {"bolt11"} type - "Bolt11"
 * @property {string} raw - The original invoice
 * @property {string} [currency] - The coin network (e.g., 'btc', 'tb') derived from the 'coin_network' section.
 * @property {bigint} [amount] - The amount of the payment in Satoshis.
 * @property {number} [timestamp] - The invoice creation timestamp (seconds since epoch).
 * @property {Uint8Array} [paymentHash] - The SHA256 hash of the payment preimage (decoded from hex).
 * @property {string} [description] - A free-form textual description of the payment.
 * @property {Uint8Array} [descriptionHash] - The SHA256 hash of the description (decoded from hex).
 * @property {number} [minFinalCltvExpiry] - The minimum CLTV delta for the final hop.
 * @property {number} [expiry] - The expiry time of the invoice in seconds.
 * @property {Uint8Array} [paymentSecret] - The payment secret (decoded from hex).
 * @property {any} [features] - The feature bits/flags associated with the invoice.
 * @property {Uint8Array} signature - The ECDSA signature over the invoice (decoded from hex).
 * @property {Uint8Array} payee - Payee pub key
 */

/**
 * @param {`${string}1${string}`} s
 * @retuns {Invoice}
 */
export function decode(s) {
  var invoice = {
    ...bolt11.decode(s).sections.reduce(fromSections, {}),
    type: "Bolt11",
    raw: s,
    payee: new Uint8Array([]),
  };
  invoice["payee"] = payee(s);
  return invoice;
}

/**
 * @param {{ bech32: string; }} value
 */
function fromCoinNetwork(value) {
  const prefix = value.bech32;
  if (prefix == "bc") {
    return "Bitcoin";
  } else if (prefix == "tb") {
    return "BitcoinTestnet";
  } else {
    return "Unknown";
  }
}
/**
 * Processes an array of invoice sections, accumulating key-value pairs into a single
 * invoice object. This function acts as a reducer for parsing BOLT-11 data.
 *
 * @typedef {import('light-bolt11-decoder').Section} Section - Assuming the previous Section union type is defined.
 * @typedef {Object} InvoiceAccumulator
 * @property {string} [currency] - Currency / network (bitcoin mainnet or testnet(s))
 * @property {bigint} [amount] - The amount of the payment in Satoshis.
 * @property {number} [timestamp] - The invoice creation timestamp (seconds since epoch).
 * @property {Uint8Array} [paymentHash] - The SHA256 hash of the payment preimage (decoded from hex).
 * @property {string} [description] - A free-form textual description of the payment.
 * @property {Uint8Array} [descriptionHash] - The SHA256 hash of the description (decoded from hex).
 * @property {number} [minFinalCltvExpiry] - The minimum CLTV delta for the final hop.
 * @property {number} [expiry] - The expiry time of the invoice in seconds.
 * @property {Uint8Array} [paymentSecret] - The payment secret (decoded from hex).
 * @property {any} [features] - The feature bits/flags associated with the invoice.
 * @property {any[]} [routeHint] - Route hint
 * @property {Uint8Array} [signature] - The ECDSA signature over the invoice (decoded from hex).
 */

/**
 * Parses individual invoice sections and accumulates them into a structured object.
 *
 * @param {InvoiceAccumulator} acc - The accumulator object containing the parsed invoice data so far.
 * @param {Section} curr - The current section object being processed, containing 'name', 'value', and other properties.
 * @returns {InvoiceAccumulator} The updated accumulator object.
 */

function fromSections(acc, curr) {
  const { name } = curr;
  if (
    ["lightning_network", "separator", "fallback_address", "checksum"].includes(
      name,
    )
  ) {
    return acc;
  }
  const { value } = curr;
  if (name == "coin_network") {
    acc["currency"] = fromCoinNetwork(value);
  } else if (name == "amount") {
    acc["amount"] = BigInt(value);
  } else if (name == "timestamp") {
    acc["timestamp"] = value * 1000;
  } else if (name == "payment_hash") {
    acc["paymentHash"] = hex.decode(value);
  } else if (name == "description") {
    acc["description"] = value;
    // @ts-ignore: the typing on dependency is incorrect
  } else if (name == "description_hash") {
    acc["descriptionHash"] = value;
  } else if (name == "min_final_cltv_expiry") {
    acc["minFinalCltvExpiry"] = value;
  } else if (name == "expiry") {
    acc["expiry"] = value * 1000;
  } else if (name == "payment_secret") {
    acc["paymentSecret"] = hex.decode(value);
  } else if (name == "feature_bits") {
    acc["features"] = value;
  } else if (name == "signature") {
    acc["signature"] = hex.decode(value);
  } else if (name == "route_hint") {
    acc["routeHint"] = value;
  } else {
    console.log("EXCLUDED", name, value);
  }
  return acc;
}

/**
 * @param {string} invoice
 * @returns {Uint8Array}
 */
function payee(invoice) {
  const b32 = bech32.decode(invoice, false);

  const encoder = new TextEncoder();
  const prefix = encoder.encode(b32.prefix);

  const SIGNATURE_WORDS = 104;
  const sigEndRecId = new Uint8Array(
    convert(b32.words.slice(-SIGNATURE_WORDS), 5, 8, false),
  );
  const signature = new Uint8Array([
    ...sigEndRecId.slice(-1),
    ...sigEndRecId.slice(0, 64),
  ]);

  const data = new Uint8Array(
    convert(b32.words.slice(0, -SIGNATURE_WORDS), 5, 8, true),
  );

  const message = uint8Array.concat([prefix, data]);
  const publicKey = secp.recoverPublicKey(signature, message);
  if (!publicKey) throw new Error("Public key recovery failed.");
  return publicKey;
}

/**
 * Convert inBits-words to outBits words
 * Based on function from bech32 lib.
 * However it is not exported, and we need `pad`.
 * We use only inBits = 5, outBits = 8.
 *
 * @param {string | any[]} data
 * @param {number} inBits
 * @param {number} outBits
 * @param {boolean} pad
 */
export function convert(data, inBits, outBits, pad) {
  var value = 0;
  var bits = 0;
  var maxV = (1 << outBits) - 1;

  var result = [];
  for (var i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i];
    bits += inBits;

    while (bits >= outBits) {
      bits -= outBits;
      result.push((value >> bits) & maxV);
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((value << (outBits - bits)) & maxV);
    }
  } else {
    if (bits >= inBits) {
      throw new Error("Excess padding");
    }
    if ((value << (outBits - bits)) & maxV) {
      throw new Error("Non-zero padding");
    }
  }
  return result;
}
