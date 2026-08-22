import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { createElement, type ReactElement } from 'react'
import { useEffect, useState } from 'react'

export interface Text2ImgValue {
  enabled: boolean
  fontPx: number
  threshold: number
  maxPages: number
}

const FONT_SIZES = [14, 16, 18, 20, 22, 24]

const DEFAULT_VALUE: Text2ImgValue = { enabled: false, fontPx: 18, threshold: 600, maxPages: 10 }

function normalize(section: unknown): Text2ImgValue {
  const s = (section ?? {}) as Record<string, unknown>
  return {
    enabled: s.enabled === true,
    fontPx: typeof s.fontPx === 'number' && s.fontPx >= 14 && s.fontPx <= 28 ? s.fontPx : 18,
    threshold: typeof s.threshold === 'number' && s.threshold >= 100 ? s.threshold : 600,
    maxPages: typeof s.maxPages === 'number' && s.maxPages >= 1 && s.maxPages <= 20 ? s.maxPages : 10,
  }
}

export const inject = ['slots', 'settingsScope']

/**
 * 输入框工具行右端、发送按钮左侧的「图」开关 + 字号下拉，
 * 以及 DSH 设置面板里的「文本转图压缩」完整设置页。
 * 全部状态通过 settings（text2img 命名空间）持久化；渲染和消息替换
 * 发生在 Host 的 agent/pre-step 监听里。
 */
export function apply(ctx: ClientContext): void {
  const scope = ctx.settingsScope.bind<Text2ImgValue>({
    namespace: 'text2img',
    decode: normalize,
  })
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register(
    { name: 'conversation.input.right', id: 'text2img-compress-toggle', order: 1000 },
    (props: any) => createElement(Toggle, { scope }),
  ))
  ctx.slots.inject('settings.section', () => ctx.slots.register(
    { name: 'settings.section', id: 'text2img-compress', order: 50, label: '文本转图压缩 · Text-as-Image' },
    (props: any) => createElement(SettingsPage, { scope }),
  ))
}

function useScopeValue(scope: SettingsScope<Text2ImgValue>) {
  const [snapshot, setSnapshot] = useState(scope.getSnapshot())
  useEffect(() => scope.subscribe(() => setSnapshot(scope.getSnapshot())), [scope])
  return { snapshot, value: snapshot.value ?? DEFAULT_VALUE, ready: snapshot.status === 'ready' }
}

function Toggle({ scope }: { scope: SettingsScope<Text2ImgValue> }) {
  const { snapshot, value, ready } = useScopeValue(scope)
  const on = value.enabled

  const toggle = () => {
    scope.set('enabled', !on).catch(() => {})
  }
  const changeFont = (event: { target: { value: string } }) => {
    scope.set('fontPx', Number(event.target.value)).catch(() => {})
  }

  const label = on ? '图·开' : '图'
  const title = snapshot.status === 'unavailable'
    ? 'dsh-text2img-compress：宿主插件未加载（settings 不可用）'
    : `文本转图：开启后超过阈值的长消息将以图片发送，省输入 token（详细设置在“文本转图压缩”设置页 · 需要视觉模型）`

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
    cursor: ready ? 'pointer' : 'not-allowed',
  }

  const sizeSelect = on ? createElement('select', {
    value: String(value.fontPx),
    onChange: changeFont,
    disabled: !ready,
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
      disabled: !ready,
      title,
      style: baseStyle,
    }, label),
    sizeSelect,
  )
}

function SettingsPage({ scope }: { scope: SettingsScope<Text2ImgValue> }) {
  const { value, ready } = useScopeValue(scope)
  const set = (field: string, next: unknown) => {
    scope.set(field, next).catch(() => {})
  }
  const rowStyle: Record<string, string | number> = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    minHeight: 32,
    fontSize: 13,
  }
  const inputStyle: Record<string, string | number> = {
    height: 28,
    fontSize: 13,
    borderRadius: 6,
    border: '1px solid #8885',
    background: 'transparent',
    color: 'inherit',
    padding: '0 8px',
  }
  const row = (title: string, hint: string, control: ReactElement) => createElement('div', { style: rowStyle },
    createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
      createElement('span', null, title),
      createElement('span', { style: { fontSize: 12, opacity: 0.65 } }, hint),
    ),
    control,
  )

  return createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' } },
    row('开启图片压缩', '与输入框右侧「图」开关等价', createElement('input', {
      type: 'checkbox',
      checked: value.enabled,
      disabled: !ready,
      onChange: (event: any) => set('enabled', event.target.checked),
      style: { width: 18, height: 18 },
    })),
    row('字号 fontPx', '越大越易读、每页字数越少（每页 384 token）', createElement('select', {
      value: String(value.fontPx),
      disabled: !ready,
      onChange: (event: any) => set('fontPx', Number(event.target.value)),
      style: inputStyle,
    }, FONT_SIZES.map((size) => createElement('option', { value: String(size), key: String(size) }, `${size}px`)))),
    row('最小字符数 threshold', '短于此长度的消息保持纯文本发送', createElement('input', {
      type: 'number',
      min: 100,
      step: 100,
      value: String(value.threshold),
      disabled: !ready,
      onChange: (event: any) => set('threshold', Math.max(100, Math.round(Number(event.target.value) || 0))),
      style: { ...inputStyle, width: 110 },
    })),
    row('最多页数 maxPages', '1–20（DSH 附件上限 20 张/消息）；超出自动回退纯文本', createElement('input', {
      type: 'number',
      min: 1,
      max: 20,
      step: 1,
      value: String(value.maxPages),
      disabled: !ready,
      onChange: (event: any) => set('maxPages', Math.min(20, Math.max(1, Math.round(Number(event.target.value) || 1)))),
      style: { ...inputStyle, width: 110 },
    })),
  )
}
