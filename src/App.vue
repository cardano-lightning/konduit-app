<script setup>
import { onMounted, onUnmounted } from "vue";
import { appState, appStates, loadDb, hasSigningKey } from "./store.js";

onMounted(() => {
  loadDb()
    .then(() => {
      if (hasSigningKey.value) {
        appState.value = appStates.run;
      } else {
        appState.value = appStates.launch;
      }
    })
    .catch(() => {
      alert("Can't load db");
    });
});

onUnmounted(() => {});
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
