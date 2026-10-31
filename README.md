# OfferForge AI Resume Studio

AI 驱动的在线简历编辑器，支持多模板实时预览、AI 评分优化、PDF/Word 导出。

**在线地址：** https://offerforge-ai-resume-studio.pages.dev

## 技术栈

### 前端
- **React 18** + **TypeScript**
- **Vite 6** 构建工具
- **Tailwind CSS 3** 样式框架
- **Zustand** 状态管理（localStorage 持久化）
- **React Router** Hash 路由
- **html2canvas + jsPDF** PDF 导出
- **docx** Word 导出

### 后端
- **Cloudflare Pages Functions** 边缘计算
- **Cloudflare D1** SQLite 数据库
- **JWT**（jose）用户认证 + 管理员认证
- **PBKDF2 + SHA-256** 密码哈希（100,000 轮）
- **Resend** 邮件发送（可选）

### AI 集成
- **DeepSeek API**（兼容 Anthropic 格式）
- AI 评分、简历优化建议、JD 匹配度分析
- 后端代理模式（API Key 不暴露到前端）

## 功能

- 多步骤简历编辑器：基本信息 → 工作经历 → 项目经历 → 技能教育 → 预览导出
- 白色 / 浅灰色工作区：桌面大纲、实时预览、编辑三栏；手机与平板支持编辑 / 预览切换
- 3 种简历结构：经典单栏、项目优先、教育优先；切换保留已有内容
- AI 简历评分（5 维度打分）
- AI 优化建议（逐条确认，精确替换原文，可撤销）
- JD 匹配度分析
- 邮箱验证码登录
- PRO 会员付费门禁
- 管理后台（用户管理、数据统计、操作日志）
- 章节写作参考、联系信息与日期检查；日期与邮箱字段离开焦点时提示错误，支持至今选项、真实日历日期和年月精度
- 分享链接（隐藏电话与邮箱并保留模板）、A4 图片版 PDF、可编辑 Word 导出
- 导出组件按需加载，浏览器本地保存内容与模板选择
- 每份草稿独立保存模板，支持复制简历、恢复旧草稿入口和保存失败提示
- 分享时可选择是否包含联系方式与头像，内容变化后需重新生成链接
- 表单底部支持上一步 / 下一步，写作工具支持方向键切换
- 经历卡片可折叠、上移 / 下移和撤销移除，允许省略工作或项目章节
- 下载当前简历 JSON 备份，导入时保留原简历并新建独立草稿；文件仅在本机处理
- 预览章节提供直接编辑入口，编辑按钮不会进入 PDF 或分享页面

## 项目结构

```
OfferForge/
├── index.html                    # HTML 入口 + CSP
├── src/
│   ├── main.tsx                  # React 入口
│   ├── App.tsx                   # 主布局
│   ├── pages/                    # 页面组件
│   │   ├── BasicInfo.tsx         # 个人信息
│   │   ├── WorkExperience.tsx    # 工作经历
│   │   ├── ProjectExperience.tsx # 项目经历
│   │   ├── SkillsEducation.tsx   # 技能与教育
│   │   ├── PreviewExport.tsx     # 模板选择 + 导出
│   │   └── SharedResume.tsx      # 分享页面
│   ├── components/               # UI 组件
│   │   ├── LivePreview.tsx       # 实时预览（3 个模板）
│   │   ├── Sidebar.tsx           # 左侧边栏
│   │   ├── TopBar.tsx            # 顶部操作栏
│   │   ├── AIAnalysisPanel.tsx   # AI 分析面板
│   │   └── ...
│   ├── store/resumeStore.ts      # Zustand 状态管理
│   ├── utils/
│   │   ├── ai.ts                 # AI 调用（前端 → 后端代理）
│   │   ├── auth.ts               # 登录 API
│   │   ├── theme.ts              # 品牌色系统
│   │   ├── proGate.ts            # PRO 门禁
│   │   ├── pdf.ts                # PDF 导出
│   │   └── exportWord.ts         # Word 导出
│   └── types/resume.ts           # TS 类型定义
├── functions/api/                # Cloudflare Functions
│   ├── [[path]].js               # 主 API（登录/验证码）
│   ├── ai/[[path]].js            # AI 代理
│   └── admin/[[path]].js         # 管理后台 API
├── admin/                        # 管理后台前端
├── cloudflare/schema.sql         # D1 建表语句
└── wrangler.toml                 # Cloudflare 配置
```

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 打开 http://127.0.0.1:5173/
```

本地 AI 功能由 Vite 服务端代理提供：

1. 复制 `.env.example` 为 `.env.local`，填写服务端变量 `AI_API_KEY`。不要使用 `VITE_` 前缀。
2. 执行 `npm run dev`，打开终端显示的本机地址（默认 `http://127.0.0.1:5173/`）。
3. 在“岗位建议”中使用简历评分、修改建议和岗位匹配。本机模式不依赖登录或会员，服务仅接受本机、同源请求。
4. 更换 `.env.local` 中的密钥后，Vite 会重新加载配置；若未生效，重启开发服务。

`npm run preview` 或普通静态服务器仅预览页面，不提供 AI 后端。生产环境提供限额 AI 试用，并保留原有会员权限；在 Pages Secrets 中设置 `AI_API_KEY`。可选模型变量为 `DEEPSEEK_MODEL_FLASH`（默认 `deepseek-flash`）和 `DEEPSEEK_MODEL_PRO`（默认 `deepseek-v4-pro`）。

密钥错误、余额不足、请求限流、超时及返回格式错误会显示明确提示，不会生成虚构评分。分析文本不包含姓名、电话、邮箱和头像；调用会使用 DeepSeek 账户的额度。

本地地址仅在运行服务器的电脑上可用，关闭开发服务器后将无法打开。分享给他人需要部署后的 HTTPS 地址。

### 验证修改

使用 Node.js 22.6+：

```bash
npm run build
npm test
```

测试覆盖 AI 建议定位、过期内容防覆盖、撤销保护、后端会员与登录门禁、草稿存储兼容与失败处理、备份校验与恢复、经历排序与恢复、分享链接校验，以及 PDF 分页边界。

## 部署

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 2. 创建 D1 数据库

```bash
wrangler d1 create offerforge-db
# 将返回的 database_id 填入 wrangler.toml
```

### 3. 初始化数据库

```bash
wrangler d1 execute offerforge-db --remote --file cloudflare/schema.sql
```

### 4. 配置 Secrets

```bash
wrangler pages secret put JWT_SECRET          # JWT 签名密钥
wrangler pages secret put AI_API_KEY           # DeepSeek API Key
wrangler pages secret put ADMIN_PASSWORD       # 管理后台初始密码
wrangler pages secret put PRO_EMAILS           # 可选：自动开通 PRO 的邮箱，逗号分隔
wrangler pages secret put RESEND_API_KEY       # Resend API Key（可选）
```

### 5. 部署

```bash
npm run deploy
```

该命令会先构建再发布到生产环境。注意 Pages 项目的生产分支是 `production`，手动执行 `wrangler pages deploy` 时若分支名写错会只进入 Preview 环境。

管理后台地址：`https://xxx.pages.dev/admin/`

## 许可证

MIT

### A4 预览与分页

- 工作区按固定宽度排版并逐页显示 A4，支持适应宽度、75%、100% 和 125% 缩放；缩放与窗口大小不改变换行。
- 预览与 PDF 共用纸张、10 mm 页边距和文字行分页规则；短经历与标题尽量同行，长段落在文字行之间续页，适用于白色、暖纸和墨绿模板。
- 分享页继续采用适合阅读的响应式布局。PDF 仍为图片版，Word 为可编辑版本。
- 三种模板均显示工作城市与独立的经验概述；有头像时为姓名及职位预留空间。

### 公开 AI 试用

- `wrangler.toml` 中启用 `AI_TRIAL_ENABLED` 后，访客无需登录即可试用。默认每个 IP 每个 UTC 日 6 点、全站每日 60 点；简历分析消耗 2 点，岗位匹配消耗 1 点。额度按发起的模型请求计数。
- 匿名试用始终使用极速模型。D1 在同一条条件写入中检查个人和全站额度；数据库只记录按日加盐的网络地址摘要，不保存原始 IP 或简历内容。
- 首次发布前执行：`npx wrangler d1 execute offerforge-db --remote --file cloudflare/migrations/20261031_ai_trial.sql`。
- 关闭 `AI_TRIAL_ENABLED` 可恢复仅登录且已授权会员使用 AI。密钥始终位于服务端 Secrets。
