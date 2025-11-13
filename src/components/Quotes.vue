<script setup>
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { abbreviate } from "../utils/str.js";
import { channels } from "../store.js";
import * as hex from "../utils/hex.js";
import * as str from "../utils/str.js";

const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
});

let quotes = reactive([]);

const mkQuoteItem = (channel) => {
  return {
    channelId: tagger(channel),
    channel: channel,
    quote: null,
    error: null,
  };
};

const setItemError = (channelId, error) => {
  const index = quotes.findIndex((q) => channelId === q.channelId);
  const newQuoteItem = { ...quotes[index], error: error };
  if (index === -1) return;
  console.log(
    "Updating quote item for channel",
    channelId,
    "with error",
    error,
  );
  console.log("New quote item:", newQuoteItem);
  quotes.splice(index, 1, newQuoteItem);
};

const setItemQuote = (channelId, quote) => {
  const index = quotes.findIndex((q) => channelId === q.channelId);
  const newQuoteItem = { ...quotes[index], quote: quote };
  if (index === -1) return;
  console.log(
    "Updating quote item for channel",
    channelId,
    "with quote",
    quote,
  );
  quotes.splice(index, 1, newQuoteItem);
};

const isQuoteLoading = (quoteItem) => {
  console.log(
    "isQuoteLoading check for channel",
    quoteItem.channelId,
    ":",
    quoteItem,
  );
  return quoteItem.quote === null && quoteItem.error === null;
};

const loadQuote = async (quoteItem) => {
  try {
    console.log(
      "Requesting quote for channel",
      quoteItem.channelId,
      "for amount",
      props.invoice.amount,
      "to payee",
      props.invoice.payee,
    );
    let quote = await quoteItem.channel.quote(
      props.invoice.amount,
      props.invoice.payee,
    );
    setItemQuote(quoteItem.channelId, quote);
  } catch (err) {
    setItemError(quoteItem.channelId, err.message || "Failed to get quote");
  }
};

// There is no need to watch the `invoice` prop here as it should be
// immutable for the lifetime of this component instance.
// The question is if we should even be watching `channels` here?
watch(
  channels,
  (currChannels) => {
    // Reset the quotes
    quotes.splice(0, quotes.length);

    // Populate the quote table with empty entries
    currChannels.forEach((ch) => {
      let item = mkQuoteItem(ch);
      quotes.push(mkQuoteItem(ch));
      loadQuote(item);
    });
  },
  { immediate: true },
);

const router = useRouter();

// Formats the amount (assuming it's in sats)
const formattedAmount = computed(() => {
  if (typeof props.invoice.amount !== "number") return "N/A";
  return new Intl.NumberFormat().format(props.invoice.amount);
});

function tagger(channel) {
  return str.formatBytesAlphanumericOrHex(channel.tag) || "impossible";
}

// Formats the expiry date
const formattedExpiry = computed(() => {
  if (!props.invoice.expiry) return "N/A";
  return new Date(props.invoice.expiry).toLocaleString();
});

const emit = defineEmits(["quoteSelected"]);

const quoteSelected = (channelId) => {
  const quoteItem = quotes.find((q) => q.channelId === channelId);
  if (!quoteItem) {
    console.error("Quote item not found for channelId:", channelId);
    return;
  }
  console.log("Quote selected:", quoteItem);
  emit("quoteSelected", quoteItem);
};
</script>

<template>
  <div v-if="channels.length > 0">
    <div
      v-for="quoteItem in quotes"
      class="quote-card"
      :key="quoteItem.channelId"
    >
      <span>{{ quoteItem.channelId }}</span>
      <div>
        Status ::
        <span v-if="isQuoteLoading(quoteItem)">⏳</span>
        <span v-else-if="quoteItem.error">❌</span>
        <span v-else>✅</span>
      </div>
      <div>
        <span v-if="isQuoteLoading(quoteItem)">Loading...</span>
        <span v-else-if="quoteItem.error">Error: {{ quoteItem.error }}</span>
        <span v-else
          >Fee :: {{ (quoteItem.quote.amount / 1_000_000).toFixed(2) }}
        </span>
      </div>
      <div>
        <button @click="quoteSelected(quoteItem.channelId)">{{ "=>" }}</button>
      </div>
    </div>
  </div>
  <div v-else>[ No channels available to get quotes from ]</div>
</template>

<style scoped>
.quote-card {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
  width: 18rem;
  max-width: 25rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: start;
}
</style>
