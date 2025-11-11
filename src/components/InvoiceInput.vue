<script setup>
import { ref } from "vue";
import QrScan from "../components/QrScan.vue";
import { parsePayRequest } from "../bln/payRequest.js";

const emit = defineEmits(["invoice"]);

const invoiceRaw = ref(null);
const error = ref(null);

// Called on successful QR scan
const onQrScan = (payload) => {
  invoiceRaw.value = payload;
  handleParse(payload);
};

// Called by the "Next" button in manual mode
const handleManualNext = () => {
  handleParse(invoiceRaw.value);
};

// The core parsing logic
const handleParse = (rawInvoice) => {
  error.value = null;
  if (!rawInvoice || rawInvoice.trim() === "") {
    error.value = "Invoice string cannot be empty.";
    return;
  }
  try {
    emit("invoice", parsePayRequest(rawInvoice));
  } catch (e) {
    console.error("Failed to parse request:", e);
    error.value = `Invalid Input: ${e.message || "Unknown error"}`;
  }
};
</script>

<template>
  <div class="input-invoice-container">
    <div class="input">
      <QrScan v-if="invoiceRaw == null" @payload="onQrScan" />
      <form v-else @submit.prevent="handleManualNext">
        <textarea id="invoice" v-model="invoiceRaw" placeholder="lnb..." />
      </form>
    </div>
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <div class="buttons">
      <button v-if="invoiceRaw == null" @click="invoiceRaw = ''">
        Enter Manually
      </button>
      <button v-else @click="handleManualNext">Next</button>
    </div>
  </div>
</template>

<style scoped>
.input-invoice-container {
  width: 98%;
}

.buttons {
  padding: 4rem 0;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: space-around;
  align-content: space-around;
  align-items: center;
}

textarea {
  width: 98%;
  aspect-ratio: 1 / 1;
}

.input {
  width: 100%;
  display: flex;
  justify-content: center;
}

.error-message {
  padding: 1rem;
  color: #d93025;
  background-color: #fbe9e7;
  margin-top: 1rem;
  text-align: center;
  width: 98%;
}

.input-view {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pay-container {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
