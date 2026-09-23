import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import SettingsModal from './SettingsModal'
import { useAuth } from '../lib/auth'
import { deleteProject, getProjects, importProjectJson, serializeProject, serializeProjects } from '../lib/store'
import { llmReady } from '../lib/llm'
import { TEMPLATES } from '../lib/templates'
import type { Project } from '../lib/types'

function projectEmoji(p: Project): string {
  return TEMPLATES.find((t) => t.id === p.templateId)?.emoji ?? '✨'
}

function fmtTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const days = Math.floor((now.getTime() - ts) / 86400000)
  if (days < 1) return '今天'
  if (days < 2) return '昨天'
  if (days < 7) return days + ' 天前'
  return d.toLocaleDateString('zh-CN')
}

function download(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function Projects() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const aiOn = llmReady()

  const projects = user ? getProjects(user.id) : []

  function notify(ok: boolean, text: string) {
    setToast({ ok, text })
    setTimeout(() => setToast(null), 2600)
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('确定删除这个项目吗?此操作不可撤销。')) return
    deleteProject(id)
    setRefresh(refresh + 1)
  }

  function exportOne(p: Project) {
    download('atoms-' + (p.name || 'project').replace(/[^一-龥a-zA-Z0-9]+/g, '-') + '.json', serializeProject(p))
    notify(true, '已导出「' + p.name + '」')
  }

  function exportAll() {
    if (!projects.length) {
      notify(false, '暂无可导出的项目')
      return
    }
    download('atoms-projects.json', serializeProjects(projects))
    notify(true, '已导出全部 ' + projects.length + ' 个项目')
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    const reader = new FileReader()
    reader.onload = () => {
      const r = importProjectJson(String(reader.result ?? ''), user.id)
      if (r.ok) notify(true, '成功导入 ' + r.count + ' 个项目')
      else notify(false, r.error ?? '导入失败')
      setRefresh(refresh + 1)
    }
    reader.onerror = () => notify(false, '读取文件失败')
    reader.readAsText(file)
  }

  return (
    <div className="projects">
      <div className="p-top">
        <div className="p-top-inner">
          <Link to="/" className="brand">
            <Logo size={30} />
            <span className="brand-name">Atoms</span>
          </Link>
          <span className="chip">🗂 项目:{projects.length}</span>
          <div className="p-user">
            <div style={{ textAlign: 'right' }}>
              <div className="p-name">{user?.name}</div>
              <div className="p-email">{user?.email}</div>
            </div>
            <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</div>
            <button className="btn ghost sm" onClick={logout}>
              退出
            </button>
          </div>
        </div>
      </div>

      <div className="p-body">
        <div className="p-head">
          <div>
            <h1>我的工作台</h1>
            <div className="sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              用一句想法,召唤你的 AI 团队
              {aiOn ? (
                <span className="badge-ai">🤖 AI 生成已就绪</span>
              ) : (
                <span className="badge-ai off">📚 模板引擎</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn ghost" onClick={() => setShowSettings(true)}>
              🤖 模型设置
            </button>
            <button className="btn ghost" onClick={() => fileRef.current?.click()}>
              📥 导入
            </button>
            <button className="btn ghost" onClick={exportAll}>
              📤 导出全部
            </button>
            <button className="btn primary" onClick={() => navigate('/app/new')}>
              ＋ 新建项目
            </button>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onImportFile} />

        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="e-emoji">🛠️</div>
            <h3>还没有项目</h3>
            <p>从一个想法开始,让 AI 团队为你构建第一个产品。</p>
            <button className="btn primary lg" onClick={() => navigate('/app/new')}>
              创建第一个项目 →
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => (
              <div className="project-card" key={p.id} onClick={() => navigate(`/app/${p.id}`)}>
                <div style={{ display: 'flex', gap: 6, position: 'absolute', top: 14, right: 14, opacity: 0.85 }}>
                  <button className="pc-del" style={{ position: 'static' }} onClick={() => exportOne(p)} title="导出">
                    📤
                  </button>
                  <button className="pc-del" style={{ position: 'static' }} onClick={(e) => handleDelete(p.id, e)} title="删除">
                    ✕
                  </button>
                </div>
                <div className="pc-emoji">{projectEmoji(p)}</div>
                <div className="pc-name">{p.name}</div>
                <div className="pc-idea">{p.idea}</div>
                <div className="pc-meta">
                  <span
                    className="status-dot"
                    style={{ background: p.status === 'ready' ? 'var(--green)' : 'var(--amber)' }}
                  />
                  <span>{p.status === 'ready' ? '已上线' : '构建中'}</span>
                  <span>·</span>
                  <span>{p.generator === 'ai' ? 'AI 生成' : '模板'}</span>
                  <span>·</span>
                  <span>{fmtTime(p.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {toast && <div className={'toast ' + (toast.ok ? 'ok' : 'err')}>{toast.text}</div>}
    </div>
  )
}