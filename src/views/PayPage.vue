<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import TheHeader from "../components/TheHeader.vue";
import QrScan from "../components/QrScan.vue";

const router = useRouter();
const route = useRoute();
const manual = () => {};

const invoice = ref(null);
const getQuotes = (data) => {
  // FIXME!
};

onMounted(() => {
  invoice.value = null;
});

onUnmounted(() => {});
</script>

<template>
  <TheHeader />
  <div class="pay-container">
    <div class="input">
      <div v-if="invoice == null">
        <QrScan @payload="(x) => (invoice = x)" />
      </div>
      <div v-else>
        <form>
          <textarea id="invoice" v-model="invoice" placeholder="lnb..." />
        </form>
      </div>
    </div>
    <div class="buttons">
      <div v-if="invoice == null">
        <button @click="invoice = ''">Manual</button>
      </div>
      <div v-else>
        <button @click="getQuotes(invoice)">Quotes</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.buttons {
  padding: 4rem 0;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: space-around;
  align-content: space-around;
  align-items: center;
}
textarea {
  width: 98%;
  aspect-ratio: 1 / 1;
}
</style>
