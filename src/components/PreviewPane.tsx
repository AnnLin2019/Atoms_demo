import { useState } from 'react'
import type { ProjectFile, ProjectStatus } from '../lib/types'
import CodeView from './CodeView'

interface Props {
  status: ProjectStatus
  progress: number
  files: ProjectFile[]
  preview: string
  deployUrl: string
  appName: string
  previewKey: string
  aiWaiting?: boolean
}

type Tab = 'preview' | 'code' | 'publish'

export default function PreviewPane({ status, progress, files, preview, deployUrl, appName, previewKey, aiWaiting }: Props) {
  const [tab, setTab] = useState<Tab>('preview')
  const [copied, setCopied] = useState(false)
  const ready = status === 'ready'

  function copyUrl() {
    navigator.clipboard?.writeText(deployUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  function downloadHtml() {
    const blob = new Blob([preview], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (appName.replace(/[^一-龥a-zA-Z0-9]+/g, '-') || 'app') + '.html'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="preview-pane">
      <div className="pane-tabs">
        <button className={'pane-tab' + (tab === 'preview' ? ' active' : '')} onClick={() => setTab('preview')}>
          🖥️ 预览
        </button>
        <button className={'pane-tab' + (tab === 'code' ? ' active' : '')} onClick={() => setTab('code')}>
          {'</>'} 代码
          <span className="bubble">{files.length}</span>
        </button>
        <button className={'pane-tab' + (tab === 'publish' ? ' active' : '')} onClick={() => setTab('publish')}>
          🚀 发布
        </button>
        <button className="pane-refresh" title="重新加载预览" onClick={() => location.reload()}>
          ↻ 刷新
        </button>
      </div>

      <div className="pane-view">
        {tab === 'preview' &&
          (ready && preview ? (
            <div className="iframe-wrap">
              <iframe key={previewKey} srcDoc={preview} title={appName} sandbox="allow-scripts allow-forms allow-modals allow-popups" />
            </div>
          ) : (
            <div className="preview-placeholder">
              <div className="pp-inner">
                <div className="pp-spinner" />
                <h3>{aiWaiting ? '正在调用大模型生成应用' : 'AI 团队正在构建你的应用'}</h3>
                <p>
                  {aiWaiting
                    ? '大模型正在按你的需求现场编写专属代码,通常需要 10~40 秒。'
                    : '工程师 Alex 正在编写代码,完成后将在此处实时预览。当前进度 ' + progress + '%'}
                </p>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
                  <div className="progress-track" style={{ width: '100%' }}>
                    <div className="progress-fill" style={{ width: progress + '%' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}

        {tab === 'code' && <CodeView files={files} />}

        {tab === 'publish' &&
          (ready ? (
            <div className="publish-view">
              <div className="pv-card">
                <div className="pv-emoji">🎉</div>
                <h3>发布成功!</h3>
                <p>
                  「{appName}」已生成一个可直接访问、可分享的链接,任何人打开即可运行,无需登录。
                </p>
                <div className="pv-url">
                  <span className="url" title={deployUrl}>
                    {deployUrl}
                  </span>
                  <button onClick={copyUrl}>{copied ? '✓ 已复制' : '复制'}</button>
                  <a className="pv-open" href={deployUrl} target="_blank" rel="noreferrer">
                    打开 ↗
                  </a>
                </div>
                <div className="pv-stats">
                  <div className="pv-stat">
                    <b>自包含</b>
                    <span>代码内嵌链接</span>
                  </div>
                  <div className="pv-stat">
                    <b>可分享</b>
                    <span>任何人可打开</span>
                  </div>
                  <div className="pv-stat">
                    <b>HTTPS</b>
                    <span>自动加密</span>
                  </div>
                </div>
                <div className="pv-actions">
                  <div className="btn ghost" onClick={downloadHtml}>
                    ⬇️ 下载独立 HTML
                  </div>
                  <div className="btn ghost" onClick={() => setTab('preview')}>
                    ← 返回预览
                  </div>
                </div>
                <p className="pv-note">链接内含应用的完整代码,因此较长;想要更短的域名,可下载独立 HTML 后托管到任意静态空间(如 GitHub Pages / Vercel / Netlify)。</p>
              </div>
            </div>
          ) : (
            <div className="preview-placeholder">
              <div className="pp-inner">
                <div className="pp-spinner" />
                <h3>正在准备部署环境</h3>
                <p>构建完成后将自动部署上线,请稍候…</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}