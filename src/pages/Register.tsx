import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signUp(email, password)
    if (err) setError(err)
    else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-6">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-2xl font-heading text-foreground">注册成功！</h1>
        <p className="text-subtle mt-2 text-center">正在跳转...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center px-6">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🤱</div>
        <h1 className="text-[28px] font-heading text-foreground">创建账号</h1>
        <p className="text-subtle mt-1.5">开始记录你的吸奶计划</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="bg-danger-light text-danger text-sm p-3 rounded-xl">{error}</div>
        )}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">邮箱</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-bg px-4 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            placeholder="your@email.com" required inputMode="email" autoComplete="email" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-bg px-4 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            placeholder="至少6位" required minLength={6} autoComplete="new-password" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full h-12 bg-primary text-white font-heading text-[15px] rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60">
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <p className="text-center text-sm text-subtle mt-6">
        已有账号？<Link to="/login" className="text-primary font-medium">登录</Link>
      </p>
    </div>
  )
}
