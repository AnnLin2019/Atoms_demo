import { useRef, useState } from 'react'
import type { ChatMessage } from '../lib/types'
import { agentById } from '../lib/agents'

interface Props {
  messages: ChatMessage[]
  building: boolean
  onSend: (text: string) => void
}

export default function CommandBar({ messages, building, onSend }: Props) {
  const [text, setText] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)

  function send() {
    const v = text.trim()
    if (!v || building) return
    onSend(v)
    setText('')
    if (areaRef.current) areaRef.current.style.height = 'auto'
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="command-bar">
      {messages.length > 0 && (
        <div className="chat-strip">
          {messages.slice(-6).map((m) => (
            <div className={'chat-msg ' + m.role} key={m.id}>
              <span className="who">
                {m.role === 'user' ? '你' : m.agentId ? `${agentById(m.agentId).emoji} ${agentById(m.agentId).name}` : '系统'}
              </span>
              <span className="body">{m.text}</span>
            </div>
          ))}
        </div>
      )}
      <div className="cb-inner">
        <span className="cb-icon">💬</span>
        <textarea
          ref={areaRef}
          className="cb-textarea"
          rows={1}
          value={text}
          placeholder={building ? '团队正在构建中,请稍候…' : '继续提需求,让 AI 团队迭代你的应用,例如:把主题改成蓝色'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="cb-send" onClick={send} disabled={!text.trim() || building} title="发送">
          ➤
        </button>
      </div>
      <div className="cb-tip">
        <span>
          <b>Enter</b> 发送 · <b>Shift+Enter</b> 换行
        </span>
        <span>试试:<b>把主题改成绿色</b></span>
      </div>
    </div>
  )
}