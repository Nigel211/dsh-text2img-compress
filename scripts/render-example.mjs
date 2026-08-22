// Regenerate assets/example-page.png — the plugin's own renderer output.
// Usage: node scripts/render-example.mjs   (run after `npm run build`)
import fs from 'node:fs'
import { renderTextPages } from '../lib/render.js'

const SAMPLE = `时间: 2026-08-21
DeepSeek-V4-Flash-Vision-Exp 发布
今天，全新的多模态视觉理解模型 DeepSeek-V4-Flash-Vision-Exp 上线 DeepSeek API 平台，这是一个实验性质的模型，用户可以通过设置 model='deepseek-v4-flash-vision-exp' 访问该模型。

Terminal Bench 2.1: 83.9
NL2Repo: 57.7
DeepSWE: 59.3
DSBench-Hard: 63.6
AutomationBench (Public): 25.7
ApexBench (Pass@1): 36.5
Agents' Last Exam: 27.3
Chartography: 64.3
ZeroBench (Pass@5): 35.0

在纯文本能力（Agent、推理、世界知识等）方面，DeepSeek-V4-Flash-Vision-Exp 与 DeepSeek-V4-Flash 正式版持平。`

const pages = renderTextPages(SAMPLE, { fontPx: 18 })
if (pages === null || pages.length === 0) throw new Error('renderTextPages returned no pages')
fs.mkdirSync('assets', { recursive: true })
fs.writeFileSync('assets/example-page.png', pages[0])
console.log(`wrote assets/example-page.png (${pages[0].length} bytes, page 1/${pages.length})`)
