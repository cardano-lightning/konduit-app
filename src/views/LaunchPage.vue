<script setup>
import { useRoute, useRouter } from "vue-router";
import { importSettings, appState, appStates } from "../store.js";
import { openJson } from "../utils/file.js";

const router = useRouter();
const route = useRoute();
const goToCreate = () => {
  router.push({ name: "create" });
};

const openSettings = async () => {
  try {
    const jsonData = await openJson();
    if (jsonData) {
      importSettings(jsonData);
      appState.value = appStates.run;
    }
  } catch (err) {
    alert(err.message);
  }
};
</script>

<template>
  <div id="container">
    <img id="logo" src="../assets/logo.svg" alt="Konduit logo" />
    <p>A Cardano to Bitcoin Lightning Pipe</p>
    <div class="button-group">
      <button class="secondary" @click="openSettings">Import</button>
      <button class="primary" @click="goToCreate">Create</button>
    </div>
    <div class="link">
      <a href="https://cardano-lightning.org">Cardano-Lightning</a>
    </div>
  </div>
</template>

<style scoped>
#container {
  display: flex;
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
