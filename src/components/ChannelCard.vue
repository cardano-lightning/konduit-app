<script setup>
import { computed, defineProps } from "vue";
import * as hex from "../utils/hex.js";
import * as str from "../utils/str.js";
import { abbreviate } from "../utils/str.js";
import { Channel } from "../konduit/channel.js";

// Define the prop, assuming the 'channel' object is passed in
// and is an instance of your 'Channel' class.
const props = defineProps({
  channel: {
    type: Channel, // Expecting an instance of your Channel class
    required: true,
  },
});

// Computed property to safely display the tag
const prettyTag = computed(() => {
  try {
    // channel.tag is a Uint8Array
    const pretty = str.formatBytesAlphanumericOrHex(props.channel.tag);
    console.log("PRETTY", pretty.length);
    if (pretty.length < 20) {
      return pretty;
    } else {
      return abbreviate(pretty, 7, 7);
    }
  } catch (e) {
    console.log("ERRR", e);
    return "[no tag]";
  }
});

// Use the methods from the L2 MixedReceipt object
const availableAmount = computed(() => {
  try {
    return Math.round(props.channel.available() / 1_000_000).toFixed(2);
  } catch (e) {
    console.log("amount, ", e);
    return "Error";
  }
});

const committedAmount = computed(() => {
  try {
    return Math.round(props.channel.unresolvedCommitment() / 1_000_000).toFixed(
      2,
    );
  } catch (e) {
    return "Error";
  }
});
</script>

<template>
  <div class="channel-card">
    <p>
      {{ prettyTag }}
    </p>
    <p>
      {{ channel.adaptorInfo.url.slice(8) }}
    </p>
    <p>
      {{ availableAmount }}
      <span v-if="Math.abs(committedAmount) > 0.00005">
        {{ committedAmount }}</span
      >
    </p>
  </div>
</template>

<style scoped>
/* Keeping it simple as requested */
.channel-card {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
  max-width: 15rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: start;
}
.channel-card h3 {
  margin-top: 0;
}
</style>
