import { useEffect, useMemo, useRef } from 'react'
import { AGENTS, agentById } from '../lib/agents'
import type { ActivityEvent, ProjectStatus } from '../lib/types'

interface Props {
  activity: ActivityEvent[]
  status: ProjectStatus
  connecting?: boolean
}

function fmtTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour12: false })
}

export default function AgentPanel({ activity, status, connecting }: Props) {
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [activity.length])

  // 每个智能体的实时状态
  const agentState = useMemo(() => {
    const seen = new Map<string, boolean>()
    const last = activity[activity.length - 1]
    for (const a of AGENTS) {
      const acted = activity.some((e) => e.agentId === a.id)
      seen.set(a.id, acted)
    }
    const map = new Map<string, 'idle' | 'working' | 'done'>()
    for (const a of AGENTS) {
      if (status === 'ready') map.set(a.id, 'done')
      else if (last && last.agentId === a.id) map.set(a.id, 'working')
      else map.set(a.id, seen.get(a.id) ? 'done' : 'idle')
    }
    return map
  }, [activity, status])

  return (
    <div className="agent-panel">
      <div className="ap-head">
        <div className="t">
          AI 团队 <span className="team">多智能体协作中</span>
        </div>
        <div className="team-strip">
          {AGENTS.map((a) => {
            const st = agentState.get(a.id)
            return (
              <span key={a.id} className={`team-pill ${st}`} title={`${a.name} · ${a.roleCn}`}>
                <span className="dot" />
                {a.emoji} {a.name}
              </span>
            )
          })}
        </div>
      </div>

      <div className="activity-feed" ref={feedRef}>
        {activity.length === 0 && (
          <div className="act-item system">
            {connecting ? (
              <span className="act-text">
                🤖 正在调用大模型,现场编写你的应用…<span className="typing" />
              </span>
            ) : (
              <span className="act-text">🧭 团队已就绪,等待任务指令…</span>
            )}
          </div>
        )}
        {activity.map((ev) => {
          if (ev.agentId === 'system') {
            return (
              <div className="act-item system" key={ev.id}>
                <span style={{ fontSize: 16 }}>✨</span>
                <div className="act-body">
                  <div className="act-text">{ev.text}</div>
                </div>
              </div>
            )
          }
          const a = agentById(ev.agentId)
          return (
            <div className="act-item" key={ev.id}>
              <span className="act-avatar" style={{ background: `${a.color}1f`, borderColor: `${a.color}40` }}>
                {a.emoji}
              </span>
              <div className="act-body">
                <div className="act-head">
                  <span className="act-name" style={{ color: a.color }}>
                    {a.name}
                  </span>
                  <span className="act-role">{a.roleCn}</span>
                  <span className="act-time">{fmtTime(ev.ts)}</span>
                </div>
                <div className="act-text">{ev.text}</div>
                {ev.items && (
                  <ul className="act-items">
                    {ev.items.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}