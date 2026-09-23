import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Logo from './Logo'
import AgentPanel from './AgentPanel'
import PreviewPane from './PreviewPane'
import CommandBar from './CommandBar'
import { runBuild, type BuildHandle, type RunningState } from '../lib/engine'
import {
  assemble,
  buildFilesFromPart,
  matchTemplate,
  TEMPLATES,
  type AppTemplate,
  type TemplatePart,
} from '../lib/templates'
import { generateApp } from '../lib/aiGenerate'
import { getLlmConfig, llmReady } from '../lib/llm'
import { getProject, saveProject, uid } from '../lib/store'
import type { Project } from '../lib/types'

const COLORS: { label: string; hex: string; keys: string[] }[] = [
  { label: '紫色', hex: '#7c5cff', keys: ['紫'] },
  { label: '蓝色', hex: '#3b82f6', keys: ['蓝'] },
  { label: '青色', hex: '#06b6d4', keys: ['青'] },
  { label: '绿色', hex: '#10b981', keys: ['绿'] },
  { label: '橙色', hex: '#f97316', keys: ['橙'] },
  { label: '粉色', hex: '#ec4899', keys: ['粉'] },
  { label: '红色', hex: '#ef4444', keys: ['红'] },
  { label: '黄色', hex: '#f59e0b', keys: ['黄'] },
  { label: '灰色', hex: '#64748b', keys: ['灰'] },
]

function detectColor(text: string): { hex: string; label: string } | null {
  if (!/主题|颜色|配色|色调|主色|皮肤/.test(text)) return null
  for (const c of COLORS) for (const k of c.keys) if (text.includes(k)) return { hex: c.hex, label: c.label }
  return null
}

function deployUrlFor(appName: string): string {
  return 'https://' + (appName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'app') + '.atoms.app'
}

interface AiOverride {
  part: TemplatePart
  research: string[]
  spec: string[]
  arch: string[]
}

export default function Studio() {
  const { id } = useParams()
  const [proj, setProj] = useState<Project | null>(() => getProject(id ?? '') ?? null)
  const [progress, setProgress] = useState(2)
  const [aiWaiting, setAiWaiting] = useState(false)
  const startedRef = useRef(false)
  const runRef = useRef<BuildHandle | null>(null)
  const aiAbortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const template: AppTemplate = useMemo(
    () => (proj ? TEMPLATES.find((t) => t.id === proj.templateId) ?? matchTemplate(proj.idea) : TEMPLATES[0]),
    [proj],
  )

  // 持久化:项目状态变化即保存
  useEffect(() => {
    if (proj) saveProject(proj)
  }, [proj])

  // 构建生命周期
  useEffect(() => {
    if (!proj || proj.status !== 'building') return
    if (startedRef.current) return

    // 上次会话被打断(已有活动记录):直接补齐为「已上线」,避免重复构建
    if (proj.activity.length > 0) {
      finalizeInterrupted(proj)
      return
    }

    startedRef.current = true
    const wantAi = proj.generator === 'ai' && llmReady()
    if (wantAi) {
      startAiBuild(proj)
    } else {
      launchBuild(
        proj,
        undefined,
        undefined,
        proj.generator === 'ai' ? '未检测到可用的大模型配置,已改用内置模板生成。' : undefined,
      )
    }

    return () => {
      startedRef.current = false
      runRef.current?.cancel()
      runRef.current = null
      aiAbortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proj?.id])

  function launchBuild(p: Project, ai?: AiOverride, appName?: string, warn?: string) {
    const handle = runBuild({
      idea: p.idea,
      template,
      appName: appName ?? p.appName,
      accent: p.accent,
      ai,
      warn,
      initial: {
        status: 'building',
        progress: 2,
        activity: [],
        files: [],
        preview: '',
        messages: p.messages,
        deployUrl: '',
      },
      tick: (st: RunningState) => {
        setProgress(st.progress)
        setProj((prev) =>
          prev
            ? {
                ...prev,
                status: st.status,
                activity: st.activity,
                files: st.files,
                preview: st.preview,
                messages: st.messages,
                deployUrl: st.deployUrl,
              }
            : prev,
        )
      },
    })
    runRef.current = handle
  }

  function startAiBuild(p: Project) {
    const cfg = getLlmConfig()
    const ctrl = new AbortController()
    aiAbortRef.current = ctrl
    setAiWaiting(true)

    let v = 4
    const iv = setInterval(() => {
      v = Math.min(v + 1.2, 56)
      setProgress(Math.round(v))
    }, 550)

    generateApp(p.idea, cfg, ctrl.signal)
      .then((gen) => {
        clearInterval(iv)
        setAiWaiting(false)
        if (ctrl.signal.aborted) return
        setProj((prev) => (prev ? { ...prev, name: gen.title, appName: gen.title, aiPart: gen.part } : prev))
        launchBuild(p, { part: gen.part, research: gen.research, spec: gen.spec, arch: gen.arch }, gen.title)
      })
      .catch((e) => {
        clearInterval(iv)
        setAiWaiting(false)
        if (ctrl.signal.aborted) return
        launchBuild(p, undefined, undefined, '大模型生成失败(' + (e as Error).message + '),已回退到内置模板。')
      })
  }

  function finalizeInterrupted(prev: Project) {
    const part = prev.aiPart ?? template.part
    const preview = assemble(part, prev.appName, prev.accent)
    const files = buildFilesFromPart(part, prev.appName, prev.accent, prev.idea, []).map((f) => ({
      ...f,
      writing: false,
      done: true,
    }))
    setProgress(100)
    setProj({ ...prev, status: 'ready', preview, files, deployUrl: deployUrlFor(prev.appName) })
  }

  function handleCommand(text: string) {
    if (!proj) return
    const userMsg = { id: uid(), role: 'user' as const, text, ts: Date.now() }
    setProj((prev) => (prev ? { ...prev, messages: [...prev.messages, userMsg] } : prev))

    const color = detectColor(text)
    timerRef.current = setTimeout(() => {
      setProj((prev) => {
        if (!prev) return prev
        if (color) {
          const part = prev.aiPart ?? template.part
          const preview = assemble(part, prev.appName, color.hex)
          const files = buildFilesFromPart(part, prev.appName, color.hex, prev.idea, []).map((f) => ({
            ...f,
            writing: false,
            done: true,
          }))
          const ack = {
            id: uid(),
            role: 'agent' as const,
            agentId: 'alex' as const,
            text: `好的!我已将应用主题切换为${color.label},并重新生成了样式文件,右侧预览已同步更新。`,
            ts: Date.now(),
          }
          return { ...prev, accent: color.hex, preview, files, messages: [...prev.messages, ack] }
        }
        const ack = {
          id: uid(),
          role: 'agent' as const,
          agentId: 'emma' as const,
          text: `收到!我已把「${text}」记录为新的需求,并排入下一轮迭代清单。团队会尽快为你实现,敬请期待。`,
          ts: Date.now(),
        }
        return { ...prev, messages: [...prev.messages, ack] }
      })
    }, 900)
  }

  if (!proj) return <Navigate to="/app" replace />

  const building = proj.status === 'building'
  const previewKey = `${proj.accent}-${proj.status}`

  return (
    <div className="studio">
      <div className="studio-top">
        <Link to="/app" className="studio-back">
          ← 工作台
        </Link>
        <Logo size={26} />
        <div className="studio-project">
          <span className="sp-name">{proj.appName}</span>
          <span className={'studio-status ' + (building ? '' : 'ready')}>
            {building ? (
              <>
                <span
                  className="pulse"
                  style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)' }}
                />
                {aiWaiting ? '大模型生成中' : '构建中'}
              </>
            ) : (
              <>
                <span className="pulse" />
                已上线
              </>
            )}
          </span>
          {proj.generator === 'ai' && <span className="badge-ai">AI 生成</span>}
        </div>
        <div className="studio-actions">
          {building && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: progress + '%' }} />
            </div>
          )}
          <span className="chip" title="部署地址">
            {building ? '部署准备中…' : deployUrlFor(proj.appName).replace('https://', '')}
          </span>
        </div>
      </div>

      <div className="studio-body">
        <AgentPanel activity={proj.activity} status={proj.status} connecting={aiWaiting} />
        <PreviewPane
          status={proj.status}
          progress={progress}
          files={proj.files}
          preview={proj.preview}
          deployUrl={proj.deployUrl || deployUrlFor(proj.appName)}
          appName={proj.appName}
          previewKey={previewKey}
          aiWaiting={aiWaiting}
        />
      </div>

      <CommandBar messages={proj.messages} building={building} onSend={handleCommand} />
    </div>
  )
}