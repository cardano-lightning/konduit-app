<template>
  <div class="channel-page">
    <h2>Channel Details</h2>
    <p><strong>Tag:</strong> {{ hexTag }}</p>
    <p><strong>Adaptor:</strong> {{ channel.adaptorInfo.url }}</p>

    <div class="details-grid">
      <div class="detail-box">
        <h3>L1 State (On-Chain)</h3>
        <p><strong>Stage:</strong> {{ channel.l1.stage }}</p>
        <p><strong>Phase:</strong> {{ channel.l1.phase }}</p>
        <p><strong>Total Amount:</strong> {{ channel.l1.amount }} sats</p>
        <p><strong>TX Hash:</strong> {{ l1TxHash }}</p>
      </div>

      <div class="detail-box">
        <h3>L2 State (Off-Chain)</h3>
        <p><strong>Available:</strong> {{ channel.l2.amount() }} sats</p>
        <p><strong>Committed:</strong> {{ channel.l2.committed() }} sats</p>
        <p>
          <strong>Last Squashed Index:</strong>
          {{ channel.l2.squash.body.index }}
        </p>
        <p>
          <strong>Pending Cheques:</strong>
          {{ channel.l2.mixedCheques.length }}
        </p>
      </div>
    </div>

    <div class="activity-feed">
      <h3>Activity (Mixed Cheques)</h3>
      <div v-if="!channel.l2.mixedCheques.length">
        <p>No pending cheques or unlocked items.</p>
      </div>
      <div v-else>
        <ChequeCard
          v-for="cheque in channel.l2.mixedCheques"
          :key="cheque.index()"
          :mixedCheque="cheque"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from "vue";
import { encode } from "../utils/hex.js"; // Adjust path as needed
import ChequeCard from "../components/ChequeCard.vue"; // Import the card

const props = defineProps({
  channel: {
    type: Object, // Expecting an instance of your Channel class
    required: true,
  },
});

const hexTag = computed(() => {
  try {
    return encode(props.channel.tag);
  } catch (e) {
    return "N/A";
  }
});

const l1TxHash = computed(() => {
  try {
    return encode(props.channel.l1.txHash) || "N/A (Pending)";
  } catch (e) {
    return "Error";
  }
});
</script>

<style scoped>
.channel-page {
  font-family: sans-serif;
  padding: 16px;
  max-width: 900px;
  margin: auto;
}
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.detail-box {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 16px 16px 16px;
}
.activity-feed {
  margin-top: 24px;
}
</style>
