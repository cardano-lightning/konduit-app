<script setup>
import { computed, defineProps } from "vue";
import { encode } from "../utils/hex.js"; // Adjust path as needed

// Define the prop, assuming the 'channel' object is passed in
// and is an instance of your 'Channel' class.
const props = defineProps({
  channel: {
    type: Object, // Expecting an instance of your Channel class
    required: true,
  },
});

// Computed property to safely display the tag
const hexTag = computed(() => {
  try {
    // channel.tag is a Uint8Array
    return (
      hex.encode(props.channel.tag || hex.decode("eeeeee")).substring(0, 16) +
      "..."
    );
  } catch (e) {
    return "N/A";
  }
});

// Use the methods from the L2 MixedReceipt object
const availableAmount = computed(() => {
  try {
    return props.channel.l2.amount();
  } catch (e) {
    return "Error";
  }
});

const committedAmount = computed(() => {
  try {
    return props.channel.l2.committed();
  } catch (e) {
    return "Error";
  }
});
</script>

<template>
  <div class="channel-card">
    <h3>Channel: {{ hexTag }}</h3>
    <p>
      <strong>Adaptor:</strong>
      {{ channel.adaptorInfo.url || "Unknown" }}
    </p>
    <p>
      <strong>Available:</strong>
      {{ availableAmount }} Ada
    </p>
    <p>
      <strong>Committed:</strong>
      {{ committedAmount }} Ada
    </p>
  </div>
</template>

<style scoped>
/* Keeping it simple as requested */
.channel-card {
  border: 1px solid #ccc;
  padding: 16px;
  margin-bottom: 12px;
  font-family: sans-serif;
  max-width: 400px;
}
.channel-card h3 {
  margin-top: 0;
}
</style>
