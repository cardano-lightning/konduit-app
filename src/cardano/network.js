/**
 * @enum {string} Defines the possible Cardano network types.
 */
export const networkTypes = {
  MAINNET: "MAINNET",
  PREPROD: "PREPROD",
  PREVIEW: "PREVIEW",
  CUSTOM: "CUSTOM",
};

/**
 * Determines if the given network type is Mainnet.
 *
 * @param {string} network - The network type from `networkTypes`.
 * @returns {boolean} True if the network is Mainnet, false otherwise.
 */
export function isMainnet(network) {
  return network === networkTypes.MAINNET;
}

/**
 * Parses and validates a network type string.
 *
 * @param {string} networkString - The network type string to parse.
 * @returns {string} The validated network type.
 * @throws {Error} If the network type is invalid.
 */
export function parseNetwork(networkString) {
  const validNetworks = Object.values(networkTypes);
  const net = networkString.toUpperCase();
  if (!validNetworks.includes(net)) {
    throw new Error(`Invalid network type: ${networkString}`);
  }
  return net;
}
