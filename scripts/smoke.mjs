// CI smoke test: render a small sample through the real renderer.
// Usage: node scripts/smoke.mjs   (after `npm run build`)
import { renderTextPages } from '../lib/render.js'

const pages = renderTextPages('text2img smoke test 2026-08-21\nToken compression via images.', { fontPx: 18 })
if (pages === null || pages.length === 0) throw new Error('renderTextPages returned no pages')
console.log(`smoke ok — pages: ${pages.length}`)
