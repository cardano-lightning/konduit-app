import * as bolt11 from "bolt11";
import { bech32 } from "bech32";

/**
 * Extracts the first BOLT 11 invoice from a given string.
 * @param {string} text The input string that might contain an invoice.
 * @returns {string | null} The extracted BOLT 11 invoice string, or null if no match is found.
 */
function extractInvoice(text) {
  if (typeof text !== "string") {
    return null;
  }
  const regex = /(?:lightning:)?(ln[a-z0-9]+)/i;
  const match = text.match(regex);
  return match ? match[1] : null;
}

/**
 * Extracts and decodes the first LNURL from a given string.
 * @param {string} text The input string that might contain an LNURL.
 * @returns {{url: string, raw: string} | null} An object with the decoded URL and raw LNURL, or null.
 */
function extractLnurl(text) {
  if (typeof text !== "string") {
    return null;
  }
  const regex = /(?:lightning:)?(lnurl[a-z0-9]+)/i;
  const match = text.match(regex);
  if (!match) {
    return null;
  }

  const rawLnurl = match[1];
  try {
    const decoded = bech32.decode(rawLnurl.toLowerCase(), 2000); // 2000 = large max length
    const bytes = bech32.fromWords(decoded.words);
    const decoder = new TextDecoder("utf-8");
    const url = decoder.decode(new Uint8Array(bytes));
    return { url, raw: rawLnurl };
  } catch (err) {
    console.error("Bech32 failed", err.toString());
    return null;
  }
}

/**
 * Parses a string to find either a BOLT 11 invoice or an LNURL.
 * This is a synchronous function.
 *
 * @param {string} rawText The raw input from the user.
 * @returns {object} A parsed object with a 'type' field ('bolt11' or 'lnurl').
 * @throws {Error} If the input is not a valid invoice or LNURL.
 */
export const parsePayRequest = (rawText) => {
  // First, try to parse as a BOLT11 invoice
  const rawInvoice = extractInvoice(rawText);
  if (rawInvoice) {
    try {
      const decoded = bolt11.decode(rawInvoice);
      const getTag = (tagName) =>
        decoded.tags.find((t) => t.tagName === tagName)?.data;
      const expiryTimestamp =
        (decoded.timestamp + (getTag("expire_time") || 3600)) * 1000;

      return {
        type: "bolt11",
        raw: rawInvoice.toLowerCase(),
        amount:
          decoded.satoshis ||
          (decoded.millisatoshis
            ? Number(BigInt(decoded.millisatoshis) / 1000n)
            : 0),
        description: getTag("description"),
        payee: decoded.payeeNodeKey,
        expiry: expiryTimestamp,
        hash: getTag("payment_hash"),
        paymentSecret: getTag("payment_secret"),
        finalCltvDelta: getTag("min_final_cltv_expiry"),
      };
    } catch (e) {
      // It looked like an invoice but failed to parse.
      // Continue to check if it's an LNURL.
      console.warn("Failed to parse as BOLT11, checking LNURL.", e.message);
    }
  }

  // If not a valid BOLT11, try to parse as an LNURL
  const lnurlData = extractLnurl(rawText);
  if (lnurlData) {
    return {
      type: "lnurl",
      raw: lnurlData.raw,
      url: lnurlData.url,
    };
  }

  // If neither, throw an error
  throw new Error("Not a valid BOLT11 invoice or LNURL.");
};
