import { useMemo, useState } from 'react'
import type { ProjectFile } from '../lib/types'
import { renderHighlighted } from '../lib/highlight'

const FILE_ICON: Record<string, string> = {
  html: '🔶',
  css: '🎨',
  javascript: '📜',
  json: '🧾',
  markdown: '📘',
}
const FILE_EXT: Record<string, string> = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JS',
  json: 'JSON',
  markdown: 'MD',
}

export default function CodeView({ files }: { files: ProjectFile[] }) {
  const [active, setActive] = useState<string>(files[0]?.path ?? '')

  const current = useMemo(() => files.find((f) => f.path === active) ?? files[0], [files, active])

  return (
    <div className="code-view">
      <div className="file-tree">
        <div className="ft-label">项目文件</div>
        {files.map((f) => (
          <div
            key={f.path}
            className={'ft-file' + (current && current.path === f.path ? ' active' : '')}
            onClick={() => setActive(f.path)}
          >
            <span className="fico">{FILE_ICON[f.language] ?? '📄'}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.path}
            </span>
            {f.writing && <span className="writing">✍</span>}
          </div>
        ))}
      </div>

      <div className="code-main">
        <div className="code-main-head">
          <span>{current?.path ?? ''}</span>
          <span style={{ color: 'var(--muted)' }}>{current?.writing ? '正在写入…' : `${current?.content.split('\n').length ?? 0} 行`}</span>
          <span className="lang">{FILE_EXT[current?.language ?? ''] ?? ''}</span>
        </div>
        <div className="code-scroll">
          <pre>
            {current?.writing ? (
              <div className="code-line">
                <span className="ln">1</span>
                <code style={{ color: 'var(--amber)' }}>// 智能体正在编写此文件…</code>
              </div>
            ) : (
              renderHighlighted(current?.content ?? '', current?.language ?? 'javascript')
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}