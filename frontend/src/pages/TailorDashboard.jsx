import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'

export default function TailorDashboard() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('orders')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [shopSettings, setShopSettings] = useState({
    name: '', bio: '', lat: '51.5113', lng: '-0.1402', address: ''
  })

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const fetchTailorData = async () => {
    const { data: shop } = await supabase.from('shops').select('*').eq('id', user.id).maybeSingle()
    if (shop) {
      setShopSettings({
        name: shop.shop_name,
        bio: shop.bio || '',
        lat: String(shop.latitude || '51.5113'),
        lng: String(shop.longitude || '-0.1402'),
        address: shop.address || ''
      })
    }

    const { data: ordersData } = await supabase.from('orders').select('*').eq('tailor_id', user.id)
    if (ordersData) {
      const { data: usersData } = await supabase.from('users').select('id, username')
      const userMap = {}
      if (usersData) usersData.forEach(u => { userMap[u.id] = u.username })
      setOrders(ordersData.map(o => ({ ...o, customerName: userMap[o.customer_id] || 'Client' })))
    }
  }

  useEffect(() => {
    if (user.id) fetchTailorData()
  }, [user.id])

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      if (error) throw error
      showToast('Order status updated')
      fetchTailorData()
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
      showToast('Shop settings saved')
    } catch (err) {
      showToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  const pendingOrders = orders.filter(o => o.status !== 'Ready')
  const completedOrders = orders.filter(o => o.status === 'Ready')
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)

  const sidebarItems = [
    { id: 'orders', icon: '📋', label: 'Orders' },
    { id: 'settings', icon: '⚙️', label: 'Shop Settings' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-800 text-white text-xs font-medium px-5 py-3.5 rounded-xl border border-zinc-700 shadow-2xl shadow-black/30 animate-slide-up flex items-center gap-2">
          <span className="text-emerald-400">✓</span> {toast}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900/50 border-r border-zinc-800/50 flex flex-col backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-6 border-b border-zinc-800/50">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-white tracking-tight block">TailorFlow</span>
              <span className="text-[9px] text-emerald-400 font-medium">Workshop</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 text-xs font-medium rounded-xl transition-all flex items-center gap-3 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.id === 'orders' && pendingOrders.length > 0 && (
                <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Profile section */}
        <div className="p-4 border-t border-zinc-800/50 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white text-[10px] font-bold">
              {user.username?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.username || 'Tailor'}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-xs font-medium text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-center"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Workshop Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage orders, update shop settings, and track your business.</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="text-amber-400 text-sm">⏳</span>
                </div>
              </div>
              <p className="text-2xl font-light text-white">{pendingOrders.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Pending</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-emerald-400 text-sm">✅</span>
                </div>
              </div>
              <p className="text-2xl font-light text-white">{completedOrders.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Completed</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <span className="text-violet-400 text-sm">📦</span>
                </div>
              </div>
              <p className="text-2xl font-light text-white">{orders.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Total Orders</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <span className="text-teal-400 text-sm">💰</span>
                </div>
              </div>
              <p className="text-2xl font-light text-white">₹{totalRevenue.toFixed(0)}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Revenue</p>
            </div>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl backdrop-blur-sm overflow-hidden animate-fade-in">
              <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-white">Orders Management</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{orders.length} total commissions</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-800/50 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 bg-zinc-900/30">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Garment</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Delivery</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center text-violet-300 text-[10px] font-bold border border-violet-500/20">
                              {order.customerName?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <span className="text-xs font-medium text-white">{order.customerName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400">{order.garment_type}</td>
                        <td className="px-6 py-4 text-xs font-mono text-emerald-400">₹{parseFloat(order.total_price).toFixed(0)}</td>
                        <td className="px-6 py-4 text-xs text-zinc-500">{order.expected_delivery || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            order.status === 'Ready'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : order.status === 'Stitching'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : order.status === 'Fabric Cut'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              order.status === 'Ready' ? 'bg-emerald-400' :
                              order.status === 'Stitching' ? 'bg-amber-400' :
                              order.status === 'Fabric Cut' ? 'bg-blue-400' :
                              'bg-zinc-500'
                            }`}></span>
                            {order.status === 'pending_measurements' ? 'Pending' : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer hover:border-zinc-600 transition-colors"
                          >
                            <option value="pending_measurements">Pending</option>
                            <option value="Fabric Cut">Fabric Cut</option>
                            <option value="Stitching">Stitching</option>
                            <option value="Ready">Ready</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-14 text-center">
                          <span className="text-3xl block mb-3">📋</span>
                          <p className="text-zinc-500 text-xs">No orders yet. Customer orders will appear here.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm animate-fade-in">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white">Shop Configuration</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Update your shop profile shown on the public directory.</p>
              </div>

              <form onSubmit={handleSettingsSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={shopSettings.name}
                    onChange={e => setShopSettings(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Bio</label>
                  <textarea
                    value={shopSettings.bio}
                    onChange={e => setShopSettings(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all h-24 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Address</label>
                  <input
                    type="text"
                    required
                    value={shopSettings.address}
                    onChange={e => setShopSettings(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={shopSettings.lat}
                      onChange={e => setShopSettings(prev => ({ ...prev, lat: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={shopSettings.lng}
                      onChange={e => setShopSettings(prev => ({ ...prev, lng: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
