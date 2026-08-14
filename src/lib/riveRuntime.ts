import { Rive, RuntimeLoader } from '@rive-app/react-webgl'
// Vite fingerprints this and rewrites the URL for the deployed base path.
import riveWasmUrl from '@rive-app/webgl/rive.wasm?url'

/**
 * Serve the Rive WASM from our own origin.
 *
 * Out of the box the runtime fetches its WASM from jsDelivr, which makes an
 * otherwise static site fail closed whenever that CDN is blocked, throttled or
 * down — and silently ties every lesson to a third party. Pointing the loader
 * at the bundled copy keeps the deploy self-contained.
 *
 * Must run before the first `useRive` call, so this module is imported for its
 * side effect from `main.tsx`.
 */
RuntimeLoader.setWasmUrl(riveWasmUrl)

/**
 * Survive unmounting a Rive canvas on the WebGL runtime (4.27.3).
 *
 * The WebGL build shares one renderer across every Rive instance, and that
 * shared object has no `delete()` — yet `deleteRiveRenderer` calls it
 * unconditionally. `useRive` runs it on unmount, so leaving any screen with a
 * canvas (the splash, every lesson) threw and blanked the whole app. Guard the
 * call until the runtime fixes it upstream.
 */
const riveProto = Rive.prototype as unknown as {
  renderer: { delete?: () => void } | null
  deleteRiveRenderer: () => void
}
riveProto.deleteRiveRenderer = function (this: typeof riveProto) {
  if (typeof this.renderer?.delete === 'function') this.renderer.delete()
  this.renderer = null
}
