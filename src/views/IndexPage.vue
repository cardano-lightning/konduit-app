<script setup>
import { onMounted, onUnmounted } from "vue";
import { appState, appStates } from "../store.js";

import LoadingPage from "./LoadingPage.vue";
import LaunchPage from "./LaunchPage.vue";
import HomePage from "./HomePage.vue";

onMounted(() => {});

onUnmounted(() => {});
</script>

<template>
  <LoadingPage v-if="appState == appStates.load" />
  <LaunchPage v-else-if="appState == appStates.launch" />
  <HomePage v-else />
</template>
