# 提交到 awesome-dsh-plugin 指南

[curated list](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)（社区 DSH 插件精选，收录后与 dsh-market 市集联动）。

## 硬门槛（CI 自动检查）

1. `package.json` 声明 `dsh.bundle` manifest —— ✅ 本仓库已有（`dsh.bundle.patch` + `cordis.patch.yml`）；
2. 仓库**创建满 1 天** 且 **提交数 ≥ 10** —— ✅ 已补齐（`git rev-list --count HEAD` 确认）；
3. 仓库添加 `dsh-plugin` topic —— 需在 GitHub 仓库设置（About → Topics）手动添加；
4. 每个 PR 最多 3 条；本插件 1 条即可。

## 提交文件（新建于 awesome 仓库）

`data/plugins/Nigel211__dsh-text2img-compress.yml`：

```yaml
url: https://github.com/Nigel211/dsh-text2img-compress
name: Nigel211/dsh-text2img-compress
category: usage
description:
  en: Converts long user messages into 800×800 text images before they reach the model, leveraging DeepSeek's 384-token-per-image cap to cut input tokens ~4-5x (cache-safe) — with a composer toggle, a settings page, and automatic plain-text fallback.
  zh: 把长用户消息在进模型前渲染为 800×800 文字图片，利用每图 384 token 封顶把输入 token 压缩约 4-5 倍（不影响 prompt 缓存）——带输入框开关、设置页，超限自动回退纯文本。
```

## 步骤

```powershell
# 1. fork awesome-dsh-plugin 并 clone
git clone https://github.com/<你的用户名>/awesome-dsh-plugin.git
cd awesome-dsh-plugin

# 2. 新建文件：data/plugins/Nigel211__dsh-text2img-compress.yml（内容如上）
# 3. 生成 README（仓库根目录）
node scripts/generate-readme.mjs

# 4. 可选：截图进 data/screenshots.json（key 为条目 url；不填则市场从 README 自动抽图）
#    建议 key: "https://github.com/Nigel211/dsh-text2img-compress"
#    ["https://raw.githubusercontent.com/Nigel211/dsh-text2img-compress/main/assets/example-page.png"]

# 5. 提交并开 PR（branch 随便，建议 submissions/text2img-compress）
git checkout -b submissions/text2img-compress
git add data/plugins/Nigel211__dsh-text2img-compress.yml README.md README.en.md
git commit -m "list: add Nigel211/dsh-text2img-compress"
git push origin submissions/text2img-compress
```

CI 失败时按输出修（`dsh.bundle` 检查、格式、双语一致性），推同一分支即可，不用重开 PR。

## 与同类插件的差异（描述里已体现）

- 压缩的是**用户消息输入**（text-as-image，视觉载体），不是工具输出（`dsh-headroom` / `dsh-compressor` 风格）；
- 不依赖语义总结（`dsh-compaction` / `billion-context-dsh` 风格），内容逐字都在图里；
- 对 prompt cache 前缀零影响（只替换最新消息）。
