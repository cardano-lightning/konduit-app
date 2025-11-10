<script setup>
import { onMounted, onUnmounted } from "vue";
import { appState, appStates, initApp, hasSigningKey } from "./store.js";

onMounted(() => {
  initApp()
    .then(() => {
      if (hasSigningKey.value) {
        appState.value = appStates.run;
      } else {
        appState.value = appStates.launch;
      }
    })
    .catch((err) => {
      alert("Can't load db");
    });
});

onUnmounted(() => {});
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
