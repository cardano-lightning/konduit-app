import wasm_init, * as wasm from "../wasm/konduit_wasm.js";

let ready = null;
export default async function loadWasm(cb) {
  if (!ready) {
    ready = wasm_init().then(() => wasm);
  }
  return ready.then(cb);
}
