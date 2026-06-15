import { useState } from 'react'
import { supabase } from '../services/supabase'

export default function LandingPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              phone
            }
          }
        })
        if (error) throw error
        
        if (data?.session) {
          setMessage({
            type: 'success',
            text: 'Account created and logged in successfully!'
          })
        } else {
          setMessage({
            type: 'success',
            text: 'Account created successfully. Check your email for verification.'
          })
        }
      } else {
        let loginEmail = email
        // If the identifier doesn't look like an email, assume it's a phone number and look it up
        if (!email.includes('@')) {
          const { data: foundEmail, error: rpcError } = await supabase.rpc('get_email_by_phone', {
            phone_query: email
          })

          if (rpcError) throw rpcError
          if (!foundEmail) {
            throw new Error('No account found associated with this phone number.')
          }
          loginEmail = foundEmail
        }

        const { error } = await supabase.auth.signInWithPassword({ 
          email: loginEmail, 
          password 
        })
        if (error) throw error
        setMessage({
          type: 'success',
          text: 'Logged in successfully.'
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-neutral-900">TailorFlow</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-normal tracking-tight text-neutral-900">
          {isSignUp ? 'Create your workspace' : 'Welcome back'}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500">
          {isSignUp
            ? 'Start managing your orders, clients, and measurements'
            : 'Access your workshop dashboard and orders'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-zinc-200/60 rounded-2xl shadow-sm sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="username" className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Username
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe"
                      className="block w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-neutral-950 focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="block w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-neutral-950 focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {isSignUp ? 'Email Address' : 'Email Address or Phone Number'}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type={isSignUp ? 'email' : 'text'}
                  autoComplete={isSignUp ? 'email' : 'username'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isSignUp ? 'name@example.com' : 'name@example.com or phone number'}
                  className="block w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-neutral-950 focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-neutral-950 focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            {message && (
              <div
                className={`rounded-lg p-4 border text-sm ${
                  message.type === 'success'
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
                    : 'bg-red-50/50 border-red-100 text-red-600'
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.type === 'success' ? (
                      <svg className="h-5 w-5 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{message.text}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-950 disabled:opacity-55 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage(null)
              }}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors bg-transparent border-none cursor-pointer focus:outline-none"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
