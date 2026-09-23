import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../lib/auth'
import { createProject } from '../lib/engine'
import { saveProject } from '../lib/store'
import { llmReady } from '../lib/llm'
import { matchIdea } from '../lib/templates'
import { AGENTS } from '../lib/agents'

const SUGGESTIONS = [
  '帮我做一个健身追踪应用',
  '做一个漂亮的电商落地页',
  '帮我做一个待办清单',
  '做一个个人博客',
  '帮我做一个月度记账本',
  '做一个数据分析仪表盘',
  '帮我做一个天气查询应用',
  '做一个习惯养成打卡应用',
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [idea, setIdea] = useState('')
  const [starting, setStarting] = useState(false)
  const [useAi, setUseAi] = useState<boolean>(() => llmReady())

  // 该想法是否命中内置模板;未命中时明确引导用户走大模型,而非静默生成通用占位页
  const matched = useMemo(() => !idea.trim() || matchIdea(idea.trim()).matched, [idea])

  // 未命中模板且已配置大模型时,默认自动开启「大模型实时生成」
  useEffect(() => {
    if (!matched && llmReady() && !useAi) setUseAi(true)
  }, [matched, useAi])

  async function start() {
    const v = idea.trim()
    if (!v || !user || starting) return
    setStarting(true)
    // 创建项目(进入 building 状态),随后在 Studio 中由智能体实时构建
    const gen = useAi && llmReady() ? 'ai' : 'template'
    const project = createProject(user.id, v, gen)
    saveProject(project)
    // 短暂停顿营造「初始化团队」的仪式感
    setTimeout(() => navigate(`/app/${project.id}`), 500)
  }

  return (
    <div className="onboard">
      <div className="ob-top">
        <Link to="/app" className="brand">
          <Logo size={30} />
          <span className="brand-name">Atoms</span>
        </Link>
        <span className="chip">第一步 · 初始化</span>
      </div>

      <div className="ob-main">
        <div className="ob-card">
          <span className="ob-step">⚡ 初始化你的 AI 团队</span>
          <h1>告诉 AI,你想做什么?</h1>
          <p className="ob-sub">
            用一句话描述你的想法。你的 AI 团队(研究员 → 产品经理 → 架构师 → 工程师)将接手,
           几分钟内把它变成可运行的应用。
          </p>

          <textarea
            className="ob-input"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="例如:帮我做一个可以记录每日饮水量并生成周报的健康应用…"
            autoFocus
            maxLength={200}
          />

          <div className="ob-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => setIdea(s)}>
                {s}
              </button>
            ))}
          </div>

          {!matched && (
            <div className="ob-warn">
              {llmReady()
                ? '这个想法暂未匹配到内置模板,已为你自动开启「大模型实时生成」,由大模型现场编写专属应用。'
                : '这个想法暂未匹配到内置模板,继续将生成一个通用占位页(无实际功能)。建议先在工作台「模型设置」填入 API Key,并开启下方「大模型实时生成」,获得真正可用的应用。'}
            </div>
          )}

          <label className="gen-toggle">
            <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} />
            <div>
              <div className="gt-title">
                大模型实时生成
                {llmReady() ? <span className="badge-ai">已配置</span> : <span className="badge-ai off">未配置</span>}
              </div>
              <div className="gt-desc">
                由大模型按你的需求现场编写专属代码。未配置 API 时请先在工作台的「模型设置」中填入 Key,否则将回退到内置模板。
              </div>
            </div>
          </label>

          <div className="ob-actions">
            <button className="btn primary lg" onClick={start} disabled={!idea.trim() || starting}>
              {starting ? '正在初始化团队…' : '开始构建 →'}
            </button>
            <span className="ob-char">{idea.length}/200</span>
          </div>

          <p className="ob-tip">
            你的专属团队已就绪:<b>{AGENTS.map((a) => a.name).join('、')}</b>,将协同完成调研、设计、开发与上线。
          </p>
        </div>
      </div>
    </div>
  )
}