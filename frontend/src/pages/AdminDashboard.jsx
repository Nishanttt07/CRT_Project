import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [shops, setShops] = useState([])
  const [stats, setStats] = useState({ users: 0, tailors: 0, orders: 0 })
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('verification')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const fetchAdminData = async () => {
    // Fetch shops
    const { data: shopsData, error: shopsError } = await supabase
      .from('shops')
      .select('*, users(email, phone, username)')
      .order('created_at', { ascending: false })
    if (shopsData) setShops(shopsData)

    // Fetch basic stats (in a real app, use count queries)
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
    
    setStats({
      users: usersCount || 0,
      tailors: shopsData?.length || 0,
      orders: ordersCount || 0
    })
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleUpdateStatus = async (shopId, newStatus) => {
    try {
      const { error } = await supabase.from('shops').update({ status: newStatus }).eq('id', shopId)
      if (error) throw error
      showToast(`Shop marked as ${newStatus}`)
      fetchAdminData()
    } catch (err) {
      showToast(err.message)
    }
  }

  const handleTogglePromo = async (shopId, currentPromo) => {
    try {
      const { error } = await supabase.from('shops').update({ is_promoted: !currentPromo }).eq('id', shopId)
      if (error) throw error
      showToast(currentPromo ? 'Shop promotion disabled' : 'Shop promoted successfully')
      fetchAdminData()
    } catch (err) {
      showToast(err.message)
    }
  }

  const handleUpdateSubscription = async (shopId, plan, daysToAdd) => {
    try {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + daysToAdd)

      const { error } = await supabase.from('shops').update({
        subscription_plan: plan,
        valid_until: validUntil.toISOString()
      }).eq('id', shopId)

      if (error) throw error
      showToast(`Subscription upgraded to ${plan} for ${daysToAdd} days`)
      fetchAdminData()
    } catch (err) {
      showToast(err.message)
    }
  }

  const pendingShops = shops.filter(s => s.status === 'pending')

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-800 text-white text-xs font-medium px-5 py-3.5 rounded-xl border border-zinc-700 shadow-2xl flex items-center gap-2">
          <span className="text-emerald-400">✓</span> {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">TailorFlow</span>
            </Link>
            <span className="text-[10px] bg-rose-500/20 text-rose-400 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-500/20">Admin Console</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={logout} className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Total Users</p>
            <p className="text-3xl font-light text-white">{stats.users}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Total Shops</p>
            <p className="text-3xl font-light text-white">{stats.tailors}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Total Orders</p>
            <p className="text-3xl font-light text-white">{stats.orders}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-800">
          {['verification', 'subscriptions', 'ads'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === tab ? 'border-rose-500 text-rose-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab} {tab === 'verification' && pendingShops.length > 0 && `(${pendingShops.length})`}
            </button>
          ))}
        </div>

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Pending Verifications</h2>
            {pendingShops.length === 0 ? (
              <p className="text-zinc-500 text-sm">No shops pending verification.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingShops.map(shop => (
                  <div key={shop.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white">{shop.shop_name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{shop.users?.email}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 mb-4">{shop.address}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStatus(shop.id, 'verified')} className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors">Approve</button>
                      <button onClick={() => handleUpdateStatus(shop.id, 'rejected')} className="flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-2 rounded-lg text-xs font-semibold transition-colors">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Manage Subscriptions</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-800/50 text-[10px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Shop Name</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Plan</th>
                    <th className="px-6 py-4 font-medium">Valid Until</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {shops.map(shop => (
                    <tr key={shop.id} className="hover:bg-zinc-800/20">
                      <td className="px-6 py-4 text-white font-medium">{shop.shop_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${shop.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : shop.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {shop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 uppercase text-xs">{shop.subscription_plan}</td>
                      <td className="px-6 py-4 text-xs font-mono">{shop.valid_until ? new Date(shop.valid_until).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleUpdateSubscription(shop.id, 'free', 30)} className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors">Grant Free (30d)</button>
                          <button onClick={() => handleUpdateSubscription(shop.id, 'premium', 365)} className="text-[10px] px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded transition-colors border border-rose-500/20">Grant Premium (1y)</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ads / Promos Tab */}
        {activeTab === 'ads' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Promoted Shops (Ads)</h2>
            <p className="text-sm text-zinc-500">Shops toggled as promoted will appear at the top of the map list on the landing page.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.filter(s => s.status === 'verified').map(shop => (
                <div key={shop.id} className={`border rounded-xl p-5 transition-all ${shop.is_promoted ? 'bg-amber-500/5 border-amber-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{shop.shop_name}</h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{shop.users?.email}</p>
                    </div>
                    {shop.is_promoted && <span className="bg-amber-500/20 text-amber-500 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">Promoted</span>}
                  </div>
                  <button
                    onClick={() => handleTogglePromo(shop.id, shop.is_promoted)}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                      shop.is_promoted 
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-lg shadow-amber-500/20'
                    }`}
                  >
                    {shop.is_promoted ? 'Remove Promotion' : 'Set as Promoted Ad'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
