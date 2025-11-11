import wasm from "../utils/wasm-loader.js";
import * as hex from "../utils/hex.js";
import { L1Channel } from "../konduit/l1Channel.js";
import { Channel } from "../konduit/channel.js";
import { Squash } from "../konduit/squash.js";
import {
  cardanoConnector,
  signingKey,
  verificationKey,
  channelsAppend,
  txsAppend,
} from "../store.js";
import { KonduitTx } from "../konduit/konduitTx.js";

const ADA = 1_000_000;
const MIN_ADA_BUFFER = BigInt(2e6);
/**
 *
 *
 * */

// FOR TESTING PURPOSES ONLY
const createDummyPromise = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("test");
    }, 1000);
  });
};

/**
 * @param {string} text
 */
export function extractTxId(text) {
  const match = text.match(/id = ([a-f0-9]+)/);
  return match ? match[1] : null;
}

/**
 * @param {import("../konduit/adaptorInfo.js").AdaptorInfo} adaptorInfo
 * @param {Uint8Array<ArrayBufferLike>} tag
 * @param {number} amount_ada - DOES NOT INCLUDE MIN_ADA_BUFFER
 */
export async function open(adaptorInfo, tag, amount_ada) {
  console.log("OPEN");
  const connector = await cardanoConnector.value;
  const vkey = /** @type {!Uint8Array} */ (verificationKey.value);
  const adaptorKey = adaptorInfo.adaptorKey;
  const closePeriod = BigInt(adaptorInfo.closePeriod);
  const amount = amount_ada * ADA;

  const transaction = await wasm((w) =>
    w.open(
      // Cardano's connector backend
      connector,
      // tag: An (ideally) unique tag to discriminate channels and allow reuse of keys between them.
      tag,
      // consumer: Consumer's verification key, allowed to *add* funds.
      vkey,
      // adaptor: Adaptor's verification key, allowed to *sub* funds
      adaptorKey,
      // close_period: Minimum time from `close` to `elapse`, in seconds.
      closePeriod,
      // deposit: Quantity of Lovelace to deposit into the channel
      BigInt(amount) + MIN_ADA_BUFFER,
    ),
  );

  // THIS IS A HACK
  const txHash = hex.decode(extractTxId(transaction.toString()) || "");
  // THIS IS A GUESS
  const outputIndex = 0;
  const l1 = L1Channel.open(txHash, outputIndex, amount);
  const skey = /** @type {!Uint8Array} */ (signingKey.value);
  const squash = Squash.makeZero(skey, tag);
  const channel = Channel.open(vkey, tag, adaptorInfo, l1, squash);

  const tx = new KonduitTx(txHash, "Facilitate", "Pending", [[tag, "Open"]]);
  connector.signAndSubmit(transaction, signingKey.value).then(
    // createDummyPromise().then (
    (res) => {
      // Update channels ref
      channelsAppend(channel);
      txsAppend(tx);
      return res;
    },
    (err) => {
      console.log("Something went wrong", err);
    },
  );
}
