<script setup>
import { useRoute, useRouter } from "vue-router";
import { appState, appStates, verificationKey, signingKey } from "../store.js";
import * as keys from "../cardano/keys.js";

const router = useRouter();
const route = useRoute();
const goToHome = () => {
  router.push({ name: "index" });
};

if (signingKey.value == null) {
  signingKey.value = keys.genSkey();
  appState.value = appStates.run;
}
</script>

<template>
  <div id="container">
    <h1>Create</h1>
    <div v-if="signingKey == null">
      <p>Key is being generated</p>
    </div>
    <div v-else>
      <p>Key is generated</p>
      <button @click="goToHome">Home</button>
    </div>
  </div>
</template>

<style scoped>
#container {
  display: flex;
  height: 90vh;
  flex-direction: column;
  justify-content: space-around;
}

#logo {
  height: 15vh;
  padding: 33vh 4rem 2vh;
}

.button-group {
  padding: 10vh 0rem 10vh;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
</style>
