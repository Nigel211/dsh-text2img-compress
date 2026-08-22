import { createCanvas, GlobalFonts } from '@napi-rs/canvas'

export interface RenderOptions {
  /** 字号 px：越大越易读，每页字数越少。 */
  fontPx?: number
  width?: number
  height?: number
  pad?: number
  /** 行距倍数（行高 = fontPx * lineHeightRatio）。 */
  lineHeightRatio?: number
  /** 超过该页数放弃转换（回退纯文本），避免截断。 */
  maxPages?: number
}

/**
 * 每页固定 800×800：DeepSeek 视觉 API 对更大图片会等比缩到约 800×800
 * 等效像素，每图 token 上限 384。恰好 800×800 不再被压缩，吃到上限。
 */
const PAGE_W = 800
const PAGE_H = 800
const PAD = 12

interface MeasureContext {
  measureText(text: string): { width: number }
}

function fontCandidates(): string[] {
  switch (process.platform) {
    case 'win32':
      return [
        'C:\\Windows\\Fonts\\msyh.ttc',
        'C:\\Windows\\Fonts\\msyhbd.ttc',
        'C:\\Windows\\Fonts\\simhei.ttf',
        'C:\\Windows\\Fonts\\consola.ttf',
        'C:\\Windows\\Fonts\\cour.ttf',
      ]
    case 'darwin':
      return [
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/Hiragino Sans GB.ttc',
        '/System/Library/Fonts/Menlo.ttc',
      ]
    default:
      return [
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/opentype/noto/NotoSansCJKsc-Regular.otf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
      ]
  }
}

let family: string | undefined

function ensureFont(): string {
  if (family !== undefined) return family
  const name = 'dsh-t2i'
  for (const path of fontCandidates()) {
    try {
      if (GlobalFonts.registerFromPath(path, name)) {
        family = name
        return family
      }
    } catch {
      // 该字体不可用，尝试下一个候选。
    }
  }
  // 找不到 CJK 字体时退回默认字体（英文可读，CJK 可能缺失）。
  family = 'sans-serif'
  return family
}

/**
 * 词边界优先换行：行内最后一个空格处断行（保留空格），无空格
 * （中文/超长 token）才逐字符断，避免英文/模型名被拦腰截断。
 */
function wrapLines(ctx: MeasureContext, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let current = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\n') {
      lines.push(current)
      current = ''
      continue
    }
    const candidate = current + ch
    if (current.length > 0 && ctx.measureText(candidate).width > maxWidth) {
      const space = current.lastIndexOf(' ')
      if (space > 0) {
        lines.push(current.slice(0, space + 1))
        current = current.slice(space + 1) + ch
      } else {
        lines.push(current)
        current = ch
      }
    } else {
      current = candidate
    }
  }
  if (current.length > 0) lines.push(current)
  return lines
}

/**
 * 把文本渲染为若干 800×800 PNG 页。
 * @returns PNG 字节数组；文本为空或超过 maxPages 时返回 null（调用方应回退纯文本）。
 */
export function renderTextPages(text: string, options: RenderOptions = {}): Uint8Array[] | null {
  const fontPx = options.fontPx ?? 18
  const maxPages = options.maxPages ?? 10
  const width = options.width ?? PAGE_W
  const height = options.height ?? PAGE_H
  const pad = options.pad ?? PAD
  const lineHeightRatio = options.lineHeightRatio ?? 1.4

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const font = `${fontPx}px ${ensureFont()}`
  ctx.font = font

  const lines = wrapLines(ctx, text, width - 2 * pad)
  const lineHeight = Math.ceil(fontPx * lineHeightRatio)
  const maxLines = Math.floor((height - 2 * pad) / lineHeight)
  const pageCount = Math.ceil(lines.length / maxLines)
  if (pageCount === 0 || pageCount > maxPages) return null

  const pages: Uint8Array[] = []
  for (let page = 0; page < pageCount; page++) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#000000'
    ctx.font = font
    ctx.textBaseline = 'top'
    const slice = lines.slice(page * maxLines, (page + 1) * maxLines)
    for (let index = 0; index < slice.length; index++) {
      ctx.fillText(slice[index], pad, pad + index * lineHeight)
    }
    pages.push(canvas.toBuffer('image/png'))
  }
  return pages
}
