<script setup>
import { computed } from "vue";
import { abbreviate } from "../utils/str.js";

const props = defineProps({
  adaptorKey: {
    type: String,
    required: true,
  },
  closePeriod: {
    type: Number,
    required: true,
  },
  fee: {
    type: Number,
    required: true,
  },
});

/**
 * Truncates the adaptor hex key.
 */
const formattedAdaptor = computed(() => {
  const key = props.adaptorKey;
  return abbreviate(key, 10, 10);
});

/**
 * Formats the fee as lovelace.
 */
const formattedFee = computed(() => {
  return new Intl.NumberFormat().format(props.fee) + " lovelace";
});

/**
 * Formats the close period from milliseconds into a human-readable duration.
 */
const formattedClosePeriod = computed(() => {
  let totalSeconds = Math.floor(props.closePeriod / 1000); // Assuming input is in MS
  if (totalSeconds <= 0) return "0s";

  const days = Math.floor(totalSeconds / (3600 * 24));
  totalSeconds %= 3600 * 24;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  // Handle case where total time is < 1s but > 0ms
  if (parts.length === 0 && props.closePeriod > 0) {
    return `${props.closePeriod}ms`;
  }

  return parts.join(" ");
});
</script>

<template>
  <div class="adaptor-info-container">
    <h3>Adaptor Info</h3>
    <div class="detail-grid">
      <div class="detail-label">Adaptor Key</div>
      <div class="detail-value mono">{{ formattedAdaptor }}</div>

      <div class="detail-label">Close Period</div>
      <div class="detail-value">{{ formattedClosePeriod }}</div>

      <div class="detail-label">Fee</div>
      <div class="detail-value">{{ formattedFee }}</div>
    </div>
  </div>
</template>

<style scoped>
.adaptor-info-container {
  width: 100%;
  text-align: left;
}

h3 {
  text-align: left;
  margin-top: 0;
  margin-bottom: 1rem;
}

/* Using a simple grid for layout, similar to InvoiceDetails.vue */
.detail-grid {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 1rem;
}

.detail-label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.detail-value {
  color: #222;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.4;
  text-align: right;
}

.mono {
  font-family: monospace;
  font-size: 0.85rem;
  word-break: break-all;
}
</style>
