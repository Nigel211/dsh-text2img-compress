import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { createElement } from 'react'
import { useEffect, useState } from 'react'

export interface Text2ImgValue {
  enabled: boolean
  fontPx: number
  threshold: number
}

const FONT_SIZES = [16, 18, 20, 22]

export const inject = ['slots', 'settingsScope']

/**
 * 输入框工具行右端、发送按钮左侧的「图」开关：
 * 点击写入 settings（text2img.enabled），字号下拉写 fontPx。
 * 渲染和消息替换全部发生在 Host 的 agent/pre-step 监听里。
 */
export function apply(ctx: ClientContext): void {
  const scope = ctx.settingsScope.bind<Text2ImgValue>({
    namespace: 'text2img',
    decode: (section) => {
      const s = (section ?? {}) as Record<string, unknown>
      return {
        enabled: s.enabled === true,
        fontPx: typeof s.fontPx === 'number' ? s.fontPx : 18,
        threshold: typeof s.threshold === 'number' ? s.threshold : 600,
      }
    },
  })
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register(
    { name: 'conversation.input.right', id: 'text2img-compress-toggle', order: 1000 },
    (props: any) => createElement(Toggle, { scope }),
  ))
}

function Toggle({ scope }: { scope: SettingsScope<Text2ImgValue> }) {
  const [snapshot, setSnapshot] = useState(scope.getSnapshot())
  useEffect(() => scope.subscribe(() => setSnapshot(scope.getSnapshot())), [scope])

  const status = snapshot.status
  const value = snapshot.value ?? { enabled: false, fontPx: 18, threshold: 600 }
  const on = value.enabled

  const toggle = () => {
    scope.set('enabled', !on).catch(() => {})
  }
  const changeFont = (event: { target: { value: string } }) => {
    scope.set('fontPx', Number(event.target.value)).catch(() => {})
  }

  const label = on ? '图·开' : '图'
  const title = status === 'unavailable'
    ? 'dsh-text2img-compress：宿主插件未加载（settings 不可用）'
    : `文本转图压缩：开启后 ≥${value.threshold} 字的长消息将渲染为图片发送（每图 384 token 封顶）· 字号 ${value.fontPx}px · 需要视觉模型`

  const baseStyle: Record<string, string | number | boolean> = {
    display: 'inline-flex',
    alignItems: 'center',
    height: 26,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid #8885',
    background: on ? '#2563eb' : 'transparent',
    color: on ? '#fff' : 'inherit',
    fontSize: 12,
    lineHeight: 1,
    cursor: status === 'ready' ? 'pointer' : 'not-allowed',
  }

  const sizeSelect = on ? createElement('select', {
    value: String(value.fontPx),
    onChange: changeFont,
    disabled: status !== 'ready',
    title: '字号越大越易读，每页字数越少',
    style: {
      height: 26,
      fontSize: 12,
      borderRadius: 6,
      border: '1px solid #8885',
      background: 'transparent',
      color: 'inherit',
    },
  }, FONT_SIZES.map((size) => createElement('option', { value: String(size), key: String(size) }, `${size}px`))) : null

  return createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4 } },
    createElement('button', {
      onClick: toggle,
      disabled: status !== 'ready',
      title,
      style: baseStyle,
    }, label),
    sizeSelect,
  )
}
