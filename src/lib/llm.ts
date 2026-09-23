/* 大模型接入:OpenAI 兼容的 /chat/completions 协议,覆盖 OpenAI / DeepSeek / Kimi
   智谱 GLM / 通义 / SiliconFlow 等绝大多数服务商,可通过自定义 baseUrl 切换。 */

export interface LlmConfig {
  baseUrl: string
  apiKey: string
  model: string
  enabled: boolean
}

const LS_KEY = 'atoms.llm'

const DEFAULTS: LlmConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  enabled: false,
}

export function getLlmConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<LlmConfig>) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveLlmConfig(cfg: LlmConfig) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg))
  } catch {
    /* ignore */
  }
}

export function clearLlmConfig() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    /* ignore */
  }
}

export function llmReady(): boolean {
  const c = getLlmConfig()
  return !!(c.enabled && c.apiKey.trim() && c.model.trim() && c.baseUrl.trim())
}

export interface ChatOptions {
  cfg?: LlmConfig
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
}

export async function chat(
  messages: { role: string; content: string }[],
  opts: ChatOptions = {},
): Promise<string> {
  const cfg = opts.cfg ?? getLlmConfig()
  if (!cfg.apiKey.trim()) throw new Error('尚未配置 API Key')
  if (!cfg.model.trim()) throw new Error('尚未配置模型名称')

  const url = cfg.baseUrl.trim().replace(/\/+$/, '') + '/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + cfg.apiKey.trim(),
    },
    body: JSON.stringify({
      model: cfg.model.trim(),
      messages,
      temperature: opts.temperature ?? 0.7,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      stream: false,
    }),
    signal: opts.signal,
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    const hint = txt.slice(0, 300)
    if (res.status === 401) throw new Error('API Key 无效或无权访问(401)')
    if (res.status === 402) throw new Error('账户余额不足(402),请前往平台充值后重试')
    if (res.status === 404) throw new Error('接口不存在(404),请检查 baseUrl 是否以 /v1 结尾')
    if (res.status === 429) throw new Error('请求过于频繁或额度不足(429)')
    throw new Error('请求失败 ' + res.status + ':' + hint)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('返回内容为空')
  return content
}

export async function testConnection(cfg: LlmConfig): Promise<{ ok: boolean; msg: string }> {
  const t0 = Date.now()
  try {
    const out = await chat(
      [{ role: 'user', content: '请只回复两个字母:OK' }],
      { cfg, temperature: 0, maxTokens: 16 },
    )
    const ms = Math.max(1, Math.round((Date.now() - t0) / 100) / 10)
    return { ok: true, msg: `连接成功(${ms}s) · 回复:${out.trim().slice(0, 20) || '(空)'}` }
  } catch (e) {
    return { ok: false, msg: (e as Error).message }
  }
}