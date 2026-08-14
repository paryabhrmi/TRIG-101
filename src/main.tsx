import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/fonts.css'
import './styles/global.css'
import './styles/app.css'
// Side effect: pins the Rive WASM to our own origin. Must precede any useRive.
import './lib/riveRuntime'

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
