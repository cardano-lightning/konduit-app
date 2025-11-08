<script setup>
import { ref, watch } from "vue";
import { cardanoConnectorUrl, network } from "../store.js";

// Internal ref to track the connection status
// Values: 'idle', 'loading', 'success', 'error'
const status = ref("idle");

// Watch the 'url' prop for changes
watch(
  () => cardanoConnectorUrl.value,
  async (newUrl) => {
    // Reset state if URL is cleared
    if (!newUrl) {
      network.value = null;
      status.value = "idle";
      return;
    }

    // Set loading state and try to fetch
    status.value = "loading";
    try {
      const response = await fetch(`${newUrl}/network`, {
        headers: { mode: "no-cors" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // On success, store the response and set status
      network.value = await response.json().then((x) => x.network);
      status.value = "success";
    } catch (error) {
      // On failure, log error, clear data, and set error status
      console.error("Failed to fetch network:", error);
      network.value = null;
      status.value = "error";
    }
  },
  { immediate: true },
); // 'immediate: true' ensures this runs once on component mount
</script>

<template>
  <div class="connection-status-container">
    [
    <span> Network: </span>
    <!-- Grey "(none)" if no url is set -->
    <span v-if="!cardanoConnectorUrl" class="status-idle"> (none) </span>
    <!-- Red circle if the network request failed -->
    <span
      v-else-if="status === 'error'"
      class="status-error"
      title="Connection Failed"
    >
      ●
    </span>
    <!-- Green circle if success -->
    <div v-else-if="status === 'success'" title="Connected">
      <span class="status-success"> ● </span>
      <span>
        {{ network }}
      </span>
    </div>
    <!-- Optional: Loading indicator -->
    <span
      v-else-if="status === 'loading'"
      class="status-loading"
      title="Connecting..."
    >
      ...
    </span>
    ]
  </div>
</template>

<script setup></script>
<style scoped>
.connection-status-container {
  display: flex;
  flex-direction: row;
  gap: 0.2rem;
  align-items: end;
}
</style>

<style scoped>
/* Basic styling for the status indicators */
.status-idle {
  color: #888;
}

.status-error {
  color: #e53e3e; /* Red */
}

.status-success {
  color: #38a169; /* Green */
}

.status-loading {
  color: #d69e2e; /* Orange/Yellow */
  font-size: 1em;
  font-weight: bold;
}
</style>
