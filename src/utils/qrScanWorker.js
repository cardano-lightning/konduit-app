import { BarcodeDetectorPolyfill } from "@undecaf/barcode-detector-polyfill";

(function () {
  let that = self || window;
  if (typeof that.BarcodeDetector == "undefined") {
    that.BarcodeDetector = BarcodeDetectorPolyfill;
  }
})();

(async () => {
  if (!self.BarcodeDetector) return;
  const detector = new self.BarcodeDetector({ formats: ["qr_code"] });
  self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;

    detector.detect(data).then((barcodes) => {
      if (barcodes) {
        postMessage(barcodes);
      }
    });
  });
})();
