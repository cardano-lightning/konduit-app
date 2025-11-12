<template>
  <div class="cheque-card" :class="{ unlocked: !isLocked }">
    <h4>{{ type }} (Index: {{ index }})</h4>
    <p><strong>Amount:</strong> {{ amount }} sats</p>
    <p class="details">
      <strong>{{ detailType }}:</strong> {{ detailValue }}
    </p>
  </div>
</template>

<script setup>
import { computed, defineProps } from "vue";
import { encode } from "../utils/hex.js"; // Adjust path as needed

// This component receives a single 'MixedCheque' instance
const props = defineProps({
  mixedCheque: {
    type: Object, // Expecting an instance of your MixedCheque class
    required: true,
  },
});

const isLocked = computed(() => props.mixedCheque.isCheque());
const type = computed(() => (isLocked.value ? "Locked Cheque" : "Unlocked"));
const index = computed(() => props.mixedCheque.index());
const amount = computed(() => props.mixedCheque.amount());

const detailType = computed(() => (isLocked.value ? "Lock" : "Secret"));

// Get the lock or secret for display
const detailValue = computed(() => {
  try {
    let hash;
    if (isLocked.value) {
      // It's a Cheque, get the lock from its body
      hash = props.mixedCheque.asCheque().body.lock;
    } else {
      // It's an Unlocked, get the secret
      hash = props.mixedCheque.asUnlocked().secret;
    }
    return encode(hash).substring(0, 24) + "...";
  } catch (e) {
    return "Error";
  }
});
</script>

<style scoped>
.cheque-card {
  border: 1px solid #eee;
  background-color: #fcfcfc;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}
.cheque-card.unlocked {
  background-color: #f0f9f0;
  border-color: #cfdccf;
}
.cheque-card h4 {
  margin: 0 0 8px 0;
}
.cheque-card p {
  margin: 4px 0;
}
.cheque-card .details {
  font-family: monospace;
  font-size: 0.9em;
  word-break: break-all;
}
</style>
