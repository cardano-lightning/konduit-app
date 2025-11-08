<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import TheHeader from "../components/TheHeader.vue";
import ConnectionStatus from "../components/ConnectionStatus.vue";
import ChannelCarousel from "../components/ChannelCarousel.vue";

const router = useRouter();
const route = useRoute();
</script>

<template>
  <div class="home-container">
    <TheHeader />
    <div>
      <ConnectionStatus />
    </div>
    <div>
      <ChannelCarousel />
    </div>
    <div class="item-grow" style="display: flex; flex-direction: column">
      <h2>Activity</h2>
      <div
        class="item-grow"
        style="
          display: flex;
          flex-direction: column;
          justify-content: space-around;
        "
      >
        [No Activity]
      </div>
    </div>

    <nav>
      <router-link :to="{ name: 'wallet' }"> [Wallet] </router-link>
      <router-link :to="{ name: 'pay' }"> [Pay] </router-link>
      <router-link :to="{ name: 'settings' }"> [Settings] </router-link>
    </nav>
  </div>
</template>

<style scoped>
.home-container {
  height: 100%;
  display: flex;
  gap: 1rem;
  flex-direction: column;
  justify-content: space-between;
}

nav {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 1rem 0;
}
.item-grow {
  flex: 1 0 auto;
}

.item-shrink {
  flex-grow: 0 1 auto;
}
</style>
