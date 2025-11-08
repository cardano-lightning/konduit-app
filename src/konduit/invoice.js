import bolt11 from "bolt11";
import { bech32 } from "bech32";

/**
 * Extracts the first BOLT 11 invoice from a given string.
 *
 * A BOLT 11 invoice is a bech32-encoded string that typically starts with "lnbc" (mainnet),
 * "lntb" (testnet), or "lnbcrt" (regtest). It can also be prefixed with "lightning:".
 *
 * @param {string} text The input string that might contain an invoice.
 * @returns {string | null} The extracted BOLT 11 invoice string, or null if no match is found.
 */
function extractInvoice(text) {
  if (typeof text !== "string") {
    return null;
  }

  // This regex looks for an optional "lightning:" prefix (case-insensitive)
  // followed by the invoice itself, which starts with "ln" and is
  // followed by a mix of letters and numbers (bech32).
  // We capture the "ln..." part.
  const regex = /(?:lightning:)?(ln[a-z0-9]+)/i;
  const match = text.match(regex);
  // The captured group (the invoice) is at index 1.
  return match ? match[1] : null;
}

/**
 * Extracts the first LNURL from a given string.
 *
 * An LNURL is a bech32-encoded string that starts with "lnurl".
 * It can also be prefixed with "lightning:".
 *
 * @param {string} text The input string that might contain an LNURL.
 * @returns {string | null} The extracted LNURL string, or null if no match is found.
 */
function extractLnurl(text) {
  if (typeof text !== "string") {
    return null;
  }
  const regex = /(?:lightning:)?(lnurl[a-z0-9]+)/i;
  const match = text.match(regex);
  if (!match) {
    return null;
  } else {
    const candidate = match[1];
    try {
      console.log(candidate.toLowerCase());
      let bytes = bech32.fromWords(
        bech32.decode(candidate.toLowerCase(), Math.min(candidate.length, 200))
          .words,
      );
      const decoder = new TextDecoder("utf-8");
      const url = decoder.decode(new Uint8Array(bytes));
      return url;
    } catch (err) {
      console.log("Bech32 failed", err.toString());
    }
  }
}

// --- Examples ---

const str5 =
  "https://app.dfx.swiss/pl/?lightning=LNURL1DP68GURN8GHJ7CTSDYHXGENC9EEHW6TNWVHHVVF0D3H82UNVWQHHQMZLVFJK2ERYVG6RZCMYX33RVEPEV5YEJ9WT";

console.log(extractLnurl(str5));

/*
Expected Output:
String 1: lnurl1dp68gurn8ghj7mrww3uxymm59e3xjemnw4hzu7re0gcu8gcew3eexgim0v9k8gctv94fx2efsdfs
String 2: lnurl1dp68gurn8ghj7cm00e3k7mf09emk2mrv944k2ap0v9cxjttnw3shg6trd3jxkmnxveex7mr2dsasdasd
String 3: null
String 4: LNURL1DP68GURN8GHJ7
*/

var decoded = bolt11.decode(
  "lnbc20u1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppqw508d6qejxtdg4y5r3zarvary0c5xw7kxqrrsssp5m6kmam774klwlh4dhmhaatd7al02m0h0m6kmam774klwlh4dhmhs9qypqqqcqpf3cwux5979a8j28d4ydwahx00saa68wq3az7v9jdgzkghtxnkf3z5t7q5suyq2dl9tqwsap8j0wptc82cpyvey9gf6zyylzrm60qtcqsq7egtsq",
);
var x =
  "bitcoin:TB1QDY85K72CR9HP838XUAG49J746G3YVWUF7HDKWJ?lightning=LNTB358450N1P5SEGLDPP5N4FVHQ6UWMP4ZYUT2YCZJZ0GYHNRSN4M905C9U6QUC8XTG9KCW4QDQQCQZZSXQRRSSSP50W3ZDGELPSA7GLKHYRHYRC08453SMFZYHZJJP6APTGXZQ72NJTCQ9QXPQYSGQWAPG735S06SQMA76AQSQX5GLDQN2H9M94LTAMK744P9JQRTS4E0XUTP82ZJH3KMEPYUUTG5JZZS6DFW8HY9GRTQNRS3787QNZT3MEVQQFLD8MG&amount=0.00035845";
decoded = bolt11.decode(extractInvoice(x));

console.log(decoded);
