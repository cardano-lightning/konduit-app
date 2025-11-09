<script setup>
import { ref } from "vue";
import TheHeader from "../components/TheHeader.vue";
import QrScan from "../components/QrScan.vue";
import InvoiceDetails from "../components/InvoiceDetails.vue";
import { parsePayRequest } from "../bln/payRequest.js";

const invoiceInput = ref(null); // Holds the raw invoice string
const parsedInvoice = ref(null); // Holds the parsed object
const error = ref(null);

// Called on successful QR scan
const onQrScan = (payload) => {
  invoiceInput.value = payload;
  handleParse(payload); // Immediately try to parse
};

// Called by the "Next" button in manual mode
const handleManualNext = () => {
  handleParse(invoiceInput.value);
};

// The core parsing logic
const handleParse = (rawInvoice) => {
  error.value = null;
  if (!rawInvoice || rawInvoice.trim() === "") {
    error.value = "Invoice string cannot be empty.";
    return;
  }

  try {
    // This now uses the new, smarter parser
    parsedInvoice.value = parsePayRequest(rawInvoice);
    console.log("Parsed request:", parsedInvoice.value);
  } catch (e) {
    console.error("Failed to parse request:", e);
    error.value = `Invalid Input: ${e.message || "Unknown error"}`;
    parsedInvoice.value = null; // Ensure we stay on the input page
  }
};

// Resets the view to the initial QR scan state
const goBack = () => {
  invoiceInput.value = null;
  parsedInvoice.value = null;
  error.value = null;
};
</script>

<template>
  <TheHeader />
  <div class="pay-container">
    <!-- STATE 3: INVOICE DETAILS -->
    <div v-if="parsedInvoice" class="details-view">
      <InvoiceDetails :invoice="parsedInvoice" />
    </div>

    <!-- STATES 1 & 2: INPUT -->
    <div v-else class="input-view">
      <div class="input">
        <!-- STATE 1: SCAN MODE -->
        <!-- Added .qr-scan-container to give this div dimensions -->
        <div v-if="invoiceInput == null" class="qr-scan-container-x">
          <QrScan @payload="onQrScan" />
        </div>
        <!-- STATE 2: MANUAL MODE -->
        <div v-else>
          <form @submit.prevent="handleManualNext">
            <textarea
              id="invoice"
              v-model="invoiceInput"
              placeholder="lnb... or lnurl..."
            />
          </form>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="buttons">
        <!-- STATE 1 BUTTONS -->
        <div v-if="invoiceInput == null">
          <button @click="invoiceInput = ''">Enter Manually</button>
        </div>
        <!-- STATE 2 BUTTONS -->
        <div v-else>
          <button @click="handleManualNext">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles reverted to your last request */
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

/* NEW STYLES to make the QrScan container
  have the same dimensions as the textarea 
  it replaces. This should fix the visibility issue.
*/
.qr-scan-container-x {
  width: 98%;
  aspect-ratio: 1 / 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #eee; /* Added a background to see the box */
}

/* This is the parent of both the textarea and qr-scan-container */
.input {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* Added error message style from previous version, as it's useful */
.error-message {
  padding: 1rem;
  color: #d93025;
  background-color: #fbe9e7;
  margin-top: 1rem;
  text-align: center;
  width: 98%;
}

.input-view,
.details-view {
  width: 100%;
  max-width: 500px;
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
