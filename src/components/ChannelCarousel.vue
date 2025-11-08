<script setup>
import { useRoute, useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <h2>Channels</h2>
  <div class="channel-carousel-container">
    <div>
      <div class="card">[No channels found]</div>
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
  width: 50%;
  aspect-ratio: 8 / 5;
  background-color: #eff6ff;
}

.channel-carousel-container {
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
</style>
