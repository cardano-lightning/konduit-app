<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

// Formats the amount (assuming it's in sats)
const formattedAmount = computed(() => {
  if (typeof props.invoice.amount !== "number") return "N/A";
  return new Intl.NumberFormat().format(props.invoice.amount);
});

// Formats the expiry date
const formattedExpiry = computed(() => {
  if (!props.invoice.expiry) return "N/A";
  return new Date(props.invoice.expiry).toLocaleString();
});

// Truncates long strings for display
const truncatedDestination = computed(() => {
  const dest = props.invoice.destination;
  if (!dest || dest.length < 20) return dest || "N/A";
  return `${dest.substring(0, 10)}...${dest.substring(dest.length - 10)}`;
});

const getQuotes = () => {
  // Now we navigate to quotes, passing the *raw* invoice string,
  // which is the most reliable way to get quotes.
  router.push({
    path: "/quotes",
    query: { invoice: props.invoice.raw },
  });
};
</script>

<template>
  <div class="invoice-details-card">
    <h3>Invoice Details</h3>

    <div v-if="props.invoice.amount >= 0" class="invoice-details">
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
          {{ truncatedDestination }}
        </div>

        <div class="detail-label">Hash</div>
        <div class="detail-value mono">
          {{ invoice.hash ? `${invoice.hash.substring(0, 20)}...` : "N/A" }}
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
