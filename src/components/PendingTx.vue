<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

// Define the promise prop
const props = defineProps({
  pendingTx: {
    type: Promise,
    required: true,
  },
});

const router = useRouter();

// State refs
const isPending = ref(true);
const txHash = ref(null);
const error = ref(null);

const goToHome = () => {
  router.push({ path: "/" }); // Or { name: 'Home' }
};

// Handle the promise when the component mounts
onMounted(async () => {
  try {
    // Wait for the promise to resolve
    const res = await props.pendingTx;
    // Set success state
    txHash.value = res;
  } catch (e) {
    // Set error state
    error.value = e.message || "An unknown error occurred during submission.";
  } finally {
    // Always stop loading
    isPending.value = false;
  }
});
</script>
<template>
  <div class="pending-tx-container">
    <img
      src="../assets/logo.svg"
      alt="Konduit logo"
      style="width: 10rem; height: auto"
    />

    <!-- 2. SUCCESS STATE -->
    <p v-if="isPending">...pending...</p>
    <!-- 3. ERROR STATE -->
    <p v-if="txHash">{{ JSON.stringify(txHash, null, 2) }}</p>
    <div v-else-if="error" class="error-container">
      <h3>Transaction Failed</h3>
      <p class="error-message">{{ error }}</p>
    </div>
    <button class="secondary" @click="goToHome">Go Home</button>
  </div>
</template>

<style scoped>
.pending-tx-container {
  height: 60vh;
  display: flex;
  gap: 2rem;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  text-align: center;
}

/* --- Error State --- */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.error-message {
  color: #d93025;
  background-color: #fbe9e7;
  border-radius: 8px;
  padding: 1rem;
}
</style>
