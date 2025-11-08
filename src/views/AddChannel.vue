<script setup>
import { ref, computed } from "vue";
import TheHeader from "../components/TheHeader.vue";

import { Adaptor } from "../konduit/adaptor.js";

// --- State Properties ---
const stage = ref(1);
const submitted = ref(false);

// Stage 1
const defaultUrl = "http://localhost:4445/";
const url = ref(defaultUrl);

// Stage 2

const adaptorInfo = computed(() => {
  if (stage.value == 2) {
    new Adaptor(null, url.value).getInfo();
  }
});

const tagDefault = "konduitIsAwesome";
const tag = ref(tagDefault);
const tagType = ref("utf8"); // 'utf8' or 'hex'
const amountDefault = 1;
const amount = ref(amountDefault);
const currency = ref("Ada");
const available = ref(1000); // Context value for max available amount

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
  }
  // No specific validation for utf8, just that it's not empty.
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
  if (amount.value > available.value) {
    return `Amount cannot exceed available balance of ${available.value} Ada.`;
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
    // Use the URL constructor for simple, robust validation
    new URL(url.value);
    // Clear stage 2 errors/data when proceeding
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
function submitForm() {
  // Double-check computed validators
  if (tagError.value || amountError.value) {
    console.error("Validation errors present. Submission blocked.");
    return;
  }

  // All good, log the data and show success
  console.log("Form Submitted:", {
    url: url.value,
    tag: tag.value,
    tagType: tagType.value,
    amount: amount.value,
    currency: currency.value,
  });

  submitted.value = true;
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
    <div v-if="!submitted">
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

        <pre>
              {{ adaptorInfo ? JSON.stringify(adaptorInfo, null, 2) : "null" }}
            </pre
        >
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
          <div>Available: {{ available }} Ada</div>
          <div v-if="amountError" class="error" aria-live="polite">
            {{ amountError }}
          </div>
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
      </form>
    </div>

    <!-- 
      SUBMISSION SUCCESS 
    -->
    <div v-if="submitted">
      <h2>Tx Submitted</h2>
      <p><strong>URL:</strong> {{ url }}</p>
      <p>
        <strong>Tag ({{ tagType }}):</strong> {{ tag }}
      </p>
      <p><strong>Amount:</strong> {{ amount }} {{ currency }}</p>
    </div>
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

/* Minimal styling to make it usable.
  'scoped' means these styles will only apply to this component.
*/
</style>
