import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import Logo from './Logo'
import { decodeApp } from '../lib/share'

// 独立渲染分享链接中的自包含应用:全屏 iframe + 一个「由 Atoms 生成」的小徽标。
export default function ShareView() {
  const { encoded = '' } = useParams()
  const html = useMemo(() => decodeApp(encoded), [encoded])

  if (!html) {
    return (
      <div className="share-wrap">
        <Link to="/" className="brand">
          <Logo size={26} />
          <span className="brand-name">Atoms</span>
        </Link>
        <div className="share-error">
          <div className="e-emoji">🔗</div>
          <h3>链接无效或已损坏</h3>
          <p>这个分享链接无法解析,可能被截断或不是有效的应用链接。</p>
          <Link to="/" className="btn primary">
            回到首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="share-view">
      <iframe srcDoc={html} title="分享的应用" sandbox="allow-scripts allow-forms allow-modals allow-popups" />
      <a className="share-badge" href="#/" title="由 Atoms 生成">
        ⚛ Atoms 生成
      </a>
    </div>
  )
}