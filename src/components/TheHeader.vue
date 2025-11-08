<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

// Import the new, separate icon components
import Logo from "./icons/Logo.vue";
import ChevronLeft from "./icons/ChevronLeft.vue";

// Get the current route and router instances
const route = useRoute();
const router = useRouter();
const isIndex = computed(() => route.path === "/");
const currentPageName = computed(() => {
  return route.meta.title || route.name || "Page";
});
</script>

<template>
  <header>
    <div v-if="isIndex">
      <h2><Logo /> {{ currentPageName }}</h2>
    </div>
    <div v-else class="back" aria-label="Go back" @click="router.back()">
      <h2>⟨ {{ currentPageName }}</h2>
    </div>
  </header>
</template>

<style scoped>
header {
  padding: 0.5rem;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
}

header h2 {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back {
  cursor: pointer;
}
</style>
