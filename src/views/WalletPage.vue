<script setup>
import { Copy, ExternalLink, Share2 } from "lucide-vue-next";
import QRCode from "qrcode";
import {
  network,
  verificationKey,
  walletBalance,
  pollWalletBalance,
} from "../store.js";
import { networkTypes } from "../cardano/network.js";
import * as hex from "../utils/hex.js";
import {
  verificationKeyToAddress,
  verificationKeyToAddressBytes,
} from "../cardano/address.js";
import TheHeader from "../components/TheHeader.vue";
import { useClipboard } from "@vueuse/core";
import {
  computed,
  nextTick,
  ref,
  unref,
  watch,
  onMounted,
  onUnmounted,
} from "vue";
import { abbreviate } from "../utils/str.js";

const pollInterval = 15; // 15 seconds
const pollingHandle = ref(null);

onMounted(() => {
  pollingHandle.value = pollWalletBalance(pollInterval);
});

onUnmounted(async () => {
  // Clear the polling interval when component is unmounted
  if (pollingHandle.value !== null) {
    pollingHandle.value();
    pollingHandle.value = null;
  }
});

const { copy } = useClipboard();

function copySpan(event) {
  if (!bech32Addr.value) return;
  return copy(bech32Addr.value);
}

const bech32Addr = computed(() => {
  let vk = unref(verificationKey);
  let net = unref(network);
  if (vk === null || net === null) return "";
  return verificationKeyToAddress(net, vk);
});

const truncedAddr = computed(() => {
  if (!bech32Addr.value) return "";
  return abbreviate(bech32Addr.value, 10, 10);
});

const shareSupported = "share" in navigator;

async function shareAddress(event) {
  let address = unref(bech32Addr);
  if (!shareSupported || address === "") return;
  await navigator.share({ text: address, title: "Konduit Wallet Address" });
}

function cardanoScanURL(net, vk) {
  let baseURL = (() => {
    switch (net) {
      case networkTypes.MAINNET:
        return "https://cardanoscan.io/address/";
      case networkTypes.PREPROD:
        return "https://preprod.cardanoscan.io/address/";
      case networkTypes.PREVIEW:
        return "https://preview.cardanoscan.io/address/";
      default:
        throw new Error(`Unsupported network type for CardanoScan URL: ${net}`);
    }
  })();
  if (baseURL === undefined) return;
  const addressBytes = verificationKeyToAddressBytes(net, vk);
  const addressHex = hex.encode(addressBytes);
  const url = baseURL + addressHex;
  return url;
}

async function openCardanoScan(event) {
  let net = unref(network);
  let vk = unref(verificationKey);
  if (net === null || vk === null) return;
  let url = cardanoScanURL(net, vk);
  if (url === undefined) return;
  window.open(url, "_blank");
}

// Ref to hold the generated SVG string
const qrSvg = ref("");

// This ref is used to apply styles to the generated SVG
// which is hard to do without manipulating the DOM directly.
const qrContainer = ref(null);
const generateQR = async () => {
  if (bech32Addr.value === "") {
    qrSvg.value = "";
    return;
  }
  const svgString = await QRCode.toString(bech32Addr.value, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 4,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
  qrSvg.value = svgString;
  await nextTick(); // Wait for DOM to render the new SVG
  const svgElement = qrContainer.value?.querySelector("svg");
  if (svgElement) {
    svgElement.style.border = "1px solid";
    svgElement.style.borderColor = "inherit";
    svgElement.style.width = "80%";
  }
};

watch(bech32Addr, generateQR, {
  immediate: true,
});
</script>

<template>
  <TheHeader />
  <div class="wallet-container" v-if="verificationKey !== null">
    <div>
      <h2>Balance</h2>
      <span>{{ Number(walletBalance) / 1e6 }}₳</span>
    </div>

    <div id="address-section">
      <h2>Address</h2>
      <div>
        <span class="address" :title="bech32Addr">{{ truncedAddr }}</span>
        <Copy
          class="button"
          @click="copySpan($event)"
          data-label="key"
          :size="16"
          title="Copy address"
        />
        <a
          class="button"
          @click="openCardanoScan($event)"
          title="View on CardanoScan"
          ><ExternalLink :size="16"
        /></a>
        <Share2
          v-if="shareSupported"
          class="button"
          @click="shareAddress($event)"
          :size="16"
          title="Share address"
        />
      </div>
      <div id="qr-svg" v-html="qrSvg" ref="qrContainer"></div>
    </div>
  </div>
  <div class="wallet-container" v-else>
    <span>[No wallet found]</span>
  </div>
</template>

<style scoped>
#address-section {
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-top: 1em;
  row-gap: 1em;
}

#qr-svg svg {
  width: 80px;
}

a.button {
  color: inherit;
  cursor: pointer;
  text-decoration: none;
}
a.button :first-child {
  vertical-align: middle;
}

.button {
  display: inline-block;
  vertical-align: middle;
  margin-left: 1em;
}

.wallet-container {
  height: 80%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.address {
  display: inline-block; /* Ensure it behaves like text */
  vertical-align: middle;
  max-width: 70%; /* Adjust to fit your layout; use % or vw for responsiveness */
  overflow: hidden; /* Hide overflow */
  white-space: nowrap; /* Prevent wrapping */
}

.break {
  word-break: break-all;
}

.button.copy.copied::before {
  content: "copied!";
  position: absolute;
  font-variant: small-caps;
  top: -1.2em;
  right: 0;
  font-size: 0.75em;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  animation: fadeUp 1.2s ease forwards;
}
</style>
