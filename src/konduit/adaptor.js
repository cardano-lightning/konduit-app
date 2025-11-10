import * as casing from "../utils/casing.js";
import * as hex from "../utils/hex.js";
import { AdaptorInfo } from "./adaptorInfo.js";
/**
 * Adaptor client:
 * We assume one client per channel
 */
export class Adaptor {
  /**
   * @param {Uint8Array<ArrayBufferLike>} keytag
   * @param {string}  baseUrl
   */
  constructor(keytag, baseUrl) {
    // Ensure base URL doesn't have a trailing slash
    this.keytag = keytag;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    console.log(`Adaptor initialized for base URL: ${this.baseUrl}`);
  }

  /**
   * Private helper function to handle fetch requests.
   * @param {string} endpoint - The API endpoint (e.g., '/info/').
   * @param {object} options - Standard Fetch API options.
   * @returns {Promise<object>} - The JSON response from the API.
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth header if it's a /ch endpoint and keytag is set
    if (endpoint.startsWith("/ch/") && this.keytag) {
      headers["KONDUIT"] = hex.encode(this.keytag);
    }

    const fetchOptions = {
      headers: headers,
      ...options,
    };

    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: "Failed to parse error response." };
        }

        throw new Error(
          JSON.stringify(
            {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              error: errorData,
            },
            null,
            2,
          ),
        );
      }

      // Handle responses with no content
      if (response.status === 204) {
        return { status: 204, message: "No Content" };
      }

      // Parse the JSON response
      return await response.json().then(casing.keysToCamel);
    } catch (error) {
      console.error("API Request Error:", error.message);
      // Re-throw the structured error
      throw error;
    }
  }
  /**
   * Private helper function to handle fetch requests with a binary (octet-stream) body.
   * Assumes a JSON response.
   * @param {string} endpoint - The API endpoint (e.g., '/ch/').
   * @param {Uint8Array | ArrayBuffer} binaryData - The binary data to send as the request body.
   * @param {object} options - Standard Fetch API options (e.g., { method: 'POST' }).
   * @returns {Promise<object>} - The JSON response from the API.
   */
  async _requestBinary(endpoint, binaryData, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    // Set headers, enforcing octet-stream.
    // User can still pass other headers (e.g., 'X-Custom-Header') via options.
    const headers = {
      ...options.headers,
      "Content-Type": "application/octet-stream",
    };

    // Add auth header if it's a /ch endpoint and keytag is set
    if (endpoint.startsWith("/ch/") && this.keytag) {
      headers["konduit"] = hex.encode(this.keytag);
      console.log(hex.encode(this.keytag));
    }

    const fetchOptions = {
      ...options, // e.g., method: 'POST'
      headers: headers,
      body: binaryData, // Set the binary data as the body
    };

    try {
      const response = await fetch(url, fetchOptions);

      // --- All response handling logic is identical to _request ---

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: "Failed to parse error response." };
        }

        throw new Error(
          JSON.stringify(
            {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              error: errorData,
            },
            null,
            2,
          ),
        );
      }

      // Handle responses with no content
      if (response.status === 204) {
        return { status: 204, message: "No Content" };
      }

      // Parse the JSON response
      return await response.json().then(casing.keysToCamel);
    } catch (error) {
      console.error("API Request Error:", error.message);
      // Re-throw the structured error
      throw error;
    }
  }

  // --- Public Endpoints ---

  /**
   * Fetches /info/
   * @returns {Promise<AdaptorInfo>}
   */
  async info() {
    console.log("Calling GET /info");
    const res = await this._request("/info", { method: "GET" });
    return new AdaptorInfo(
      hex.decode(res.adaptorKey),
      res.closePeriod,
      res.fee,
      res.maxTagLength,
      hex.decode(res.deployerVkey),
      hex.decode(res.scriptHash),
      this.baseUrl,
    );
  }

  // --- Optional Endpoints ---

  /**
   * Fetches /opt/fx
   * @returns {Promise<object>}
   */
  getFx() {
    console.log("Calling GET /opt/fx");
    return this._request("/opt/fx", { method: "GET" });
  }

  // --- Channel Endpoints (Auth Required) ---

  /**
   * Calls /ch/squash. (Assuming POST)
   * @param {import("./squash.js").Squash} squash - The squash
   * @returns {Promise<object>}
   */
  chSquash(squash) {
    console.log("Calling POST /ch/squash");
    if (!this.keytag) {
      return Promise.reject(
        new Error("Keytag not set. Cannot call /ch/squash."),
      );
    }
    return this._requestBinary("/ch/squash", squash.toCbor(), {
      method: "POST",
    });
  }

  /**
   * Calls /ch/quote. (Assuming POST)
   * @param {object} quoteData - The data to send in the body.
   * @returns {Promise<object>}
   */
  chQuote(quoteData = {}) {
    console.log("Calling POST /ch/quote");
    if (!this.keytag) {
      return Promise.reject(
        new Error("Keytag not set. Cannot call /ch/quote."),
      );
    }
    return this._request("/ch/quote", {
      method: "POST",
      body: JSON.stringify(quoteData),
    });
  }
}
