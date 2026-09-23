import { chat, type LlmConfig } from './llm'
import type { TemplatePart } from './templates'

export interface AIGeneration {
  title: string
  research: string[]
  spec: string[]
  arch: string[]
  part: TemplatePart
}

const SYSTEM = `你是一名资深全栈工程师兼产品负责人。根据用户的一句话需求,直接产出一个完整、可运行、可交互的单页 Web 应用。

硬性要求:
1. 只输出一个合法的 JSON 对象,不要任何解释、前言、或 Markdown 代码块标记(不要 \`\`\`)。
2. JSON 结构必须严格如下:
{
  "title": "应用名称(5~14个汉字)",
  "research": ["调研结论1", "调研结论2", "调研结论3"],
  "spec": ["功能点1", "功能点2", "功能点3", "功能点4"],
  "arch": ["技术或模块方案1", "技术或模块方案2", "技术或模块方案3"],
  "html": "应用 body 内部的 HTML 标记(不含 <html>/<head>/<body> 标签)",
  "css": "完整 CSS 样式",
  "js": "应用交互逻辑 JavaScript(原生 JS,无需 import/export)"
}
3. html/css/js 三者必须互相配合,保证应用真正可用、可交互(例如增删改查、筛选、统计、图表、表单校验等实际功能),严禁纯静态展示。页面初始需有内容或示例数据。
4. js 内部禁止使用 localStorage;请使用外部已注入的全局安全存储对象 store:
   - store.get(key, 默认值) 返回字符串(未设置时返回默认值)
   - store.set(key, 字符串值)
   - store.del(key)
   需要持久化时读写 store,并自行 JSON.parse / JSON.stringify。
5. 界面使用深色主题,请通过 CSS 变量适配主题,不要在颜色上写死:
   变量名(需在 css 的 :root 中给出默认值):
   --bg --card --card2 --text --muted --border --accent --accent-2 --accent-soft --accent-soft-2
6. 只使用原生 HTML/CSS/JS,不要引用任何外部资源、字体、CDN、库或图片。
7. 响应式友好、视觉现代、排版精致;图标用 emoji 即可。
8. 确保 js 语法正确、能直接运行;html 内不要出现 <script> 或 <style> 标签(css/js 已分离)。`

function buildUserPrompt(idea: string): string {
  return '请根据以下需求生成应用:\n\n「' + idea.trim() + '」\n\n直接输出 JSON。'
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}
function arr(v: unknown, min: number): string[] {
  const a = Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []
  while (a.length < min) a.push(a.length === 0 ? '核心功能实现' : '体验与交互优化')
  return a
}

function extractJson(text: string): unknown {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  const s = t.indexOf('{')
  const e = t.lastIndexOf('}')
  if (s >= 0 && e > s) t = t.slice(s, e + 1)
  return JSON.parse(t)
}

export async function generateApp(
  idea: string,
  cfg: LlmConfig,
  signal?: AbortSignal,
): Promise<AIGeneration> {
  const raw = await chat(
    [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: buildUserPrompt(idea) },
    ],
    { cfg, signal, temperature: 0.8, maxTokens: 8000 },
  )

  let data: any
  try {
    data = extractJson(raw)
  } catch {
    throw new Error('大模型返回了非 JSON 内容,解析失败')
  }

  const part: TemplatePart = { html: str(data?.html), css: str(data?.css), js: str(data?.js) }
  if (!part.html || !part.css) throw new Error('大模型返回的应用结构不完整')

  return {
    title: str(data?.title) || idea.trim().slice(0, 12),
    research: arr(data?.research, 3),
    spec: arr(data?.spec, 4),
    arch: arr(data?.arch, 3),
    part,
  }
}