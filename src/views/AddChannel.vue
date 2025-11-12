<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import TheHeader from "../components/TheHeader.vue";
import AdaptorInfo from "../components/AdaptorInfo.vue";
import { Adaptor } from "../konduit/adaptor.js";
import { PROTOCOL_MIN_LOVELACE } from "../konduit/constants.js";
import {
  cardanoConnector,
  signingKey,
  pollWalletBalance,
  walletBalance,
  verificationKey,
} from "../store.js";
import wasm from "../utils/wasm-loader.js";
import { open } from "../components/txHandler.js";
import * as hex from "../utils/hex.js";
import PendingTx from "../components/PendingTx.vue";

const balancePollingHandle = ref(null);

onMounted(() => {
  // Poll every 15 seconds
  balancePollingHandle.value = pollWalletBalance(15);
});

onUnmounted(async () => {
  if (balancePollingHandle.value !== null) {
    balancePollingHandle.value();
    balancePollingHandle.value = null;
  }
});

const walletBalanceAda = computed(() => {
  return walletBalance.value / 1_000_000n;
});

// --- State Properties ---
const stage = ref(1);
const pendingTx = ref(null);

// Stage 1
const defaultUrl = "https://ada.konduit.channel/";
const url = ref(defaultUrl);

// Stage 2

const adaptorInfo = ref(null);

const tagDefault = "konduitIsAwesome";
const tag = ref(tagDefault);
const tagType = ref("utf8"); // 'utf8' or 'hex'
const amountDefault = 5;
const amount = ref(amountDefault);
const currency = ref("Ada");

// --- Validation Errors ---
const urlError = ref("");

/**
 * Computed property for live tag validation.
 */
const tagError = computed(() => {
  if (!tag.value) {
    return "Tag is required.";
  }
  if (tagType.value === "hex") {
    const hexRegex = /^[0-9a-fA-F]+$/; // Requires at least one hex char
    if (!hexRegex.test(tag.value)) {
      return "Tag must be a valid non-empty hexadecimal string (0-9, a-f, A-F).";
    }
    if (tag.value.length > 2 * adaptorInfo.value.maxTagLength) {
      return "Tag is too long";
    }
  }
  if (adaptorInfo.value) {
    const maxTagLength = adaptorInfo.value.maxTagLength || 32;
    if (tag.value.length > (tagType === "hex" ? 2 : 1) * maxTagLength) {
      return "Tag is too long";
    }
  }
  return ""; // No error
});

/**
 * Computed property for live amount validation.
 */
const amountError = computed(() => {
  if (amount.value === null || amount.value === undefined) {
    return "Amount is required.";
  }
  if (amount.value <= 0) {
    return "Amount must be greater than 0.";
  }

  if (walletBalanceAda.value === null) return "";
  if (amount.value > walletBalanceAda.value) {
    return `Amount cannot exceed available balance of ${walletBalanceAda.value} Ada.`;
  }
  return ""; // No error
});

// --- Methods ---

/**
 * Validates the URL and proceeds to stage 2.
 */
function proceedToStage2() {
  urlError.value = ""; // Reset error
  try {
    // Clear stage 2 errors/data when proceeding
    new Adaptor(null, url.value).info().then((x) => (adaptorInfo.value = x));
    tagType.value = "utf8";
    tag.value = tagDefault;
    amount.value = amountDefault;
    stage.value = 2;
  } catch (e) {
    urlError.value =
      'Please enter a valid URL (e.g., "https://ada.konduit.channel").';
  }
}

/**
 * Final validation and "submission" of the form.
 */
async function submitForm() {
  // Double-check computed validators
  if (tagError.value || amountError.value) {
    console.error("Validation errors present. Submission blocked.");
    return;
  }

  const adaptorVerificationKey = adaptorInfo.value.adaptorKey;
  const closePeriod = BigInt(adaptorInfo.value.closePeriod);
  const tagBytes =
    tagType.value === "utf8"
      ? new TextEncoder().encode(tag.value)
      : Uint8Array.from(tag.value.match(/../g), (byte) => parseInt(byte, 16));

  try {
    pendingTx.value = open(adaptorInfo.value, tagBytes, amount.value);
  } catch (e) {
    pendingTx.value(
      new Promise((resolve, reject) =>
        reject(new Error("Something went wrong")),
      ),
    );
  }
}

/**
 * Resets the form to its initial state.
 */
function resetForm() {
  stage.value = 1;
  submitted.value = false;
  url.value = "";
  tag.value = "";
  tagType.value = "utf8";
  amount.value = 0;
}
</script>

<template>
  <TheHeader />
  <div class="add-channel-container">
    <div v-if="pendingTx === null">
      <!--
        STAGE 1: Adaptor details
      -->
      <form v-if="stage === 1" @submit.prevent="proceedToStage2">
        <h2>Adaptor URL</h2>
        <div>
          <label for="url">URL:</label>
          <input
            id="url"
            v-model.trim="url"
            type="text"
            placeholder="https://example.com"
          />
          <div v-if="urlError" class="error">
            {{ urlError }}
          </div>
        </div>
        <div>
          <button type="submit">Next</button>
        </div>
      </form>

      <!--
        STAGE 2: Consumer details
      -->
      <form v-if="stage === 2" @submit.prevent="submitForm">
        <h2>Channel details</h2>

        <!-- Tag Input -->
        <div>
          <label for="tag">Tag:</label>
          <input id="tag" v-model="tag" type="text" />
          <!-- Replaced select with radio buttons -->
          <div
            style="display: flex; flex-direction: row"
            role="radiogroup"
            aria-labelledby="tag-type-label"
          >
            <span id="tag-type-label" style="display: none">Tag Type</span>
            <input
              id="tag-type-utf8"
              v-model="tagType"
              type="radio"
              value="utf8"
            />
            <label for="tag-type-utf8" class="radio-label">UTF-8</label>

            <input
              id="tag-type-hex"
              v-model="tagType"
              type="radio"
              value="hex"
            />
            <label for="tag-type-hex" class="radio-label">Hex</label>
          </div>
          <div v-if="tagError" class="error" aria-live="polite">
            {{ tagError }}
          </div>
        </div>

        <!-- Amount Input -->
        <div>
          <label for="amount">Amount:</label>
          <input id="amount" v-model.number="amount" type="number" />
          <div>Available: {{ walletBalanceAda }} Ada</div>
          <div v-if="amountError" class="error" aria-live="polite">
            {{ amountError }}
          </div>
          <span>(protocol min ada is added)</span>
        </div>

        <!-- Currency Input (Disabled) -->
        <div>
          <label for="currency">Currency:</label>
          <select id="currency" v-model="currency" disabled>
            <option value="Ada">Ada</option>
          </select>
        </div>

        <div
          style="
            display: flex;
            flex-direction: row;
            justify-content: space-around;
          "
        >
          <button class="secondary" type="button" @click="stage = 1">
            Back
          </button>
          <button type="submit" :disabled="!!tagError || !!amountError">
            Submit
          </button>
        </div>

        <AdaptorInfo v-if="adaptorInfo" v-bind="adaptorInfo" />
        <p v-else="">pending info...</p>
      </form>
    </div>

    <PendingTx v-else :pendingTx="pendingTx" />
  </div>
</template>

<style scoped>
.channel-carousel-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  justify-content: space-around;
  align-content: space-around;
}
</style>
