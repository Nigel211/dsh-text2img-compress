# Changelog

All notable changes to this project are documented here.
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)；版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [0.1.2] - 2026-08-22

### Changed
- `fontPx` 范围扩展为 12–28（1px 步进）：支持 13px 等奇数字号（README 对照表与设置项对齐），
  12–13px 为更省 token 的高压档位（识别精度建议实测）。
- README 示例节新增中/英文 × 13px/18px 四格对照表，如实标注英文 18px 无收益（0.96×）。

## [0.1.1] - 2026-08-22

### Added
- `maxPages` 设置项（1–20，默认 10）：超过后自动回退纯文本，由 DSH 附件单消息 20 图上限约束。
- DSH 设置面板新增 **「文本转图压缩 · Text-as-Image」** 设置页：enabled / fontPx / threshold / maxPages 全部可视化编辑，与输入框「图」开关实时同步。
- 输入框「图」开关 title 精简；threshold / maxPages 只保留在设置页。

### Changed
- 字号范围扩展为 14–28（UI 下拉 14/16/18/20/22/24）。
- 中英文 README：新增设置表、修正每页字数/页数上限的估算，补充缓存安全与上下文压缩说明。

## [0.1.0] - 2026-08-22

### Added
- 首发：`dsh-text2img-compress`——把长文本渲染成 800×800 图片发送，利用每图 384 token 封顶压缩 LLM 输入 token。
- Host：`agent/pre-step` 拦截替换，失败一律回退纯文本；非视觉模型自动跳过；词边界换行。
- Client：输入框右侧「图」开关 + 字号下拉（经 DSH settings 持久化）。
- 中英双语 README；准确率基准说明（`bench/README.md`）。
