<script setup>
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
</script>

<template>
  <nav>
    <router-link :to="{ name: 'wallet' }"> [Wallet] </router-link>
    <router-link :to="{ name: 'pay' }"> [Pay] </router-link>
    <router-link :to="{ name: 'settings' }"> [Settings] </router-link>
  </nav>
</template>

<style scoped>
nav {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 1rem 0;
}
</style>
