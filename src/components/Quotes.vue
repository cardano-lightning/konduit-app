<script setup>
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { abbreviate } from "../utils/str.js";
import { channels } from "../store.js";
import * as hex from "../utils/hex.js";

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
  const index = quotes.findIndex(q => channelId === q.channelId);
  const newQuoteItem = { ...quotes[index], error: error };
  if (index === -1) return;
  console.log("Updating quote item for channel", channelId, "with error", error);
  console.log("New quote item:", newQuoteItem);
  quotes.splice(index, 1, newQuoteItem);
};

const setItemQuote = (channelId, quote) => {
  const index = quotes.findIndex(q => channelId === q.channelId);
  const newQuoteItem = { ...quotes[index], quote: quote };
  if (index !== -1) return;
  console.log("Updating quote item for channel", channelId, "with quote", quote);
  quotes.splice(index, 1, newQuoteItem);
};

const isQuoteLoading = (quoteItem) => {
  console.log("isQuoteLoading check for channel", quoteItem.channelId, ":", quoteItem);
  return quoteItem.quote === null && quoteItem.error === null;
};

const loadQuote = async (quoteItem) => {
  try {
    console.log("Requesting quote for channel", quoteItem.channelId, "for amount", props.invoice.amount, "to payee", props.invoice.payee);
    let quote = quoteItem.channel.quote(props.invoice.amount, props.invoice.payee);
    setItemQuote(quoteItem.channelId, quote);
  } catch (err) {
    setItemError(quoteItem.channelId, err.message || 'Failed to get quote');
  }
}

// There is no need to watch the `invoice` prop here as it should be
// immutable for the lifetime of this component instance.
// The question is if we should even be watching `channels` here?
watch(channels, (currChannels) => {
  // Reset the quotes
  quotes.splice(0, quotes.length);

  // Populate the quote table with empty entries
  currChannels.forEach((ch) => {
    let item = mkQuoteItem(ch);
    quotes.push(mkQuoteItem(ch));
    loadQuote(item);
  });

}, { immediate: true });

const router = useRouter();

// Formats the amount (assuming it's in sats)
const formattedAmount = computed(() => {
  if (typeof props.invoice.amount !== "number") return "N/A";
  return new Intl.NumberFormat().format(props.invoice.amount);
});

function tagger(channel) {
  return hex.encode(channel.tag) || "impossible";
}

// Formats the expiry date
const formattedExpiry = computed(() => {
  if (!props.invoice.expiry) return "N/A";
  return new Date(props.invoice.expiry).toLocaleString();
});

</script>

<template>
  <div v-if="channels.length > 0">
    <table>
      <thead>
        <tr>
          <th>Channel</th>
          <th>Quote</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="quoteItem in quotes" :key="quoteItem.channelId">
          <td>{{ abbreviate(quoteItem.channel.tagHex, 8, 8) }}</td>
          <td>
            <span v-if="isQuoteLoading(quoteItem)">Loading...</span>
            <span v-else-if="quoteItem.error">Error: {{ quoteItem.error }}</span>
            <span v-else>{{ new Intl.NumberFormat().format(quoteItem.quote.amount) }} sats</span>
          </td>
          <td>
            <span v-if="isQuoteLoading(quoteItem)">⏳</span>
            <span v-else-if="quoteItem.error">❌</span>
            <span v-else>✅</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else>
    [ No channels available to get quotes from ]
  </div>
</template>
