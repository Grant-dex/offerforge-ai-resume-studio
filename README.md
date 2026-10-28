# OfferForge AI Resume Studio

AI 驱动的在线简历编辑器，支持多模板实时预览、AI 评分优化、PDF/Word 导出。

**在线地址：** https://d4552228.offerforge-ai-resume-studio.pages.dev

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
- 章节写作参考、联系信息与日期检查
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

**注意：** 本地开发时不存在 Cloudflare Functions，登录和 AI 功能需部署到 Cloudflare Pages 后使用。

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
wrangler pages secret put RESEND_API_KEY       # Resend API Key（可选）
```

### 5. 部署

```bash
npm run build
wrangler pages deploy dist
```

管理后台地址：`https://xxx.pages.dev/admin/`

## 许可证

MIT
