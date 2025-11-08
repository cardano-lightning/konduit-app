<script setup>
import { network, verificationKey, walletBalance } from "../store.js";
import * as hex from "../utils/hex.js";
import { verificationKeyToAddress } from "../cardano/address.js";
import TheHeader from "../components/TheHeader.vue";
import { useClipboard } from '@vueuse/core';
import { ref } from 'vue';

const copied = { key: ref(false), addr: ref(false) };

const { copy } = useClipboard();

function copySpan(event) {
  const view = copied[event.target.attributes['data-label'].value];
  view.value = true;
  setTimeout(() => (view.value = false), 1200);
  return copy(event.target.textContent.trim());
}
</script>

<template>
  <TheHeader />
  <div class="wallet-container" v-if="verificationKey !== null">
      <div>
        <h2>Balance</h2>
        <span>{{ Number(walletBalance) / 1e6 }}₳</span>
      </div>

      <div>
        <h2>Verification key</h2>
        <span class="copy-able break" :class="{ copied: copied.key.value }" data-label="key" @click="copySpan($event)">
          {{ hex.encode(verificationKey) }}
        </span>
      </div>

      <div>
        <h2>Address</h2>
        <span class="copy-able break" :class="{ copied: copied.addr.value }" data-label="addr" @click="copySpan($event)">
          {{ verificationKeyToAddress(network, verificationKey) }}
        </span>
      </div>
  </div>
  <div class="wallet-container" v-else>
    <span>[No wallet found]</span>
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

.copy-able {
  position: relative;
  cursor: pointer;
  display: inline-block;
  padding-right: 1.5em; /* space for the icon */
  transition: color 0.2s ease;
}

.copy-able:hover {
  color: var(--color-accent, #3b82f6);
}

.copy-able::after {
  content: '📋';
  position: absolute;
  top: 0.1em;
  right: 0;
  font-size: 0.9em;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.copy-able:hover::after {
  opacity: 1;
}

.copy-able.copied::before {
  content: 'copied!';
  position: absolute;
  font-variant: small-caps;
  top: -1.2em;
  right: 0;
  font-size: 0.75em;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  animation: fadeUp 1.2s ease forwards;
}

@keyframes fadeUp {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  20% {
    opacity: 1;
    transform: translateY(-10px);
  }
  80% {
    opacity: 1;
    transform: translateY(-10px);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px);
  }
}
</style>
