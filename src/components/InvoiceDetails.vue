<script setup>
import { computed } from "vue";
import { abbreviate } from "../utils/str.js";
import * as hex from "../utils/hex.js";

const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["invoiceApproved"]);

// Amount in msat
function prettyAmount(amount) {
  console.log("AMOUNT", amount, typeof amount);
  if (typeof amount === "number" || typeof amount === "bigint") {
    return new Intl.NumberFormat().format(props.invoice.amount);
  }
  return "N/A";
}

// Formats the expiry date
function prettyTime(time) {
  return new Date(time).toLocaleString();
}

function prettyBytes(bytes) {
  if (bytes) {
    return hex.encode(bytes);
  }
  return "N/A";
}

const table = computed(() => {
  let { amount, description, expiry, timestamp, payee, paymentHash } =
    props.invoice;
  return [
    ["Amount (msat)", amount, prettyAmount],
    ["Description", description || "[None]"],
    ["Expires at", expiry + timestamp, prettyTime],
    ["Payee", payee, prettyBytes],
    ["Lock / Payment Hash", paymentHash, prettyBytes],
  ];
});

const getQuotes = () => {
  // The value is not important here
  emit("invoiceApproved", null);
};
</script>

<template>
  <div class="invoice-details-card">
    <h3>Invoice Details</h3>
    <div v-if="table" class="invoice-details">
      <div
        v-for="([key, value, formatter], index) in table"
        :key="index"
        class="item"
      >
        <div class="label">
          {{ key }}
        </div>
        <div class="value">
          {{ formatter ? formatter(value) : value }}
        </div>
      </div>
      <div class="buttons">
        <button class="button primary" @click="getQuotes">Get Quotes</button>
      </div>
    </div>
    <div v-else>Format not yet supported</div>
  </div>
</template>

<style scoped>
.invoice-details-card {
  flex-direction: column;
  align-items: center;
}

.invoice-details {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.item {
  display: flex;
  width: 80vw;
  flex-direction: column;
}

.item .label {
  align-self: flex-start;
}

.item .value {
  align-self: flex-end;
  max-width: 80%;
  overflow-wrap: break-word;
  text-align: right;
}

.buttons {
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  display: flex;
}
</style>
