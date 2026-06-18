import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState({ isLoggedIn: false, role: null, id: null, email: null, username: null })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const determineRole = async (authUser) => {
    if (authUser.email === 'admin@gmail.com') {
      return {
        isLoggedIn: true,
        role: 'admin',
        id: authUser.id,
        email: authUser.email,
        username: 'Admin'
      }
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle()

    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', authUser.id)
      .maybeSingle()

    return {
      isLoggedIn: true,
      role: shop ? 'tailor' : 'customer',
      id: authUser.id,
      email: authUser.email,
      username: profile?.username || authUser.user_metadata?.username || ''
    }
  }

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const userData = await determineRole(session.user)
        setUser(userData)
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const userData = await determineRole(session.user)
        setUser(userData)
      } else {
        setUser({ isLoggedIn: false, role: null, id: null, email: null, username: null })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (emailOrPhone, password) => {
    let loginEmail = emailOrPhone
    if (!emailOrPhone.includes('@')) {
      const { data: foundEmail, error: rpcError } = await supabase.rpc('get_email_by_phone', {
        phone_query: emailOrPhone
      })
      if (rpcError) throw rpcError
      if (!foundEmail) {
        throw new Error('No account found with this phone number.')
      }
      loginEmail = foundEmail
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    })
    if (error) throw error

    const userData = await determineRole(data.user)
    setUser(userData)
    navigate(userData.role === 'admin' ? '/admin' : (userData.role === 'tailor' ? '/tailor' : '/dashboard'))
    return userData
  }

  const signup = async ({ email, password, username, phone, isTailor, shopName, shopBio, shopAddress, shopLat, shopLng }) => {
    if (phone) {
      const { data: foundEmail, error: rpcError } = await supabase.rpc('get_email_by_phone', {
        phone_query: phone
      })
      if (!rpcError && foundEmail) {
        throw new Error('This phone number is already registered.')
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          phone,
          is_tailor: isTailor,
          shop_name: shopName || '',
          shop_bio: shopBio || '',
          shop_address: shopAddress || '',
          shop_latitude: parseFloat(shopLat) || 51.5113,
          shop_longitude: parseFloat(shopLng) || -0.1402
        }
      }
    })
    if (error) throw error

    if (data?.user && !data?.session) {
      // Email confirmation is required — auto-sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (signInError) {
        throw new Error('Account created but could not auto-login. Please log in manually.')
      }
      const userData = await determineRole(signInData.user)
      setUser(userData)
      navigate(userData.role === 'tailor' ? '/tailor' : '/dashboard')
      return userData
    }

    if (data?.session) {
      const userData = await determineRole(data.user)
      setUser(userData)
      navigate(userData.role === 'tailor' ? '/tailor' : '/dashboard')
      return userData
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser({ isLoggedIn: false, role: null, id: null, email: null, username: null })
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
