<script setup>
import { network, verificationKey } from "../store.js";
import * as hex from "../utils/hex.js";
import { verificationKeyToAddress } from "../cardano/address.js";
</script>

<template>
  <TheHeader />
  <div class="wallet-container">
    <div>
      <div>Verification Key:</div>
      <span v-if="verificationKey == null"> not set </span>
      <span v-else class="copy-able break" @click="copySpan($event)">
        {{ hex.encode(verificationKey) }}
      </span>
    </div>
    <div>
      <div>Address</div>
      <div v-if="verificationKey == null || network == null">
        Unknown key or network
      </div>
      <div v-else>
        <span class="copy-able break" @click="copySpan($event)">
          {{ verificationKeyToAddress(network, verificationKey) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wallet-container {
  height: 80%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.break {
  word-break: break-all;
}
</style>
