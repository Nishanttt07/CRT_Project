import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!loading && user.isLoggedIn) {
    return <Navigate to={user.role === 'tailor' ? '/tailor' : '/dashboard'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(emailOrPhone, password)
    } catch (err) {
      setError(err?.message || 'Login failed. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-violet-900/10 to-fuchsia-900/10 rounded-full blur-3xl"></div>
      </div>

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">TailorFlow</span>
        </Link>

        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-light text-white leading-tight tracking-tight">
            Welcome back to your
            <span className="block font-normal bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">tailoring workspace.</span>
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Access your commissions, measurement vaults, and real-time production tracking from anywhere.
          </p>
          <div className="flex gap-6 pt-4">
            <div className="space-y-1">
              <p className="text-2xl font-light text-white">500+</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">Active Tailors</p>
            </div>
            <div className="w-px bg-zinc-800"></div>
            <div className="space-y-1">
              <p className="text-2xl font-light text-white">2.4K</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">Orders Completed</p>
            </div>
            <div className="w-px bg-zinc-800"></div>
            <div className="space-y-1">
              <p className="text-2xl font-light text-white">98%</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">Satisfaction</p>
            </div>
          </div>
        </div>

        <p className="text-zinc-700 text-[10px]">© 2026 TailorFlow. All rights reserved.</p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">TailorFlow</span>
            </Link>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 shadow-2xl shadow-black/20">
            <div className="space-y-2 mb-8">
              <h2 className="text-xl font-semibold text-white tracking-tight">Sign in</h2>
              <p className="text-zinc-500 text-xs">Enter your credentials to access your account</p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-slide-up">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Email or Phone
                </label>
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={e => setEmailOrPhone(e.target.value)}
                  placeholder="you@example.com or +91 98765..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors text-sm"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10">{submitting ? 'Signing in...' : 'Sign In'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
              <p className="text-zinc-500 text-xs">
                Don't have an account?{' '}
                <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
