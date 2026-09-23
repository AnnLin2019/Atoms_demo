import { useState } from 'react'
import {
  clearLlmConfig,
  getLlmConfig,
  saveLlmConfig,
  testConnection,
  type LlmConfig,
} from '../lib/llm'

const PRESETS = [
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: 'Moonshot / Kimi', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { label: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
]

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg] = useState<LlmConfig>(() => getLlmConfig())
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [saved, setSaved] = useState(false)

  function applyPreset(p: { baseUrl: string; model: string }) {
    setCfg((c) => ({ ...c, baseUrl: p.baseUrl, model: p.model }))
    setResult(null)
  }

  async function handleTest() {
    setTesting(true)
    setResult(null)
    const r = await testConnection({ ...cfg, enabled: true })
    setResult(r)
    setTesting(false)
  }

  function handleSave() {
    setSaving(true)
    saveLlmConfig(cfg)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => onClose(), 600)
    }, 350)
  }

  function handleClear() {
    clearLlmConfig()
    setCfg({ baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini', enabled: false })
    setResult(null)
    setTimeout(onClose, 250)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>🤖 大模型设置</h3>
          <button className="modal-x" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="modal-sub">
          AI 生成需要接入一个大模型 API(OpenAI 兼容协议)。Key 仅保存在你的浏览器本地,不会上传。
        </p>

        <div className="field">
          <label>服务商</label>
          <div className="preset-row">
            {PRESETS.map((p) => (
              <button key={p.label} className="chip preset" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Base URL(以 /v1 结尾)</label>
          <input
            className="input"
            value={cfg.baseUrl}
            onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            spellCheck={false}
          />
        </div>

        <div className="field">
          <label>API Key</label>
          <input
            className="input mono"
            type="password"
            value={cfg.apiKey}
            onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })}
            placeholder="sk-…"
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label>模型名称</label>
          <input
            className="input mono"
            value={cfg.model}
            onChange={(e) => setCfg({ ...cfg, model: e.target.value })}
            placeholder="gpt-4o-mini"
            spellCheck={false}
          />
        </div>

        <label className="switch-row">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
          />
          <span>启用 AI 生成</span>
        </label>

        {result && (
          <div className={'mini-result ' + (result.ok ? 'ok' : 'err')}>
            {result.ok ? '✅ ' : '❌ '}
            {result.msg}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn ghost" onClick={handleTest} disabled={testing || !cfg.apiKey.trim()}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          <button className="btn ghost" onClick={handleClear}>
            清除配置
          </button>
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中…' : saved ? '已保存 ✓' : '保存'}
          </button>
        </div>
        <p className="modal-note">没有 Key?保存空配置后将使用内置模板引擎(离线可用)。</p>
      </div>
    </div>
  )
}