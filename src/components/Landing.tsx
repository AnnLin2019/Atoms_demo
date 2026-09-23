import { Link } from 'react-router-dom'
import Logo from './Logo'
import { AGENTS } from '../lib/agents'
import { useAuth } from '../lib/auth'

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI 智能体团队',
    desc: '研究员、产品经理、架构师、工程师协同作业,像一支真实团队那样把想法落地。',
  },
  {
    icon: '⚡',
    title: '无需编写代码',
    desc: '只需用一句自然语言描述想法,几分钟内即可生成可运行、可交互的产品。',
  },
  {
    icon: '🖥️',
    title: '实时可视化预览',
    desc: '智能体工作状态与成品预览双栏同屏,边构建边体验,所见即所得。',
  },
  {
    icon: '🚀',
    title: '一键发布上线',
    desc: '自动部署到云端,生成可分享的线上链接,让产品立刻触达真实用户。',
  },
  {
    icon: '🔁',
    title: '持续迭代优化',
    desc: '随时用对话提出修改意见,AI 团队会响应需求,持续打磨你的产品。',
  },
  {
    icon: '🔒',
    title: '安全可靠',
    desc: '生产级基础设施保障,数据全程加密存储,权限体系清晰可控。',
  },
]

const STEPS = [
  { emoji: '💡', title: '描述想法', desc: '用一句话告诉 AI 你想做什么产品,越具体效果越好。' },
  { emoji: '🧠', title: 'AI 团队协作', desc: '智能体自动完成调研、设计、架构与开发全流程。' },
  { emoji: '🖥️', title: '实时预览', desc: '观看应用逐步成形,几秒钟内即可上手体验。' },
  { emoji: '🚀', title: '发布产品', desc: '一键上线,获得可分享链接,开始服务真实用户。' },
]

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Landing() {
  const { user } = useAuth()
  const startHref = user ? '/app' : '/register'

  return (
    <div className="landing">
      <nav className="lnav">
        <div className="lnav-inner">
          <Link to="/" className="brand">
            <Logo size={30} />
            <span className="brand-name">Atoms</span>
          </Link>
          <div className="lnav-links">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault()
                scrollToId('features')
              }}
            >
              功能
            </a>
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault()
                scrollToId('team')
              }}
            >
              AI 团队
            </a>
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault()
                scrollToId('how')
              }}
            >
              工作流程
            </a>
          </div>
          <div className="lnav-actions">
            <Link to="/login" className="btn ghost sm">
              登录
            </Link>
            <Link to={startHref} className="btn primary sm">
              开始使用
            </Link>
          </div>
        </div>
      </nav>

      <header className="lhero">
        <span className="badge">✨ 下一代 AI Agent 平台</span>
        <h1>
          把你的想法
          <br />
          变成<span className="grad"> 真正的产品</span>
        </h1>
        <p className="lead">
          无需编写任何代码。用一句自然语言描述想法,AI 智能体团队几分钟内完成调研、设计、开发与上线,
          把创意变成可运行、可分享的应用。
        </p>
        <div className="cta">
          <Link to={startHref} className="btn primary lg">
            立即开始构建 →
          </Link>
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault()
              scrollToId('how')
            }}
            className="btn ghost lg"
          >
            了解工作流程
          </a>
        </div>
        <div className="lhero-stats">
          <div className="stat">
            <b>700,000+</b>
            <span>创作者</span>
          </div>
          <div className="stat">
            <b>几分钟</b>
            <span>从想法到上线</span>
          </div>
          <div className="stat">
            <b>0</b>
            <span>代码经验要求</span>
          </div>
        </div>
      </header>

      <div className="demo">
        <div className="demo-frame">
          <div className="demo-bar">
            <span className="demo-dot r" />
            <span className="demo-dot y" />
            <span className="demo-dot g" />
            <span className="demo-url">atoms.app/studio</span>
          </div>
          <div className="demo-body">
            <div className="demo-side">
              {AGENTS.map((a) => (
                <div className="demo-agent" key={a.id}>
                  <span className="emoji">{a.emoji}</span>
                  <div>
                    <b>{a.name}</b>
                    <span className="role">
                      {a.roleCn} · {a.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="demo-main">
              <div className="demo-skeleton">
                <div className="sk w40" />
                <div className="sk w70 h8" />
                <div className="sk w55" />
                <div className="sk card" />
                <div className="sk w70" />
                <div className="sk w55 h8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="lsection" id="features">
        <h2>为什么选择 Atoms</h2>
        <p className="sec-sub">把一支完整的 AI 团队装进你的浏览器,让每个人都能成为创作者。</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="fic">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lsection" id="team">
        <h2>你的专属 AI 团队</h2>
        <p className="sec-sub">每个智能体各司其职,像一个 mini 公司那样把产品从 0 到 1 交付。</p>
        <div className="team-grid">
          {AGENTS.map((a) => (
            <div className="team-card" key={a.id}>
              <div className="t-emoji">{a.emoji}</div>
              <div className="t-name">{a.name}</div>
              <div className="t-role">{a.roleCn}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="lsection" id="how">
        <h2>四步,从想法到上线</h2>
        <p className="sec-sub">整个流程由智能体自动驱动,你只需全程陪伴与把关。</p>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div className="step-card" key={s.title}>
              <span className="s-num">0{i + 1}</span>
              <div className="s-emoji">{s.emoji}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="lcta">
        <h2>准备好开始了吗?</h2>
        <p>注册免费账户,几分钟内拥有你的第一个产品。</p>
        <Link to={startHref} className="btn lg">
          免费开始 →
        </Link>
      </div>

      <footer className="lfooter">
        <div className="brand">
          <Logo size={24} />
          <span className="brand-name">Atoms</span>
        </div>
        <div>把想法变成产品 · AI Agent 平台演示</div>
        <div className="flinks">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault()
              scrollToId('features')
            }}
          >
            功能
          </a>
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault()
              scrollToId('team')
            }}
          >
            AI 团队
          </a>
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault()
              scrollToId('how')
            }}
          >
            工作流程
          </a>
        </div>
      </footer>
    </div>
  )
}