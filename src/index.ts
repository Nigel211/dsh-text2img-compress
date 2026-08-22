import type {} from '@deepseek-ai/dsh-agent'
import type { Context } from '@deepseek-ai/cordis'
import type { ImageAttachmentRef, SaveImageAttachment } from '@deepseek-ai/dsh-attachment/types'
import type { ContentBlock, UserMessage } from '@deepseek-ai/dsh-llm'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import { renderTextPages } from './render.js'

export const name = 'text2img-compress'
export const inject = ['settings']

export interface Text2ImgValue {
  enabled: boolean
  fontPx: number
  threshold: number
}

const HINT = '【本条消息的文本已打包为图片发送，请完整阅读图片内容。】'

/**
 * 把较长的用户消息文本渲染成图片再发给模型，利用"每张图片 384 token
 * 封顶"的计费规则压缩输入 token。开关状态通过 settings 持久化，
 * 客户端 UI（输入框右侧「图」开关）写入 preferences。
 */
export function apply(ctx: Context): void {
  const settings = ctx.settings.register<Text2ImgValue>(
    settingsNamespace('text2img'),
    z.object({
      enabled: z.boolean().default(false),
      fontPx: z.number().step(1).min(14).max(28).default(18),
      threshold: z.number().step(1).min(100).default(600),
    }),
  )

  ctx.on('agent/pre-step', async ({ agent, messages, signal }, next) => {
    const decision = await next()
    if (decision.kind === 'reject') return decision

    if (!settings.get().enabled) return decision

    // 非视觉模型守护：写图片块会导致请求报错，跳过。
    const model = agent.options?.model ?? ''
    if (model !== '' && !model.toLowerCase().includes('vision')) return decision

    const attachments = ctx.get('attachments')
    if (attachments === undefined) return decision

    let replaced = false
    const out: UserMessage[] = []
    for (const message of decision.messages) {
      const text = singleUserText(message)
      if (text === undefined) continue
      if (text.trim().length < settings.get().threshold) {
        out.push(message)
        continue
      }
      try {
        signal.throwIfAborted()
        const pages = renderTextPages(text, { fontPx: settings.get().fontPx, maxPages: 10 })
        if (pages === null || pages.length === 0) {
          // 内容太长（超过页数上限）→ 保持纯文本，绝不截断。
          out.push(message)
          continue
        }
        signal.throwIfAborted()
        const inputs: SaveImageAttachment[] = pages.map((data, index) => ({
          data,
          mediaType: 'image/png',
          name: `text2img-${index + 1}.png`,
        }))
        const refs: ImageAttachmentRef[] = [...await attachments.saveImages(inputs)]
        const content: ContentBlock[] = [{ type: 'text', text: HINT }]
        for (const ref of refs) content.push({ type: 'image', attachment: ref })
        out.push({ ...message, content })
        replaced = true
      } catch (error) {
        // 任何失败都回退为纯文本发送，绝不中断 agent 循环或丢内容。
        console.error('[text2img-compress] conversion failed, sending text instead', error)
        out.push(message)
      }
    }
    return replaced ? { kind: 'enter', messages: out } : decision
  })
}

/** 只转换"普通用户消息"：source.kind === 'user' 且内容为单个文本块。 */
function singleUserText(message: UserMessage): string | undefined {
  if (message?.role !== 'user' || message.source?.kind !== 'user') return undefined
  const blocks = message.content
  const [block] = blocks
  if (block === undefined || blocks.length !== 1 || block.type !== 'text') return undefined
  return block.text
}
