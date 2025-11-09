import { ref, watch, computed } from "vue";
import { openDB } from "idb";
import * as keys from "./cardano/keys.js";
import { networkTypes } from "./cardano/network.js";
import * as hex from "./utils/hex.js";
import wasm from "./utils/wasm-loader.js";

/** @constant {string} The name of the IndexedDB database. */
const DB_NAME = "db";
/** @constant {string} The name of the object store within the database. */
const STORE_NAME = "kv";
/** @constant {number} The version of the database schema. */
const DB_VERSION = 1;

/**
 * Initializes and opens the IndexedDB database.
 * Sets up the object store if it doesn't exist.
 * Includes handlers for database blocking.
 * @returns {Promise<import('idb').IDBPDatabase>} A promise that resolves with the database instance.
 */
async function initDb() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    /**
     * Called when the database version changes or the DB is created.
     * @param {import('idb').IDBPDatabase} db - The database instance.
     */
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
    /**
     * Called when a newer version of the DB is trying to open, but this connection is still open.
     */
    blocking() {
      console.warn("Database is outdated. Closing connection...");
      db.close();
    },
    /**
     * Called when this connection is blocked from opening by another open connection.
     */
    blocked() {
      console.error("Database connection is blocked. Please close other tabs.");
      // NOTE: alert() is generally discouraged in modern web apps, but we keep it as it was in the original code.
      alert(
        "Database connection is blocked. Please close all other tabs running this site and reload.",
      );
    },
  });
  return db;
}

/**
 * A promise that resolves to the initialized IndexedDB instance.
 * @type {Promise<import('idb').IDBPDatabase>}
 */
const db = initDb();

/**
 * Retrieves a value from the database store by its key.
 * @param {string} key - The key of the item to retrieve.
 * @returns {Promise<any>} A promise that resolves with the stored value, or undefined if not found.
 */
export async function get(key) {
  return (await db).get(STORE_NAME, key);
}

/**
 * Sets (adds or updates) a value in the database store.
 * @param {string} key - The key of the item to set.
 * @param {any} val - The value to store.
 * @returns {Promise<IDBValidKey>} A promise that resolves with the key of the stored item.
 */
export async function set(key, val) {
  return (await db).put(STORE_NAME, val, key);
}

/**
 * Deletes a value from the database store by its key.
 * @param {string} key - The key of the item to delete.
 * @returns {Promise<void>} A promise that resolves when the item is deleted.
 */
export async function del(key) {
  return (await db).delete(STORE_NAME, key);
}

/**
 * Clears all items from the database store.
 * @returns {Promise<void>} A promise that resolves when the store is cleared.
 */
export async function clear() {
  return (await db).clear(STORE_NAME);
}

// export async function keys() {
//    return (await db).getAllKeys(STORE_NAME);
// }

/**
 * Loads a value from the database and sets it to a Vue ref.
 * If the value is undefined in the DB, the ref is not modified.
 * @param {string} label - The key to retrieve from the database.
 * @param {import('vue').Ref<any>} ref - The Vue ref to update with the loaded value.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function fromDb(label, ref) {
  return get(label).then((x) => {
    if (typeof x !== "undefined") {
      ref.value = x;
    }
  });
}

/**
 * Persists a value to the database.
 * If the value is null or undefined, the key is deleted from the database.
 * @param {string} label - The key to set or delete in the database.
 * @param {any} value - The value to store.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function toDb(label, value) {
  if (value != null) {
    set(label, value);
  } else {
    del(label);
  }
}

/**
 * App state represents top level state.
 * App starts in `appStates.load`
 * TODO :: Rationalize whether this is really what we want
 *
 * @enum {number} Defines the possible high-level states of the application.
 */
export const appStates = {
  /** Initial loading state. */
  load: 0,
  /** State after loading, before running (e.g., setup). */
  launch: 1,
  /** Main running state of the app. */
  run: 2,
};

/**
 * The reactive holder for the current application state.
 * @type {import('vue').Ref<number>}
 */
export const appState = ref(appStates.load);

/**
 * Keys
 * */

/** @constant {string} The database key for storing the signing key. */
const signingKeyLabel = "signingKey";

/**
 * The reactive holder for the user's signing key.
 * Assumed to be a Uint8Array when set.
 * @type {import('vue').Ref<Uint8Array | null>}
 */
export const signingKey = ref(null);

/**
 * A computed property that returns true if a signing key exists.
 * @type {import('vue').ComputedRef<boolean>}
 */
export const hasSigningKey = computed(() => signingKey.value != null);

/**
 * A computed property that derives the verification key from the signing key.
 * @type {import('vue').ComputedRef<Uint8Array | null>}
 */
export const verificationKey = computed(() =>
  signingKey.value ? keys.toVerificationKey(signingKey.value) : null,
);

export const walletBalance = ref(0);

/**
 * Watches the signingKey ref. When it changes, the new value is
 * persisted to the database, unless the app is in the initial `load` state.
 */
watch(signingKey, async (curr, _prev) => {
  if (appState.value != appStates.load) {
    toDb(signingKeyLabel, curr);
  }

  if (curr) {
    const connector = await cardanoConnector.value;
    walletBalance.value = await connector.balance(verificationKey.value);
  } else {
    // Reset balance if key is cleared
    walletBalance.value = 0;
  }
});

/**
 * @constant {string} The database key for storing the cardano connector name. */
const cardanoConnectorLabel = "cardanoConnector";

/**
 * The reactive holder for the user's selected cardano connector configuration.
 * @type {import('vue').Ref<{url: string, headers?: object} | null>}
 */
export const cardanoConnectorUrl = ref(
  "https://konduit-connector.matthias-benkort-623.workers.dev",
);
export const cardanoConnector = ref(
  wasm((w) => w.CardanoConnector.new(cardanoConnectorUrl.value)),
);

/**
 * Watches the cardanoConnector ref. When it changes, the new value is
 * persisted to the database, unless the app is in the initial `load` state.
 */
watch(cardanoConnectorUrl, async (url) => {
  if (appState.value != appStates.load) {
    toDb(cardanoConnectorLabel, url);
  }

  // Reload the connector.
  cardanoConnectorUrl.value = wasm((w) => w.CardanoConnector.new(url));
});

/**
 * @enum {string} Defines the possible Cardano network types.
 */
/** @constant {string} The database key for storing the network type. */
const networkLabel = "network";

/**
 * The reactive holder for the user's selected network.
 * Defaults to PREPROD if not set. Change for production.
 * @type {import('vue').Ref<string | null>}
 */
export const network = ref(networkTypes.PREPROD | null);

/**
 * Watches the network ref. When it changes, the new value is
 * persisted to the database, unless the app is in the initial `load` state.
 */
watch(network, async (curr, _prev) => {
  if (appState.value != appStates.load) {
    toDb(networkLabel, curr);
  }
});

/**
 * Load everything found in db
 * Populates the reactive state refs from IndexedDB.
 * @returns {Promise<void>} A promise that resolves when all data is loaded.
 * */
export async function loadDb() {
  await fromDb(signingKeyLabel, signingKey);
  await fromDb(cardanoConnectorLabel, cardanoConnectorUrl);
  await fromDb(networkLabel, network);
  return;
}

/**
 * Clears the signing key from state and the database, then resets
 * the application state to `load`.
 * @returns {Promise<void>} A promise that resolves when the key is forgotten.
 */
export function forget() {
  signingKey.value = null;
  return toDb(signingKeyLabel, null).then((_) => {
    appState.value = appStates.load;
  });
}

// Import store from settings

/**
 * Imports settings from a settings object and updates the application state.
 * @param {object} settings - The settings object.
 * @param {string} settings.version - The version of the settings format.
 * @param {object} settings.content - The content of the settings.
 * @param {string} [settings.content.signingKey] - The signing key as a hex string (required for version "0").
 * @throws {Error} If the version is unknown or required fields are missing.
 */
export function importSettings(settings) {
  try {
    const version = requiredField("version", settings);
    const content = requiredField("content", settings);

    if (version == "0") {
      signingKey.value = hex.decode(requiredField("signingKey", content));
    } else {
      throw Error("Unknown version");
    }
  } catch (err) {
    // NOTE: alert() is generally discouraged in modern web apps, but we keep it as it was in the original code.
    alert(err);
  }
}

/**
 * Exports the current application settings into an object.
 * @returns {{version: string, content: {signingKey: string}}} The settings object.
 */
export function exportSettings() {
  return {
    version: "0",
    content: {
      signingKey: hex.encode(signingKey.value),
    },
  };
}

/**
 * Helper function to retrieve a required field from an object.
 * @param {string} field - The name of the field to retrieve.
 * @param {object} data - The object to search within.
 * @returns {any} The value of the field.
 * @throws {Error} If the field is undefined in the data object.
 */
function requiredField(field, data) {
  let value = data[field];
  if (typeof value == "undefined") {
    throw Error(`Field "${field}" required`);
  } else {
    return value;
  }
}
