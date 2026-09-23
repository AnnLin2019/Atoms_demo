import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../lib/auth'

type Mode = 'login' | 'register'

export default function AuthForm({ mode }: { mode: Mode }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isLogin = mode === 'login'

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!isLogin && !name.trim()) {
      setError('请填写你的昵称')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }
    setLoading(true)
    // 模拟短暂延迟,营造真实感
    setTimeout(() => {
      const r = isLogin ? login(email, password) : register(name, email, password)
      if (!r.ok) {
        setError(r.error ?? '操作失败')
        setLoading(false)
        return
      }
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from.startsWith('/app') ? from : '/app', { replace: true })
    }, 420)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <span className="auth-logo">
            <Logo size={44} />
          </span>
          <div className="auth-title">{isLogin ? '欢迎回来' : '创建你的账户'}</div>
          <div className="auth-sub">
            {isLogin ? '登录以继续你的创作之旅' : '注册后即可把想法变成产品'}
          </div>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {!isLogin && (
            <div className="field">
              <label>昵称</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的名字"
                autoComplete="nickname"
              />
            </div>
          )}
          <div className="field">
            <label>邮箱</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>密码</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="btn primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '请稍候…' : isLogin ? '登 录' : '注册并开始'}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? (
            <>
              还没有账户?<Link to="/register">立即注册</Link>
            </>
          ) : (
            <>
              已有账户?<Link to="/login">直接登录</Link>
            </>
          )}
        </div>
        <Link to="/" className="auth-back">
          ← 返回首页
        </Link>
      </div>
    </div>
  )
}