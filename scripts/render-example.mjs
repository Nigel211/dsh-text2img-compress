// Regenerate every README example asset with the plugin's own renderer.
//   - assets/example-page.png          《端午咸》 @18px (one page, 384 tokens)
//   - assets/example-guxiang-13px.png  鲁迅《故乡》 @13px page 1/3 (1,152 tokens total)
//   - assets/example-en-13px.png       DeepSeek-OCR 2 Introduction @13px (one page, 384 tokens)
// Sample texts live in samples/ (public domain / official DeepSeek demos).
// Usage: node scripts/render-example.mjs   (run after `npm run build`)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderTextPages } from '../lib/render.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const readSample = (name) => fs.readFileSync(path.join(root, 'samples', name), 'utf-8')

const assets = [
  { sample: 'duanwu.txt', fontPx: 18, out: 'assets/example-page.png' },
  { sample: 'guxiang.txt', fontPx: 13, out: 'assets/example-guxiang-13px.png' },
  { sample: 'deepseek-ocr2-intro.txt', fontPx: 13, out: 'assets/example-en-13px.png' },
]

for (const { sample, fontPx, out } of assets) {
  const pages = renderTextPages(readSample(sample), { fontPx })
  if (pages === null || pages.length === 0) throw new Error(`${sample} @${fontPx}px rendered no pages`)
  fs.writeFileSync(path.join(root, out), pages[0])
  console.log(`wrote ${out} (page 1/${pages.length}, ${pages[0].length} bytes)`)
}
