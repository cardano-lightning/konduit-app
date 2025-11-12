<script setup>
import * as hex from "../utils/hex.js";
import { Cheque } from "../konduit/cheque.js";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { abbreviate } from "../utils/str.js";
import { signingKey } from "../store.js";

const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
  quoteInfo: {
    type: Object,
    required: false,
  },
});

const emit = defineEmits(["payApproved"]);

// quote item structure:
//  {
//    channelId: tagger(channel),
//    channel: [channel],
//    quote: [response from the server]
//    error: null, // or error message
//  };

const TIMEOUT_GRACE_MILLISECONDS = 5 * 60 * 1000;

const pay = async () => {
  console.log("Paying quote:", props.quoteInfo);
  let quote = props.quoteInfo.quote;
  let channel = props.quoteInfo.channel;
  console.log("Using quote:", quote);
  let absoluteTimeout =
    Date.now() + quote.relativeTimeout + TIMEOUT_GRACE_MILLISECONDS;
  let chequeBody = channel.makeChequeBody(
    quote.amount,
    absoluteTimeout,
    hex.decode(props.invoice.hash),
  );

  const cheque = Cheque.make(signingKey.value, channel.tag, chequeBody);
  // TODO:
  const res = await props.quoteInfo.channel.pay(cheque, props.invoice);
  console.log("Payment result:", res);

  // The value is not important here
  // emit("payApproved", null);
};

// // Formats the amount (assuming it's in sats)
// const formattedAmount = computed(() => {
//   if (typeof props.invoice.amount !== "number") return "N/A";
//   return new Intl.NumberFormat().format(props.invoice.amount);
// });
//
// // Formats the expiry date
// const formattedExpiry = computed(() => {
//   if (!props.invoice.expiry) return "N/A";
//   return new Date(props.invoice.expiry).toLocaleString();
// });
//
// // Truncates long strings for display
// const truncatedPayee = computed(() => {
//   const dest = props.invoice.payee;
//   if (!dest) return "N/A";
//   return abbreviate(dest, 10, 10);
// });
//
// const truncatedHash = computed(() => {
//   const hash = props.invoice.hash;
//   if (!hash) return "N/A";
//   return abbreviate(hash, 10, 10);
// });
//
// const getQuotes = () => {
//   // The value is not important here
//   emit("invoiceApproved", null);
// };
</script>

<template>
  <div class="invoice-details-card">
    <h3>Quote Details</h3>

    <div v-if="props.invoice.amount >= 0" class="invoice-details">
      <!--
      <div class="detail-grid">
        <div class="detail-label">Amount</div>
        <div class="detail-value amount">
          {{ formattedAmount }} <span>sats</span>
        </div>

        <div class="detail-label">Description</div>
        <div class="detail-value description">
          {{ invoice.description || "No description provided" }}
        </div>

        <div class="detail-label">Expires</div>
        <div class="detail-value">
          {{ formattedExpiry }}
        </div>

        <div class="detail-label">Destination</div>
        <div class="detail-value mono">
          {{ truncatedPayee }}
        </div>

        <div class="detail-label">Hash</div>
        <div class="detail-value mono">
          {{ truncatedHash }}
        </div>
      </div>
      -->
      <div class="buttons">
        <button class="button primary" @click="pay">Pay</button>
      </div>
    </div>
    <div v-else>Format not yet supported</div>
  </div>
</template>

<style scoped>
.invoice-details-card {
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  margin: 0 auto;
}

.invoice-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  margin: 0 auto;
}

.detail-grid {
  display: grid;
  text-align: left;
  grid-template-columns: 100px 1fr;
  gap: 1rem;
}

.detail-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.detail-value {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.4;
}

.detail-value.amount {
  font-size: 1.2rem;
  font-weight: 700;
}
.detail-value.amount span {
  font-size: 0.9rem;
  font-weight: 600;
  margin-left: 0.25rem;
}

.detail-value.description {
  font-style: italic;
}

.mono {
  font-family: monospace;
  font-size: 0.85rem;
  word-break: break-all;
}

.buttons {
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  display: flex;
}
</style>
