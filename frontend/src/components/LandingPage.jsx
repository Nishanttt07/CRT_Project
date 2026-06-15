import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export default function LandingPage() {
  const [user, setUser] = useState({ isLoggedIn: false, role: null, id: null, email: null })
  const [loading, setLoading] = useState(true)
  const [shops, setShops] = useState([])
  const [orders, setOrders] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [authMode, setAuthMode] = useState('login')
  const [roleSelection, setRoleSelection] = useState('customer')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopLat, setShopLat] = useState('51.5113')
  const [shopLng, setShopLng] = useState('-0.1402')
  const [shopBio, setShopBio] = useState('')

  const [shopSettings, setShopSettings] = useState({
    name: '',
    bio: '',
    lat: '51.5113',
    lng: '-0.1402',
    address: ''
  })

  const [selectedShop, setSelectedShop] = useState(null)
  const [tailorTab, setTailorTab] = useState('orders')
  const [customerView, setCustomerView] = useState('orders')
  const [toast, setToast] = useState(null)
  const [message, setMessage] = useState(null)

  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingGarment, setBookingGarment] = useState('Suit')
  const [bookingPrice, setBookingPrice] = useState('500')
  const [bookingDelivery, setBookingDelivery] = useState('')
  const [bookingChest, setBookingChest] = useState('40')
  const [bookingWaist, setBookingWaist] = useState('34')
  const [bookingSleeve, setBookingSleeve] = useState('25')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  const fetchShops = async () => {
    const { data, error } = await supabase.from('shops').select('*')
    if (!error && data) {
      setShops(data)
    }
  }

  const fetchCustomerData = async (userId) => {
    const { data: ordersData } = await supabase.from('orders').select('*').eq('customer_id', userId)
    if (ordersData) {
      setOrders(ordersData)
    }
    const { data: measData } = await supabase.from('measurements').select('*').eq('customer_id', userId)
    if (measData) {
      setMeasurements(measData)
    }
  }

  const fetchTailorData = async (userId) => {
    const { data: shop } = await supabase.from('shops').select('*').eq('id', userId).maybeSingle()
    if (shop) {
      setShopSettings({
        name: shop.shop_name,
        bio: shop.bio || '',
        lat: String(shop.latitude || '51.5113'),
        lng: String(shop.longitude || '-0.1402'),
        address: shop.address || ''
      })
    }

    const { data: ordersData } = await supabase.from('orders').select('*').eq('tailor_id', userId)
    if (ordersData) {
      const { data: usersData } = await supabase.from('users').select('id, username')
      const userMap = {}
      if (usersData) {
        usersData.forEach(u => {
          userMap[u.id] = u.username
        })
      }
      const enrichedOrders = ordersData.map(ord => ({
        ...ord,
        customerName: userMap[ord.customer_id] || 'Client'
      }))
      setOrders(enrichedOrders)
    }
  }

  useEffect(() => {
    const getSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { user: authUser } = session
        const { data: shop } = await supabase.from('shops').select('*').eq('id', authUser.id).maybeSingle()
        setUser({
          isLoggedIn: true,
          role: shop ? 'tailor' : 'customer',
          id: authUser.id,
          email: authUser.email
        })
      }
      setLoading(false)
    }

    getSessionAndRole()
    fetchShops()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { user: authUser } = session
        const { data: shop } = await supabase.from('shops').select('*').eq('id', authUser.id).maybeSingle()
        setUser({
          isLoggedIn: true,
          role: shop ? 'tailor' : 'customer',
          id: authUser.id,
          email: authUser.email
        })
      } else {
        setUser({ isLoggedIn: false, role: null, id: null, email: null })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user.isLoggedIn && user.id) {
      if (user.role === 'customer') {
        fetchCustomerData(user.id)
      } else if (user.role === 'tailor') {
        fetchTailorData(user.id)
      }
    }
  }, [user.isLoggedIn, user.role, user.id])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      let loginEmail = email
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
      showToast('Logged in successfully')
    } catch (err) {
      const errorText = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? (err.message || JSON.stringify(err)) : String(err))
      setMessage({ type: 'error', text: errorText })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            phone,
            is_tailor: roleSelection === 'tailor',
            shop_name: shopName,
            shop_bio: shopBio,
            shop_address: shopAddress,
            shop_latitude: parseFloat(shopLat),
            shop_longitude: parseFloat(shopLng)
          }
        }
      })
      if (error) throw error

      if (data?.session) {
        showToast('Registration successful and logged in')
      } else {
        showToast('Registration successful. Verify email if required.')
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? (err.message || JSON.stringify(err)) : String(err))
      setMessage({ type: 'error', text: errorText })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser({ isLoggedIn: false, role: null, id: null, email: null })
    setOrders([])
    setMeasurements([])
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      if (error) throw error
      showToast('Order status updated')
      fetchTailorData(user.id)
    } catch (err) {
      showToast(err.message)
    }
  }

  const handleSettingsSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('shops').update({
        shop_name: shopSettings.name,
        bio: shopSettings.bio,
        latitude: parseFloat(shopSettings.lat),
        longitude: parseFloat(shopSettings.lng),
        address: shopSettings.address
      }).eq('id', user.id)
      if (error) throw error
      showToast('Settings successfully updated')
      fetchShops()
      fetchTailorData(user.id)
    } catch (err) {
      showToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBookOrder = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error: orderError } = await supabase.from('orders').insert({
        customer_id: user.id,
        tailor_id: selectedShop.id,
        garment_type: bookingGarment,
        status: 'pending_measurements',
        total_price: parseFloat(bookingPrice),
        expected_delivery: bookingDelivery
      })
      if (orderError) throw orderError

      const { error: measError } = await supabase.from('measurements').insert({
        customer_id: user.id,
        tailor_id: selectedShop.id,
        garment_type: bookingGarment,
        metrics: {
          chest: parseFloat(bookingChest),
          waist: parseFloat(bookingWaist),
          sleeve: parseFloat(bookingSleeve)
        }
      })
      if (measError) throw measError

      showToast('Commission initialized and measurements vault entry saved')
      setShowBookingModal(false)
      setSelectedShop(null)
      setCustomerView('orders')
      fetchCustomerData(user.id)
    } catch (err) {
      showToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getRelativeCoords = (lat, lng) => {
    if (shops.length === 0) return { left: '50%', top: '50%' }
    let latitudes = shops.map(s => s.latitude)
    let longitudes = shops.map(s => s.longitude)
    let minLat = Math.min(...latitudes)
    let maxLat = Math.max(...latitudes)
    let minLng = Math.min(...longitudes)
    let maxLng = Math.max(...longitudes)

    if (maxLat === minLat) {
      minLat -= 0.01
      maxLat += 0.01
    }
    if (maxLng === minLng) {
      minLng -= 0.01
      maxLng += 0.01
    }

    const left = ((lng - minLng) / (maxLng - minLng)) * 80 + 10
    const top = ((maxLat - lat) / (maxLat - minLat)) * 80 + 10
    return { left: `${left}%`, top: `${top}%` }
  }

  const getStageColor = (currentStatus, stageName) => {
    const stages = ['pending_measurements', 'Fabric Cut', 'Stitching', 'Ready']
    const currentIndex = stages.indexOf(currentStatus)
    const stageIndex = stages.indexOf(stageName)
    
    if (stageIndex < currentIndex) {
      return 'bg-zinc-900 text-white border-zinc-900'
    }
    if (stageIndex === currentIndex) {
      return 'bg-zinc-900 text-white ring-4 ring-zinc-100 border-zinc-900'
    }
    return 'bg-white text-zinc-400 border-zinc-200'
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans flex flex-col antialiased">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 text-white text-xs font-medium px-4 py-3 rounded-lg border border-zinc-800 shadow-xl">
          {toast}
        </div>
      )}

      {!user.isLoggedIn ? (
        <div className="flex-1 flex flex-col">
          <header className="border-b border-zinc-100 py-4 px-6 md:px-12 flex justify-between items-center bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <span className="text-sm font-semibold tracking-tight text-zinc-900">TailorFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#map-section"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Find Shops
              </a>
              <a
                href="#auth-section"
                onClick={() => setAuthMode('login')}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Log In
              </a>
              <a
                href="#auth-section"
                onClick={() => setAuthMode('signup')}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors shadow-sm"
              >
                Get Started
              </a>
            </div>
          </header>

          <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-6 md:px-12 py-12 md:py-20 gap-20">
            <section className="text-center max-w-2xl mx-auto space-y-6">
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-zinc-900 leading-[1.15]">
                Tailoring Management,<br />
                <span className="font-normal">Reimagined for Quality.</span>
              </h1>
              <p className="text-zinc-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                Connect directly with master tailors, store secure measurement vaults, and track raw fabrics moving into custom outfits.
              </p>
              <div className="flex justify-center items-center gap-3 pt-2">
                <a
                  href="#auth-section"
                  onClick={() => {
                    setAuthMode('signup')
                    setRoleSelection('customer')
                  }}
                  className="px-5 py-2.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all shadow-sm"
                >
                  Join as Customer
                </a>
                <a
                  href="#auth-section"
                  onClick={() => {
                    setAuthMode('signup')
                    setRoleSelection('tailor')
                  }}
                  className="px-5 py-2.5 text-xs font-medium text-zinc-800 border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-all"
                >
                  Register Shop
                </a>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-100 pt-16">
              <div className="space-y-2.5">
                <span className="text-lg">🗺️</span>
                <h3 className="text-xs font-semibold text-zinc-900">Geographic Locators</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Tailors share live coordinate positions directly to an integrated mapping platform, matching local ateliers with customers nearby.
                </p>
              </div>
              <div className="space-y-2.5">
                <span className="text-lg">📏</span>
                <h3 className="text-xs font-semibold text-zinc-900">Measurement Vaults</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Store custom shirt, trousers, or blazer dimensional criteria securely in an adaptive database format, instantly available for orders.
                </p>
              </div>
              <div className="space-y-2.5">
                <span className="text-lg">🧵</span>
                <h3 className="text-xs font-semibold text-zinc-900">Active Workflows</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Follow production milestones in real time. Know exactly when your fabric is cut, when stitching starts, and when it is ready.
                </p>
              </div>
            </section>

            <section id="map-section" className="space-y-6 border-t border-zinc-100 pt-16">
              <div>
                <h2 className="text-xl font-normal tracking-tight text-zinc-900">Interactive Directory</h2>
                <p className="text-zinc-500 text-xs mt-1">Explore local tailor shop locations using real coordinates from our database.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 relative w-full h-[400px] bg-zinc-50 border border-zinc-200/80 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                  <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-zinc-200/50 rounded-full filter blur-3xl"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-48 h-32 bg-zinc-200/60 rounded-full filter blur-3xl"></div>

                  {shops.map((shop) => {
                    const coords = getRelativeCoords(shop.latitude, shop.longitude)
                    return (
                      <button
                        key={shop.id}
                        onClick={() => setSelectedShop(shop)}
                        style={{
                          left: coords.left,
                          top: coords.top
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-transform hover:scale-105"
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white shadow-md flex items-center justify-center text-white text-xs group-hover:bg-zinc-800 transition-colors">
                            📍
                          </div>
                          <span className="mt-1 bg-white px-2 py-0.5 rounded text-[10px] font-medium border border-zinc-200/80 shadow-sm text-zinc-800 max-w-[120px] truncate">
                            {shop.shop_name}
                          </span>
                        </div>
                      </button>
                    )
                  })}

                  {shops.length === 0 && (
                    <div className="absolute text-center p-4">
                      <p className="text-zinc-400 text-xs">No shops registered on the map yet.</p>
                    </div>
                  )}

                  {selectedShop && (
                    <div className="absolute bottom-4 left-4 right-4 bg-white p-4 border border-zinc-200 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 max-w-lg mx-auto">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900">{selectedShop.shop_name}</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{selectedShop.bio}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">📍 {selectedShop.address}</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => setSelectedShop(null)}
                          className="px-3 py-1.5 text-[10px] border border-zinc-200 hover:bg-zinc-50 rounded-lg font-medium text-zinc-600 transition-colors"
                        >
                          Close
                        </button>
                        <a
                          href="#auth-section"
                          onClick={() => {
                            setAuthMode('login')
                            setSelectedShop(null)
                          }}
                          className="px-3 py-1.5 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition-colors text-center"
                        >
                          Log in to order
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-zinc-200/60 rounded-xl bg-white space-y-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Ateliers</h3>
                    <p className="text-[11px] text-zinc-500">List of registered physical tailoring profiles.</p>
                  </div>

                  <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                    {shops.map(shop => (
                      <div
                        key={shop.id}
                        onClick={() => setSelectedShop(shop)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:border-zinc-300 ${
                          selectedShop?.id === shop.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-semibold text-zinc-900">{shop.shop_name}</h4>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {shop.latitude.toFixed(3)}, {shop.longitude.toFixed(3)}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{shop.bio}</p>
                        <p className="text-[10px] text-zinc-400 mt-2">📍 {shop.address}</p>
                      </div>
                    ))}
                    {shops.length === 0 && (
                      <p className="text-zinc-400 text-xs text-center py-6">No shops configured.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section id="auth-section" className="max-w-md w-full mx-auto border border-zinc-200/60 rounded-2xl p-6 md:p-8 bg-white shadow-sm space-y-6">
              <div className="flex justify-center border-b border-zinc-100 pb-4">
                <button
                  onClick={() => {
                    setAuthMode('login')
                    setMessage(null)
                  }}
                  className={`flex-1 text-center pb-2 text-xs font-medium border-b-2 transition-colors ${
                    authMode === 'login' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup')
                    setMessage(null)
                  }}
                  className={`flex-1 text-center pb-2 text-xs font-medium border-b-2 transition-colors ${
                    authMode === 'signup' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {authMode === 'signup' && (
                <div className="flex bg-zinc-50 p-1 rounded-lg">
                  <button
                    onClick={() => setRoleSelection('customer')}
                    className={`flex-1 text-center py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all ${
                      roleSelection === 'customer' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'
                    }`}
                  >
                    As Customer
                  </button>
                  <button
                    onClick={() => setRoleSelection('tailor')}
                    className={`flex-1 text-center py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all ${
                      roleSelection === 'tailor' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'
                    }`}
                  >
                    As Tailor Shop
                  </button>
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-lg text-xs border ${
                  message.type === 'success' ? 'bg-zinc-50 border-zinc-200 text-zinc-800' : 'bg-red-50/50 border-red-100 text-red-600'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={authMode === 'login' ? handleLogin : handleSignUp} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="alex_atelier"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {authMode === 'login' ? 'Email or Phone' : 'Email Address'}
                  </label>
                  <input
                    type={authMode === 'login' ? 'text' : 'email'}
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={authMode === 'login' ? 'email@example.com or phone' : 'email@example.com'}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                  />
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+44 7911 123456"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                  />
                </div>

                {authMode === 'signup' && roleSelection === 'tailor' && (
                  <div className="space-y-4 pt-2 border-t border-zinc-100">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Shop Profile Setup</h4>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Shop Name</label>
                      <input
                        type="text"
                        required
                        value={shopName}
                        onChange={e => setShopName(e.target.value)}
                        placeholder="Savile Row Bespoke"
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Bio</label>
                      <textarea
                        value={shopBio}
                        onChange={e => setShopBio(e.target.value)}
                        placeholder="Heritage tailoring since 1985..."
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white h-20 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Address</label>
                      <input
                        type="text"
                        required
                        value={shopAddress}
                        onChange={e => setShopAddress(e.target.value)}
                        placeholder="8 Savile Row, London"
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={shopLat}
                          onChange={e => setShopLat(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={shopLng}
                          onChange={e => setShopLng(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none transition-colors shadow-sm"
                >
                  {authMode === 'login' ? 'Sign In' : 'Register Account'}
                </button>
              </form>
            </section>
          </main>
        </div>
      ) : user.role === 'customer' ? (
        <div className="flex-1 flex flex-col bg-zinc-50/50">
          <header className="border-b border-zinc-100 py-4 px-6 md:px-12 flex justify-between items-center bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <span className="text-sm font-semibold tracking-tight text-zinc-900">TailorFlow</span>
              <span className="text-[10px] bg-zinc-100 text-zinc-600 font-medium px-2 py-0.5 rounded">Customer Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCustomerView('orders')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    customerView === 'orders' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  My Orders
                </button>
                <button
                  onClick={() => setCustomerView('browse')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    customerView === 'browse' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Browse Map
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors border border-zinc-200 rounded-lg"
              >
                Log Out
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-12 py-10 space-y-8">
            <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-normal tracking-tight text-zinc-900">Welcome to your dashboard</h1>
                <p className="text-zinc-500 text-xs mt-1">Review active commissions, clothing production phases, and tailoring profiles.</p>
              </div>
              {customerView === 'orders' && (
                <button
                  onClick={() => setCustomerView('browse')}
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  📍 Find Ateliers
                </button>
              )}
            </div>

            {customerView === 'orders' ? (
              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Commissions</h3>
                <div className="grid grid-cols-1 gap-6">
                  {orders.map(order => {
                    const shop = shops.find(s => s.id === order.tailor_id)
                    return (
                      <div key={order.id} className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-zinc-100">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{order.id}</span>
                            <h4 className="text-sm font-semibold text-zinc-900 mt-0.5">{order.garment_type}</h4>
                            <p className="text-[11px] text-zinc-500 mt-0.5">By {shop ? shop.shop_name : 'Atelier'}</p>
                          </div>
                          <div className="text-left md:text-right">
                            <span className="text-xs font-bold text-zinc-900">${parseFloat(order.total_price).toFixed(2)}</span>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Expected Delivery: {order.expected_delivery}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between text-[11px] text-zinc-400 font-medium px-1">
                            <span>Pending Measurements</span>
                            <span>Fabric Cut</span>
                            <span>Stitching</span>
                            <span>Ready for pickup</span>
                          </div>
                          <div className="relative flex items-center justify-between px-6">
                            <div className="absolute left-6 right-6 h-0.5 bg-zinc-100 -z-10"></div>
                            <div className="absolute left-6 h-0.5 bg-zinc-900 -z-10 transition-all duration-500" style={{
                              width: order.status === 'Fabric Cut' ? '33%' : order.status === 'Stitching' ? '66%' : order.status === 'Ready' ? '100%' : '0%'
                            }}></div>
                            
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${getStageColor(order.status, 'pending_measurements')}`}>
                              <span className="text-[9px] font-semibold">1</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${getStageColor(order.status, 'Fabric Cut')}`}>
                              <span className="text-[9px] font-semibold">2</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${getStageColor(order.status, 'Stitching')}`}>
                              <span className="text-[9px] font-semibold">3</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${getStageColor(order.status, 'Ready')}`}>
                              <span className="text-[9px] font-semibold">4</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {orders.length === 0 && (
                    <div className="bg-white border border-zinc-200/60 rounded-2xl p-10 text-center">
                      <p className="text-zinc-400 text-xs">No active commissions found. Choose a shop on the map to place an order.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Map & Shop Finder</h3>
                <div className="relative w-full h-[450px] bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                  <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-zinc-200/50 rounded-full filter blur-3xl"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-48 h-32 bg-zinc-200/60 rounded-full filter blur-3xl"></div>

                  {shops.map((shop) => {
                    const coords = getRelativeCoords(shop.latitude, shop.longitude)
                    return (
                      <button
                        key={shop.id}
                        onClick={() => setSelectedShop(shop)}
                        style={{
                          left: coords.left,
                          top: coords.top
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-transform hover:scale-105"
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white shadow-md flex items-center justify-center text-white text-xs group-hover:bg-zinc-800 transition-colors">
                            📍
                          </div>
                          <span className="mt-1 bg-white px-2 py-0.5 rounded text-[10px] font-medium border border-zinc-200/80 shadow-sm text-zinc-800 max-w-[120px] truncate">
                            {shop.shop_name}
                          </span>
                        </div>
                      </button>
                    )
                  })}

                  {selectedShop && !showBookingModal && (
                    <div className="absolute bottom-4 left-4 right-4 bg-white p-4 border border-zinc-200 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 max-w-lg mx-auto">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900">{selectedShop.shop_name}</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{selectedShop.bio}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">📍 {selectedShop.address}</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => setSelectedShop(null)}
                          className="px-3 py-1.5 text-[10px] border border-zinc-200 hover:bg-zinc-50 rounded-lg font-medium text-zinc-600 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => setShowBookingModal(true)}
                          className="px-3 py-1.5 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition-colors"
                        >
                          Commission Outfit
                        </button>
                      </div>
                    </div>
                  )}

                  {showBookingModal && selectedShop && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-6 overflow-y-auto flex flex-col justify-center max-w-md mx-auto my-4 border border-zinc-200 rounded-2xl shadow-xl space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-900">New Commission: {selectedShop.shop_name}</h4>
                        <p className="text-[11px] text-zinc-500">Provide garment properties and physical measurement points.</p>
                      </div>

                      <form onSubmit={handleBookOrder} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Garment Type</label>
                            <select
                              value={bookingGarment}
                              onChange={e => setBookingGarment(e.target.value)}
                              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 bg-white"
                            >
                              <option value="Suit">Suit</option>
                              <option value="Shirt">Shirt</option>
                              <option value="Trousers">Trousers</option>
                              <option value="Dress">Dress</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Price ($)</label>
                            <input
                              type="number"
                              required
                              value={bookingPrice}
                              onChange={e => setBookingPrice(e.target.value)}
                              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Target Delivery Date</label>
                          <input
                            type="date"
                            required
                            value={bookingDelivery}
                            onChange={e => setBookingDelivery(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:outline-none bg-white"
                          />
                        </div>

                        <div className="pt-2 border-t border-zinc-100 space-y-2">
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Measurement Values (Inches)</h5>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="block text-[9px] text-zinc-500">Chest</label>
                              <input
                                type="number"
                                required
                                value={bookingChest}
                                onChange={e => setBookingChest(e.target.value)}
                                className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] text-zinc-500">Waist</label>
                              <input
                                type="number"
                                required
                                value={bookingWaist}
                                onChange={e => setBookingWaist(e.target.value)}
                                className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] text-zinc-500">Sleeve</label>
                              <input
                                type="number"
                                required
                                value={bookingSleeve}
                                onChange={e => setBookingSleeve(e.target.value)}
                                className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => setShowBookingModal(false)}
                            className="px-3.5 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-2 text-xs bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium"
                          >
                            Send Blueprint
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row">
          <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-zinc-100 flex flex-col bg-white">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <span className="text-sm font-semibold tracking-tight text-zinc-900">TailorFlow</span>
              </div>
              <span className="text-[9px] bg-zinc-900 text-white font-medium px-2 py-0.5 rounded">Tailor</span>
            </div>

            <nav className="flex-1 p-4 space-y-1.5">
              <button
                onClick={() => setTailorTab('orders')}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  tailorTab === 'orders' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                📋 Orders Management
              </button>
              <button
                onClick={() => setTailorTab('settings')}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  tailorTab === 'settings' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                ⚙️ Shop Settings
              </button>
            </nav>

            <div className="p-4 border-t border-zinc-100">
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors border border-zinc-200 rounded-lg flex items-center justify-center"
              >
                Sign Out
              </button>
            </div>
          </aside>

          <main className="flex-1 bg-zinc-50/50 p-6 md:p-10 space-y-8 overflow-y-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-normal tracking-tight text-zinc-900">Workshop Dashboard</h1>
                <p className="text-zinc-500 text-xs mt-1">Manage physical space representation, shop information, and order state transition logs.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Pending Orders</span>
                <p className="text-2xl font-light text-zinc-900">{orders.filter(o => o.status !== 'Ready').length}</p>
              </div>
              <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Total Commissions</span>
                <p className="text-2xl font-light text-zinc-900">{orders.length}</p>
              </div>
              <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Revenue Ledger</span>
                <p className="text-2xl font-light text-zinc-900">
                  ${orders.reduce((sum, ord) => sum + parseFloat(ord.total_price || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Active Shop</span>
                <p className="text-sm font-medium text-zinc-900 truncate mt-1.5">{shopSettings.name || 'Your Workshop'}</p>
              </div>
            </div>

            {tailorTab === 'orders' ? (
              <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Commission Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-50/50">
                        <th className="px-6 py-3.5">Customer</th>
                        <th className="px-6 py-3.5">Garment</th>
                        <th className="px-6 py-3.5">Price</th>
                        <th className="px-6 py-3.5">Delivery</th>
                        <th className="px-6 py-3.5">Workflow Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-zinc-900">{order.customerName}</td>
                          <td className="px-6 py-4 text-zinc-500">{order.garment_type}</td>
                          <td className="px-6 py-4 font-mono text-zinc-900">${parseFloat(order.total_price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-zinc-500">{order.expected_delivery}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                              order.status === 'Ready'
                                ? 'bg-zinc-50 text-zinc-900 border-zinc-300'
                                : order.status === 'Stitching'
                                ? 'bg-zinc-50 text-zinc-900 border-zinc-200'
                                : 'bg-zinc-50 text-zinc-500 border-zinc-100'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                            >
                              <option value="pending_measurements">Pending Measurements</option>
                              <option value="Fabric Cut">Fabric Cut</option>
                              <option value="Stitching">Stitching</option>
                              <option value="Ready">Ready</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-10 text-center text-zinc-400">
                            No active orders in your workshop. Orders placed by customers will appear here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl bg-white border border-zinc-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Shop Settings</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">Configure details rendered dynamically on the public map page.</p>
                </div>
                
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      required
                      value={shopSettings.name}
                      onChange={e => setShopSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Bio
                    </label>
                    <textarea
                      value={shopSettings.bio}
                      onChange={e => setShopSettings(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white h-20 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Address
                    </label>
                    <input
                      type="text"
                      required
                      value={shopSettings.address}
                      onChange={e => setShopSettings(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={shopSettings.lat}
                        onChange={e => setShopSettings(prev => ({ ...prev, lat: e.target.value }))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={shopSettings.lng}
                        onChange={e => setShopSettings(prev => ({ ...prev, lng: e.target.value }))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors shadow-sm"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}
