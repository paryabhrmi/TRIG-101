import { RuntimeLoader } from '@rive-app/react-webgl'
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
