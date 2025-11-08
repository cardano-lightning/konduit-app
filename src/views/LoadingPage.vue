<template>
  <div class="container">
    <img id="loading" src="../assets/logo.svg" alt="Konduit logo" />
  </div>
</template>

<style scoped>
@keyframes pulse {
  5% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.1);
  }
  55% {
    transform: scale(1.1);
  }
  95% {
    transform: scale(1);
  }
}
#loading {
  height: 15vh;
  animation: pulse 2s infinite;
}
.container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
