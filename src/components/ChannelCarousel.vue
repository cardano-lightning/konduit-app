<script setup>
import { onMounted } from "vue";
import ChannelCard from "./ChannelCard.vue";
import { useRoute, useRouter } from "vue-router";
import { channels, channelsUpdater } from "../store.js";
import * as hex from "../utils/hex.js";
const router = useRouter();

function tagger(channel) {
  return hex.encode(channel.tag) || "impossible";
}

onMounted(() => {
  channelsUpdater();
  console.log(channels.value);
});
</script>

<template>
  <h2>Channels</h2>
  <div class="channel-carousel-container">
    <div class="channel-scroller-wrapper">
      <ChannelCard
        v-for="channel in channels"
        :key="tagger(channel)"
        :channel="channel"
        class="scroller-card"
      />
    </div>
    <div class="channel-buttons">
      <button class="secondary" @click="router.push({ name: 'add-channel' })">
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  width: 10rem;
  aspect-ratio: 8 / 5;
  background-color: #eff6ff;
}

.channel-carousel-container {
  max-width: 90%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
}

.channel-buttons {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

.icon-container {
  height: 1rem;
}

/* Keep it simple as requested */
.channel-scroller-wrapper {
  display: flex;
  flex-direction: row; /* Arrange items in a row */
  overflow-x: auto; /* Enable horizontal scrolling */
  white-space: nowrap; /* Prevent cards from wrapping to the next line */
  padding: 12px 0; /* Add some vertical padding */
  gap: 16px; /* This creates space between the cards */
}

.scroller-card {
  flex-shrink: 0; /* Prevents cards from shrinking */
  width: 320px; /* Give each card a fixed width */
  margin-bottom: 0; /* Override any bottom margin from the card itself */
}

/* Optional: simple scrollbar styling */
.channel-scroller-wrapper::-webkit-scrollbar {
  height: 4px;
}
.channel-scroller-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.channel-scroller-wrapper::-webkit-scrollbar-thumb {
  background: #ccc;
}
.channel-scroller-wrapper::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>
