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
    <div class="icon-container">
      <div v-if="isIndex">
        <Logo />
      </div>
      <div v-else aria-label="Go back" @click="router.back()">
        <h2>⟨</h2>
      </div>
    </div>
    <h2>{{ currentPageName }}</h2>
  </header>
</template>

<style scoped>
header {
  padding: 0.5rem;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: start;
}

.icon-container {
  height: 1rem;
}
</style>
