<script setup>
import { ref, watch } from "vue";
import TheHeader from "../components/TheHeader.vue";
import InvoiceInput from "../components/InvoiceInput.vue";
import Quotes from "../components/Quotes.vue";
import QuoteDetails from "../components/QuoteDetails.vue";
import QrScan from "../components/QrScan.vue";
import InvoiceDetails from "../components/InvoiceDetails.vue";
import { parsePayRequest } from "../bln/payRequest.js";

const invoice = ref({
    "type": "bolt11",
    "raw": "lntb123450n1p5sh2fspp57pqutvc6q9d30kh6qyxvpx07qrqrrut8czk45wvut8trluqxnpqsdqdfahhqumfv5sjzcqzzsxqr3jssp5qpntdg40qcxeh3xy43us0zk3djqh5v2peldrtdp70gd7vpcy6wes9qxpqysgqa54uah5f9sw065t9unereh0vm0jjqwq6tulnd42pnxa6yl8e92xpkpgz5tpw0fx7v05lfkl93qumr80dk4xrnakkgh57xxk53e3kccqp5kwles",
    "amount": 12345,
    "description": "Oopsie!!",
    "payee": "022a15e511bc5e5eb10e3d3d777fa098e9087fcd878917986ee3a157340becdbfa",
    "expiry": 1762389888000,
    "hash": "f041c5b31a015b17dafa010cc099fe00c031f167c0ad5a399c59d63ff0069841",
    "paymentSecret": "0066b6a2af060d9bc4c4ac79078ad16c817a3141cfda35b43e7a1be60704d3b3",
    "finalCltvDelta": 80
});

const invoiceApproved = ref(false); // Whether the user approved the invoice
// quote item structure:
//  {
//    channelId: tagger(channel),
//    channel: [channel],
//    quote: [response from the server]
//    error: null, // or error message
//  };
const quoteInfo = ref(null);
const pendingPay = ref(null); // Holds pay info
const error = ref(null);

// // Called on successful QR scan
// const onQrScan = (payload) => {
//   invoiceRaw.value = payload;
//   handleParse(payload); // Immediately try to parse
// };
// 
// // Called by the "Next" button in manual mode
// const handleManualNext = () => {
//   handleParse(invoiceRaw.value);
// };
// 
// // The core parsing logic
// const handleParse = (rawInvoice) => {
//   error.value = null;
//   if (!rawInvoice || rawInvoice.trim() === "") {
//     error.value = "Invoice string cannot be empty.";
//     return;
//   }
// 
//   try {
//     // This now uses the new, smarter parser
//     console.log("Parsed request:", parsedInvoice.value);
//   } catch (e) {
//     console.error("Failed to parse request:", e);
//     error.value = `Invalid Input: ${e.message || "Unknown error"}`;
//     parsedInvoice.value = null; // Ensure we stay on the input page
//   }
// };

// Resets the view to the initial QR scan state
const goBack = () => {
  invoice.value = null;
  error.value = null;
};
</script>

<template>
  <TheHeader />
  <div class="pay-container">
    <!--
    <PendingPay v-if="pendingPay" :pendingPay="pendingPay" />
    <QuoteDetails v-else-if="quote" :quote="quote" :invoice="parsedInvoice"/>
    <QuoteList v-else-if="quotes != null" :quotes="quotes" @quote="selectedQuote"/>
    -->
    <span v-if="null">no</span>
    <QuoteDetails v-else-if="quoteInfo" :quoteInfo="quoteInfo" :invoice="invoice"/>
    <Quotes v-else-if="invoiceApproved" :invoice="invoice" @quoteSelected="(val) => { quoteInfo = val }" />
    <InvoiceDetails v-else-if="invoice" :invoice="invoice" @invoiceApproved="(_) => { invoiceApproved = true }"/>
    <InvoiceInput v-else @invoice="(val) => { console.log(val); invoice = val }"/>
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
