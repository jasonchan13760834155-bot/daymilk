import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) setError(err)
    else navigate('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center px-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🤱</div>
        <h1 className="text-3xl font-heading text-foreground">DayMilk</h1>
        <p className="text-muted-foreground mt-1">每日吸奶记录</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-sm space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">邮箱</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-bg px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your@email.com" required />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-bg px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••" required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full h-12 bg-primary text-white font-heading text-lg rounded-2xl disabled:opacity-50">
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-4">
        还没有账号？<Link to="/register" className="text-primary font-medium">注册</Link>
      </p>
    </div>
  )
}
