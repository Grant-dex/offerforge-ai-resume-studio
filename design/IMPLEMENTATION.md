# 三套简历模板：实现说明

三套纸面已经按之前的样稿落地，切换模板**只改排版，不改内容**。

| key | 名称 | 章节顺序 | 纸面 |
|---|---|---|---|
| `focus` | 暖纸衬线 | 简介 → 工作 → 项目 → 教育 → 技能 | 暖白 `#FBF8F3`，宋体标题，陶土红 `#A8452B`，01–05 编号 |
| `stack` | 冷灰网格 | 项目 → 简介 → 工作 → 技能 → 教育 | 纯白，左栏英文标签 + 右侧内容，靛蓝 `#1F4FD8` |
| `lead` | 墨绿商务 | 教育 → 简介 → 项目 → 工作 → 技能 | 墨绿 `#1E3A33` 头图，菱形章节锚点 |

## 改了哪些文件

```
src/components/resume/          新增，三套模板 + 共用数据层
  index.tsx                     ResumeDocument 调度
  shared.tsx                    数据清洗、空章节判定、编辑按钮
  Editorial.tsx                 A · 暖纸衬线
  Swiss.tsx                     B · 冷灰网格
  DeepGreen.tsx                 C · 墨绿商务
src/resume-paper.css            新增，三套纸面的全部样式
src/data/resumeTemplates.ts     模板元数据：名称、顺序、配色、Word 用字号
src/components/LivePreview.tsx  改为渲染 ResumeDocument
src/components/TemplatePicker.tsx  缩略图改成三套真实纸面的小样
src/utils/pdf.ts                快照保留模板底色，不再强刷白底
src/utils/exportWord.ts         跟着模板换强调色、标题字体、分隔线
src/data/defaultResume.ts       修掉示例数据里的倒挂日期与 "Your Role" 占位
src/shell-theme.css             新增：网页外壳（方案 C）配色与字标
src/App.tsx                     根节点加 data-template，供外壳切换强调色
src/main.tsx                    引入 shell-theme.css
tests/templates.test.ts         新增：三套模板互不重复、key 稳定
```

## 交互变化

- 编辑按钮从"常驻"改成**悬停/键盘聚焦才出现**；触屏设备仍然常显（`@media (hover:none)`）。
- 当前章节用纸面侧重条标记，不再整块灰底加虚线。
- 导出 PDF 时会移除编辑按钮、清除选中态，但保留纸面底色与深色头图。

## 验证记录

- `npm run build` 通过（tsc + vite）。
- `npm test`：57 项全过（新增 2 项模板测试）。
- 1440px 下三套预览均正好 1123px（A4），无示例页脚导致的空白第二页。
- 导出的 PDF：三套各 1 页，暖纸底色 / 深绿头图都正确。
- 导出的 Word：文档内确认写入对应强调色与宋体标题。
- 分享链接：模板随链接传递，打开后仍是同一套纸面。
- 390px 手机端：编辑/预览切换正常，纸面自动改为单列。

## 网页外壳（方案 C）

- 外壳固定为暖纸风：底色 `#F3EEE5`、分隔线 `#E5DED1`、字标宋体。
- 只有强调色跟随模板：`focus` 陶土红 `#A8452B` / `stack` 靛蓝 `#1F4FD8` / `lead` 墨绿 `#1E3A33`。
- 强调色出现在：主按钮、当前章节、当前工具页签、模板选中态、输入框聚焦、移动端视图切换。
- 实现方式：`src/shell-theme.css` 定义 `--shell-*` 变量，根节点 `data-template` 决定强调色；布局与逻辑零改动。

## 已知限制

- **Word 是简化版**：docx 只能近似纸面，深色头图、双栏在 Word 里会退化成普通段落。需要完全一致时用 PDF。
- **PDF 是图片版**：文字不可选、ATS 解析不到（你已说明不需要 ATS）。
- 纸面不再放 OfferForge 页脚，避免出现在用户的简历上、也避免多出一页。
- 中文衬线依赖系统字体（Songti SC / 宋体），Windows 和 macOS 观感略有差异。

## 模板外观与章节顺序（拆分）

- **模板只决定纸面外观**：暖纸衬线 / 冷灰网格 / 墨绿商务；切换不再改变章节顺序。
- **章节顺序独立保存**：`sectionOrder` + `orderPreset`，三档预设（工作优先 / 项目优先 / 教育优先）与手动上移、下移；手动调整后显示“自定义”。
- **随数据走**：草稿快照、当前草稿、JSON 备份、分享链接都带顺序；A4 预览、PDF、Word 复用同一份顺序。
- **兼容旧数据**：旧草稿 / 旧分享链接 / 旧备份缺少顺序字段时，按原模板隐含的顺序恢复；旧草稿首次加载即固化，之后切换模板不会改动。
- **统一校验**：`normalizeSectionOrder` 去重、丢弃未知值、补齐缺项，始终得到完整五项；预设标签只在顺序仍匹配时保留。
- **测试环境**：`tests/ts-resolve.mjs` 为 Node 直接运行的 TS 测试补上无扩展名相对导入的解析。

改动文件：`src/data/sectionOrder.ts`（新）、`resumeTemplates.ts`、`resumeStore.ts`、`draftLibrary.ts`、`resumeBackup.ts`、`resumeShare.ts`、`exportWord.ts`、`resume/index.tsx`、`LivePreview.tsx`、`TemplatePicker.tsx`、`Sidebar.tsx`、`SharedResume.tsx`、`PreviewExport.tsx`，以及对应测试。

## 预览 → 条目定位（条目级编辑入口）

- **入口**：工作 / 项目经历在 A4 预览里各有一个铅笔按钮，位置来自隐藏源文档的 `data-entry-id` 测量。
- **不随缩放变小**：按钮放在未缩放的 `.a4-overlay` 浮层，任意缩放（41%–125%）下保持 24×24。
- **跨页条目只出现一次**：按钮只在条目起始页渲染。
- **点击后的动作**：切到编辑视图 → 跳到对应章节 → 展开目标条目 → 滚动到可见 → 聚焦首个输入框 → 1.8 秒轻微高亮。
- **稳定定位**：按 `id` 查找，不依赖数组序号；条目已被删除时提示且绝不回退到其它条目。
- **导出隔离**：浮层在导出快照（`#resume-preview`）之外，PDF / Word / 分享页都不含编辑入口。
