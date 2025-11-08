<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { forget, exportSettings } from "../store.js";
import router from "../router.js";
import TheHeader from "../components/TheHeader.vue";

import { writeJson } from "../utils/file.js";

const forgetReload = () => {
  forget()
    .then((_) => router.push({ name: "index" }))
    .then((_) => window.location.reload());
};

const writeSettings = () => {
  writeJson(exportSettings(), "konduit.json");
};
</script>

<template>
  <TheHeader />
  <div class="settings-container">
    <div class="button-group">
      <button @click="writeSettings">Export</button>
      <button @click="forgetReload">Forget Me</button>
    </div>
  </div>
</template>

<style scoped>
.button-group {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
</style>
