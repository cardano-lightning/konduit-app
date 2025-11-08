import * as cbor from "./cbor.js";
import * as hex from "./hex.js";
import * as keys from "./keys.js";
import { ChequeBody } from "./data/chequeBody.js";
import { Squash } from "./data/squash.js";
import { QuoteResponse as Quote } from "./adaptor.js";

/**
 * @typedef {"Opened" | "Closed" | "Responded"} ChannelStatus
 * Represents the distinct states a channel can be in.
 * We are currently only interested in "Opened" vs "Not Opened"
 */

/**
 * Defines the interface for a database connection object.
 *
 * @typedef {object} DbConnection
 * @property {function(string): Promise<object|null>} get - An async method
 * @property {function(string, object): Promise<null>} put - An async method
 * that fetches a record by its ID. It resolves to the found
 * object or null if no record is found.
 */

/**
 * @typedef {object} PayResult
 * @property {'Ok' | 'Ko' | 'Pending'} status
 * @property {any} [value] - The secret if 'Ok', or error if 'Ko'
 */

class Channel {
  /**
   * Creates a new Channel instance.
   * @param {Uint8Array} tag - The channel's unique tag.
   * @param {Uint8Array} adaptorKey - The adaptor key.
   * @param {number} closePeriod - The closing period.
   * @param {URL} adaptorUrl - The URL of the adaptor.
   * @param {ChannelStatus} status - The current status of the channel.
   * @param {number} index - The channel index.
   * @param {number} underwritten - The underwritten amount.
   * @param {number} committed - The committed amount.
   */
  constructor(
    tag,
    adaptorKey,
    closePeriod,
    adaptorUrl,
    status,
    index,
    underwritten,
    committed,
  ) {
    this.tag = tag;
    this.adaptorKey = adaptorKey;
    this.closePeriod = closePeriod;
    this.adaptorUrl = adaptorUrl;
    this.status = status;
    this.index = index;
    this.underwritten = underwritten;
    this.committed = committed;

    console.log(
      `Channel ${this.index} created with tag: ${this.tag.toString()}`,
    );
  }

  dbKey() {
    return hex.encode(this.tag);
  }

  /**
   * Creates a new Channel instance assuming certain initial conditions.
   * Will pull details from the adaptor
   * @param {Uint8Array} tag - The channel's unique tag.
   * @param {URL} adaptorUrl - The URL of the adaptor.
   * @param {number} underwritten - The underwritten amount.
   */
  static async open(tag, adaptorUrl, underwritten) {
    adaptor.constants(adaptorUrl).then(({ adaptorKey, closePeriod }) => {
      const status = "Opened";
      const index = 0;
      const committed = 0;
      return new Channel(
        tag,
        adaptorKey,
        closePeriod,
        adaptorUrl,
        status,
        index,
        underwritten,
        committed,
      );
    });
  }

  /**
   * Creates a new Channel instance assuming certain initial conditions.
   * @param {Uint8Array} tag - The channel's unique tag.
   * @param {Uint8Array} adaptorKey - The adaptor key.
   * @param {number} closePeriod - The closing period.
   * @param {URL} adaptorUrl - The URL of the adaptor.
   * @param {number} underwritten - The underwritten amount.
   */
  static opened(tag, adaptorKey, closePeriod, adaptorUrl, underwritten) {
    const status = "Opened";
    const index = 0;
    const committed = 0;
    return new Channel(
      tag,
      adaptorKey,
      closePeriod,
      adaptorUrl,
      status,
      index,
      underwritten,
      committed,
    );
  }

  /**
   * Asynchronous alternative constructor to load a channel from a database.
   * @param {DbConnection} conn - The tag of the channel to load.
   * @returns { Promise<void> } A promise that resolves to a new Channel instance.
   */
  async toDb(conn) {
    return conn.put(this.dbKey(), {
      tag: hex.encode(this.tag),
      adaptorKey: hex.encode(this.adaptorKey),
      closePeriod: this.closePeriod,
      adaptorUrl: this.adaptorUrl,
      status: this.status,
      index: this.index,
      underwritten: this.underwritten,
      committed: this.committed,
    });
  }

  /**
   * Asynchronous alternative constructor to load a channel from a database.
   * @param {DbConnection} conn - The tag of the channel to load.
   * @param {Uint8Array} tag - The tag of the channel to load.
   * @returns {Promise<Channel>} A promise that resolves to a new Channel instance.
   */
  static async fromDB(conn, dbKey) {
    return conn.get(dbKey).then(
      (res) => {
        const {
          tag,
          adaptorKey,
          closePeriod,
          adaptorUrl,
          status,
          index,
          underwritten,
          committed,
        } = res;
        return new Channel(
          hex.decode(tag),
          hex.decode(adaptorKey),
          closePeriod,
          adaptorUrl,
          status,
          index,
          underwritten,
          committed,
        );
      },
      (err) => {
        throw Error("Something went wrong");
      },
    );
  }

  /**
   * Gets a quote from the adaptor.
   * @param {any} payload - The payload to send for the quote request.
   * @returns {Promise<Quote>} A promise that resolves to a Quote.
   */
  async getQuote(payload) {
    return adaptor.getQuote(this.adaptorUrl, payload);
  }

  /**
   * Creates a new ChequeBody.
   * @param {number} amount - The amount for the cheque.
   * @param {number} timeout - The timeout for the cheque.
   * @param {Uint8Array} lock - The lock condition for the cheque.
   * @returns {ChequeBody} A new ChequeBody object.
   */
  chequeBody(amount, timeout, lock) {
    if (amount > this.underwritten - this.committed) {
      alert("Cheque amount exceeds available uncommitted funds.");
    }
    this.committed += amount;
    this.index += 1;
    return new ChequeBody(this.index, amount, timeout, lock);
  }

  /**
   * Processes a payment using a cheque and route info.
   * @param {Cheque} cheque - The cheque to be paid.
   * @param {any} RouteInfo - Routing information for the payment.
   * @returns {Promise<PayResult>} A promise resolving to the payment result.
   */
  async pay(cheque, routeInfo) {
    return adaptor.pay(this.adaptorUrl, cheque, routeInfo).then((res) => {
      if (res.status == 200) {
        return res.json().then(({ secret }) => {
          // VERIFY SECRET
        });
        return { status: "Ok", value: mockSecret };
      } else if (random < 0.9) {
        // Failure
        return { status: "Ko", value: new Error("Something went wrong") };
      } else {
        // Pending
        return { status: "Pending" };
      }
    });
  }

  /**
   * Applies a squash operation to the channel state.
   * @param {Squash} squash - The squash operation to apply.
   * @param {UnlockedCheques} unlockedCheques - Cheques that have been unlocked.
   * @param {number[]} integers - An array of integers (purpose specified by your protocol).
   * @returns {Squash} A new Squash object representing the result.
   */
  squashBody(squash, unlockedCheques, integers) {
    throw Error("Not yet implemented");
  }
}
