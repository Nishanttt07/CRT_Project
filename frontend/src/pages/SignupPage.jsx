import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const { user, loading, signup } = useAuth()
  const [role, setRole] = useState('customer')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopBio, setShopBio] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopLat, setShopLat] = useState('51.5113')
  const [shopLng, setShopLng] = useState('-0.1402')
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
      await signup({
        email,
        password,
        username,
        phone,
        isTailor: role === 'tailor',
        shopName,
        shopBio,
        shopAddress,
        shopLat,
        shopLng
      })
    } catch (err) {
      console.error('Signup error:', err)
      let msg = 'Registration failed. Please try again.'
      if (err) {
        if (typeof err === 'string') {
          msg = err
        } else if (err.message && typeof err.message === 'string') {
          msg = err.message
        } else if (err.error_description && typeof err.error_description === 'string') {
          msg = err.error_description
        } else if (err.error && typeof err.error === 'string') {
          msg = err.error
        }
      }
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-gradient-to-br from-violet-900/10 to-pink-900/10 rounded-full blur-3xl"></div>
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
            Start your
            <span className="block font-normal bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">tailoring journey.</span>
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Join as a customer to find master tailors, or register your shop to reach new clientele worldwide.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 space-y-2">
              <span className="text-xl">👤</span>
              <h3 className="text-xs font-semibold text-white">Customer</h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed">Browse tailors, place orders, track production</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 space-y-2">
              <span className="text-xl">✂️</span>
              <h3 className="text-xs font-semibold text-white">Tailor</h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed">Manage orders, showcase your shop, grow your brand</p>
            </div>
          </div>
        </div>

        <p className="text-zinc-700 text-[10px]">© 2026 TailorFlow. All rights reserved.</p>
      </div>

      {/* Right signup form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md overflow-y-auto max-h-[95vh]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">TailorFlow</span>
            </Link>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 shadow-2xl shadow-black/20">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold text-white tracking-tight">Create account</h2>
              <p className="text-zinc-500 text-xs">Fill in your details to get started</p>
            </div>

            {/* Role selector */}
            <div className="flex bg-zinc-800/50 p-1 rounded-xl mb-6 border border-zinc-700/30">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex-1 text-center py-2.5 text-xs font-semibold rounded-lg transition-all ${
                  role === 'customer'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/25'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                👤 Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('tailor')}
                className={`flex-1 text-center py-2.5 text-xs font-semibold rounded-lg transition-all ${
                  role === 'tailor'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/25'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                ✂️ Tailor Shop
              </button>
            </div>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-slide-up">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="alex_tailor"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all pr-12"
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

              {role === 'tailor' && (
                <div className="space-y-4 pt-4 border-t border-zinc-800/50 animate-slide-up">
                  <h4 className="text-xs font-semibold text-violet-400 flex items-center gap-2">
                    <span>✂️</span> Shop Profile Setup
                  </h4>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Shop Name</label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      placeholder="Savile Row Bespoke"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Bio</label>
                    <textarea
                      value={shopBio}
                      onChange={e => setShopBio(e.target.value)}
                      placeholder="Heritage tailoring since 1985..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all h-20 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Address</label>
                    <input
                      type="text"
                      required
                      value={shopAddress}
                      onChange={e => setShopAddress(e.target.value)}
                      placeholder="8 Savile Row, London"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={shopLat}
                        onChange={e => setShopLat(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={shopLng}
                        onChange={e => setShopLng(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 disabled:opacity-50 disabled:cursor-not-allowed mt-2 relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {submitting ? 'Creating account...' : role === 'tailor' ? 'Register Shop' : 'Create Account'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-800/50 text-center">
              <p className="text-zinc-500 text-xs">
                Already have an account?{' '}
                <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
