# Atoms Demo · 把想法变成产品

<div align="center">

<a href="https://AnnLin2019.github.io/Atoms_demo/">
 <img src="https://img.shields.io/badge/在线演示-Live_Now-7c5cff?style=for-the-badge" alt="在线演示" />
</a>
<a href="https://github.com/AnnLin2019/Atoms_demo/actions/workflows/deploy.yml">
 <img src="https://github.com/AnnLin2019/Atoms_demo/actions/workflows/deploy.yml/badge.svg?branch=main" alt="部署状态" />
</a>
<br />
<img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
<a href="./LICENSE">
<img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="License" />
</a>

</div>

基于 [Atoms](https://atoms.dev/) / MGX 理念打造的**下一代 AI Agent 平台演示** —— 用智能体驱动的方式把想法变成可运行的应用,全程无需编码。

🔗 **在线演示**:https://AnnLin2019.github.io/Atoms_demo/

> 📄 简要使用说明见 [docs/使用说明.md](docs/使用说明.md)

## ✨ 功能特性

- **完整使用流程**:初始化 → 注册 → 登录 → 核心主流程(想法 → AI 团队 → 上线)
- **虚拟 AI 团队**:领队 Mike、研究员 Iris、产品经理 Emma、架构师 Bob、工程师 Alex、数据分析师 David,双栏实时展示各自工作状态
- **真实大模型接入(可选)**:支持 OpenAI 兼容协议,一键接入 OpenAI / DeepSeek / Moonshot(Kimi)/ 智谱 GLM / SiliconFlow 等,由大模型现场编写专属代码;未配置时自动回退到内置模板引擎
- **模板引擎(离线可用)**:根据想法关键词,真正「生成」10 个可运行、可交互的应用(待办、笔记、天气、健身、记账、仪表盘、落地页、社区、习惯打卡、通用应用)
- **实时预览 + 代码 + 发布**:沙箱 iframe 预览、带语法高亮的文件树代码视图;「发布」生成可访问、可分享的自包含链接,并可下载独立 HTML 文件
- **项目导入 / 导出**:单个项目或全部项目一键导出为 JSON,可随时导入还原(数据迁移、备份)
- **对话式迭代**:上线后仍可用自然语言提需求(例如「把主题改成绿色」),AI 实时调整并同步预览
- **本地持久化**:账号、会话、项目、模型配置均存于 localStorage,刷新不丢失、离线可用

## 🚀 运行

```bash
npm install     # 安装依赖
npm run dev     # 启动开发服务器(默认 http://localhost:5173)
```

生产构建与预览:

```bash
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

端到端自动化验证(首次需 `npx playwright install chromium`):

```bash
npm run test:e2e                                              # 默认针对线上 demo
BASE_URL=http://localhost:5173 npm run test:e2e               # 针对本地开发服务器
```

## 🤖 接入真实大模型(可选)

1. 登录进入工作台 → 点击「🤖 模型设置」
2. 选择服务商预设(或手动填写)Base URL、API Key、模型名,点击「测试连接」验证通过后「保存」
3. 新建项目时勾选「大模型实时生成」,AI 团队便由大模型按你的需求现场编写专属代码

**说明**:

- 采用 **OpenAI 兼容协议**(`POST /chat/completions`),可覆盖绝大多数国内外模型服务商
- API Key **仅保存在浏览器 localStorage 中,不会上传到任何服务器**
- 一次结构化 JSON 调用返回完整应用(标题 / 调研 / 需求 / 架构 / HTML / CSS / JS),再按时间线逐步「揭示」以保留多智能体的观感
- 未配置 Key 或配置错误时,自动**回退到内置模板引擎**(完全离线可用),不影响使用

常用服务商参考:

| 服务商      | Base URL                              | 模型示例           |
| ----------- | ------------------------------------- | ------------------ |
| OpenAI      | `https://api.openai.com/v1`           | `gpt-4o-mini`      |
| DeepSeek    | `https://api.deepseek.com/v1`         | `deepseek-chat`    |
| Moonshot    | `https://api.moonshot.cn/v1`          | `moonshot-v1-8k`   |
| 智谱 GLM    | `https://open.bigmodel.cn/api/paas/v4`| `glm-4-flash`      |
| SiliconFlow | `https://api.siliconflow.cn/v1`       | `deepseek-v3` 等   |

## 📥📤 项目导入 / 导出

- **导出**:工作台每个项目卡片右上角「📤」导出单项目;顶部「📤 导出全部」导出全部项目为一份 JSON
- **导入**:顶部「📥 导入」选择之前导出的 `.json` 文件,自动还原到当前账户

## 🌐 在线访问 / 部署

本项目是纯前端静态应用(`base: './'`),可部署到任意静态托管,获得可测试的在线访问链接。构建后 `dist/` 目录即可直接上线:

- **GitHub Pages** / **Vercel** / **Netlify** / **Cloudflare Pages**:拖拽或连接仓库即可,无需服务器
- 生成的单个应用也可在「发布」视图**下载为独立 HTML**,双击离线运行,或单独托管到任意静态空间

> 说明:本演示无后端。「发布」生成的是**自包含分享链接**——应用完整代码被压缩内嵌于链接,由本站 `/view` 路由独立渲染,任何人打开即可运行;也可下载单文件 HTML 或用 `dist/` 托管到任意静态空间获得更短域名。

## 🧭 使用流程

1. 打开首页 → 点击「开始使用」注册账户(演示用本地存储,任意邮箱 + 6 位以上密码)
2. 登录后进入工作台,点击「新建项目」
3. 输入一句想法(或点击示例),例如:`帮我做一个健身追踪应用`
4. 观察 AI 团队协同工作:研究 → 需求 → 架构 → 编码 → 增长 → 上线
5. 在右侧切换「预览 / 代码 / 发布」三个视图,体验成品
6. 在底部对话框继续提需求,让 AI 迭代(如:`把主题改成绿色`)

## 🗂 技术栈

- **React 18 + TypeScript + Vite** · HashRouter 路由
- 零 UI 框架依赖,手写设计系统(CSS 变量 + 深色主题)
- 真实大模型调用(OpenAI 兼容协议,浏览器原生 `fetch`)见 `src/lib/llm.ts` 与 `src/lib/aiGenerate.ts`
- 智能体构建流程引擎见 `src/lib/engine.ts`,模板引擎见 `src/lib/templates.ts`

## 📁 目录结构

```
src/
  components/    # Landing / AuthForm / Onboarding / Projects / SettingsModal /
                 # Studio 及 AgentPanel / PreviewPane / CodeView / CommandBar
  lib/
    agents.ts    # AI 团队定义
    templates.ts # 应用模板库(10 个可运行应用)与组装逻辑
    engine.ts    # 多智能体构建流程引擎(模板 / 大模型双通道)
    aiGenerate.ts# 大模型结构化生成(单个 JSON 产出完整应用)
    llm.ts       # OpenAI 兼容协议客户端 + 配置存取
    store.ts     # localStorage 持久化(账号 + 会话 + 项目)与导入/导出
    auth.tsx     # 认证上下文
    highlight.tsx# 语法高亮
  styles/global.css
```