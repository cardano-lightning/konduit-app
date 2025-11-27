<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  reactive,
  shallowRef,
  useTemplateRef,
  watchEffect,
} from "vue";
import { useDevicesList, useUserMedia } from "@vueuse/core";
import Worker from "../utils/qrScanWorker.js?worker";

const props = defineProps({
  scanRate: {
    type: Number,
    default: 500,
  },
});

const emit = defineEmits(["payload"]);

const videoRef = useTemplateRef("videoRef");
const barcode = ref(null);
const qrWorker = ref(null);
const containerSize = ref({ width: 0, height: 0 });
const containerRef = ref(null);
const snapshotCanvasRef = ref(null);
const animationFrameId = ref(null);
const resizeObserver = ref(null);
let lastScanTime = 0;

/// FIXME :: ID SELECTION IS NOT YET EXPOSED TO THE USER.
const currentCamera = shallowRef<string>();
const { videoInputs: cameras } = useDevicesList({
  requestPermissions: true,
  onUpdated() {
    if (!cameras.value.find((i) => i.deviceId === currentCamera.value))
      currentCamera.value = cameras.value[0]?.deviceId;
  },
});

const { stream } = useUserMedia({
  constraints: reactive({ video: { deviceId: { exact: currentCamera } } }),
  enabled: true,
});

watchEffect(() => {
  if (videoRef.value) videoRef.value.srcObject = stream.value!;
});

const animationLoop = (currentTime) => {
  if (!videoRef.value || !snapshotCanvasRef.value) return;

  const inner = videoRef.value;
  const canvas = snapshotCanvasRef.value;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  const timeSinceLastScan = currentTime - lastScanTime;

  // Process a frame if enough time has passed and the video is ready
  if (
    context &&
    timeSinceLastScan > props.scanRate &&
    inner.readyState === inner.HAVE_ENOUGH_DATA
  ) {
    lastScanTime = currentTime;

    // Crop a square from the center of the inner feed
    const videoWidth = inner.videoWidth;
    const videoHeight = inner.videoHeight;
    const size = Math.min(videoWidth, videoHeight);
    const sx = (videoWidth - size) / 2;
    const sy = (videoHeight - size) / 2;

    // Set canvas dimensions to match the cropped size for accurate image data
    canvas.width = size;
    canvas.height = size;

    context.drawImage(inner, sx, sy, size, size, 0, 0, size, size);
    const imageData = context.getImageData(0, 0, size, size);

    // Send the image data to the worker
    if (imageData && qrWorker.value) {
      // Transfer the buffer to the worker for performance
      qrWorker.value.postMessage(imageData, [imageData.data.buffer]);
    }
  }

  // Continue the loop as long as no barcode has been found
  // if (!barcode.value) {
  animationFrameId.value = requestAnimationFrame(animationLoop);
  // }
};

onMounted(() => {
  const worker = new Worker();
  qrWorker.value = worker;
  worker.onmessage = (event) => {
    if (event.data && event.data.length > 0) {
      emit("payload", event.data[0].rawValue);
    }
  };

  // Set up a resize observer to keep the video element square
  if (containerRef.value) {
    resizeObserver.value = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        containerSize.value = {
          width: entry.contentRect.width,
          height: entry.contentRect.width,
        };
      }
    });
    resizeObserver.value.observe(containerRef.value);
  }

  // Start the animation loop
  animationFrameId.value = requestAnimationFrame(animationLoop);
});

onUnmounted(() => {
  // Terminate the worker
  if (qrWorker.value) {
    qrWorker.value.terminate();
  }

  // Disconnect the observer
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }
});
</script>

<template>
  <div class="qr-scan-container">
    <div ref="containerRef" class="scanner-view">
      <div>
        <video
          ref="videoRef"
          class="video-feed"
          autoplay
          playsinline
          muted
          :class="{ mirror: isFrontCamera }"
          :style="{
            width: `${containerSize.width}px`,
            height: `${containerSize.height}px`,
          }"
        />
        <div class="overlay">
          <div class="crosshair" />
        </div>
      </div>
    </div>

    <!-- Hidden canvas for capturing snapshots -->
    <canvas ref="snapshotCanvasRef" class="hidden-canvas" />
  </div>
</template>

<style scoped>
.qr-scan-container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.result-display {
  background-color: #dcfce7;
  color: #166534;
}

.result-title {
  font-weight: 600;
}

.result-value {
  margin-top: 0.5rem;
  word-break: break-all;
}

.scanner-view {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: 2px solid #d1d5db;
  background-color: #111827;
}

.video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crosshair {
  width: 75%;
  height: 75%;
  border: 4px dashed rgba(255, 255, 255, 0.5);
}

.hidden-canvas {
  display: none;
}

/* FIXME :: NOT YET WORKED OUT WHEN TO MIRROR THE DISPLAY */
.mirror {
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
}
</style>
