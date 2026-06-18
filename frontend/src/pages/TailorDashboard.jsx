import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'

export default function TailorDashboard() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [activeTab, setActiveTab] = useState('orders')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null) // For invoices
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: 'meters' })
  const [shopSettings, setShopSettings] = useState({
    name: '', bio: '', lat: '51.5113', lng: '-0.1402', address: ''
  })

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setShopSettings(prev => ({
          ...prev,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude)
        }));
        showToast('Location captured successfully!');
      }, (error) => {
        showToast('Error capturing location: ' + error.message);
      });
    } else {
      showToast('Geolocation is not supported by your browser.');
    }
  };

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

    const { data: ordersData } = await supabase.from('orders').select('*').eq('tailor_id', user.id).order('created_at', { ascending: false })
    if (ordersData) {
      const { data: usersData } = await supabase.from('users').select('id, username, phone')
      const userMap = {}
      if (usersData) usersData.forEach(u => { userMap[u.id] = { name: u.username, phone: u.phone } })
      setOrders(ordersData.map(o => ({ 
        ...o, 
        customerName: userMap[o.customer_id]?.name || 'Client',
        customerPhone: userMap[o.customer_id]?.phone || ''
      })))
    }

    const { data: inventoryData } = await supabase.from('inventory').select('*').eq('tailor_id', user.id).order('updated_at', { ascending: false })
    if (inventoryData) {
      setInventory(inventoryData)
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

  const handlePaymentUpdate = async (orderId, amount) => {
    try {
      const { error } = await supabase.from('orders').update({ amount_paid: amount }).eq('id', orderId)
      if (error) throw error
      showToast('Payment updated')
      fetchTailorData()
    } catch (err) {
      showToast(err.message)
    }
  }

  const generateWhatsAppLink = (phone, order) => {
    if (!phone) return '#';
    const num = phone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Hello ${order.customerName},\nThis is an update regarding your order for ${order.garment_type}. Current status: ${order.status}. Expected delivery: ${order.expected_delivery || 'TBD'}.`);
    return `https://wa.me/${num}?text=${msg}`;
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

  const handleAddInventory = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('inventory').insert([{ 
        tailor_id: user.id, 
        item_name: newItem.name, 
        quantity: parseFloat(newItem.quantity), 
        unit: newItem.unit 
      }])
      if (error) throw error
      showToast('Item added to inventory')
      fetchTailorData()
      setNewItem({ name: '', quantity: 0, unit: 'meters' })
    } catch (err) {
      showToast(err.message)
    }
  }

  const handleDeleteInventory = async (id) => {
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id)
      if (error) throw error
      showToast('Item deleted')
      fetchTailorData()
    } catch (err) {
      showToast(err.message)
    }
  }

  const pendingOrders = orders.filter(o => o.status !== 'Ready')
  const completedOrders = orders.filter(o => o.status === 'Ready')
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.amount_paid || 0), 0) // changed to amount_paid

  const sidebarItems = [
    { id: 'orders', icon: '📋', label: 'Orders' },
    { id: 'stocks', icon: '🧵', label: 'Stocks (Inventory)' },
    { id: 'history', icon: '📜', label: 'History' },
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

          {/* Deadline Notifications */}
          {pendingOrders.filter(o => o.expected_delivery && new Date(o.expected_delivery) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)).length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 backdrop-blur-sm animate-fade-in">
              <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
                <span>⚠️</span> Upcoming Deadlines (Next 5 Days)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingOrders.filter(o => o.expected_delivery && new Date(o.expected_delivery) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)).map(o => (
                  <div key={o.id} className="bg-zinc-950/50 rounded-xl p-3 border border-rose-500/10">
                    <p className="text-xs text-white font-medium">{o.customerName} - {o.garment_type}</p>
                    <p className="text-[10px] text-rose-400/80 mt-1">Due: {new Date(o.expected_delivery).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <div className="p-6 space-y-4">
                {pendingOrders.map(order => {
                  const total = parseFloat(order.total_price || 0)
                  const paid = parseFloat(order.amount_paid || 0)
                  const balance = total - paid
                  
                  return (
                    <div key={order.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-5 hover:border-zinc-700/50 transition-colors flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center text-violet-300 text-sm font-bold border border-violet-500/20">
                            {order.customerName?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{order.customerName}</h4>
                            <p className="text-xs text-zinc-400">{order.garment_type} • Due: {order.expected_delivery || 'TBD'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                            href={generateWhatsAppLink(order.customerPhone, order)}
                            target="_blank" rel="noopener noreferrer"
                            className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            💬 WhatsApp
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                        {/* Timeline */}
                        <div className="flex items-center gap-2">
                          {['pending_measurements', 'Fabric Cut', 'Stitching', 'Ready'].map((step, idx, arr) => {
                            const isCurrent = order.status === step;
                            const isPast = arr.indexOf(order.status) > idx;
                            const stepLabels = {
                              'pending_measurements': 'Pending',
                              'Fabric Cut': 'Fabric Cut',
                              'Stitching': 'Stitching',
                              'Ready': 'Ready'
                            }
                            return (
                              <div key={step} className="flex items-center">
                                <button 
                                  onClick={() => handleStatusChange(order.id, step)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                    isCurrent ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 
                                    isPast ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600' : 
                                    'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                                  }`}
                                >
                                  {stepLabels[step]}
                                </button>
                                {idx < arr.length - 1 && (
                                  <div className={`h-[2px] w-4 mx-1 rounded-full ${isPast ? 'bg-zinc-700' : 'bg-zinc-800'}`}></div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Payments */}
                        <div className="flex items-center justify-end gap-6 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Total</p>
                            <p className="text-sm font-mono text-white">₹{total.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Paid</p>
                            <input 
                              type="number" 
                              defaultValue={paid}
                              onBlur={(e) => {
                                if (e.target.value !== String(paid)) {
                                  handlePaymentUpdate(order.id, parseFloat(e.target.value || 0))
                                }
                              }}
                              className="w-20 bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Balance</p>
                            <p className={`text-sm font-mono ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>₹{balance.toFixed(0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {pendingOrders.length === 0 && (
                  <div className="py-14 text-center">
                    <span className="text-3xl block mb-3">📋</span>
                    <p className="text-zinc-500 text-sm">No active orders. Customer orders will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stocks Tab */}
          {activeTab === 'stocks' && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl backdrop-blur-sm overflow-hidden animate-fade-in">
              <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-white">Inventory Management</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Track your fabrics and raw materials.</p>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleAddInventory} className="flex flex-col sm:flex-row gap-4 mb-6 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                  <input type="text" placeholder="Item Name (e.g. Cotton Fabric)" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50" />
                  <div className="flex gap-4">
                    <input type="number" placeholder="Qty" required step="0.1" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50" />
                    <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50">
                      <option value="meters">Meters</option>
                      <option value="yards">Yards</option>
                      <option value="pieces">Pieces</option>
                      <option value="spools">Spools</option>
                    </select>
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors">Add</button>
                  </div>
                </form>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.map(item => (
                    <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center group hover:border-zinc-700 transition-colors">
                      <div>
                        <h4 className="text-sm font-medium text-white">{item.item_name}</h4>
                        <p className="text-xs text-emerald-400 font-mono mt-1">{item.quantity} {item.unit}</p>
                      </div>
                      <button onClick={() => handleDeleteInventory(item.id)} className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                        🗑️
                      </button>
                    </div>
                  ))}
                  {inventory.length === 0 && (
                    <div className="col-span-full py-10 text-center text-zinc-500 text-xs">
                      No inventory items found. Add some above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl backdrop-blur-sm overflow-hidden animate-fade-in">
              <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-white">Order History</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Completed and delivered orders.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-800/50 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 bg-zinc-900/30">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Garment</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {completedOrders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-white">{order.customerName}</td>
                        <td className="px-6 py-4 text-xs text-zinc-400">{order.garment_type}</td>
                        <td className="px-6 py-4 text-xs font-mono text-emerald-400">₹{parseFloat(order.total_price).toFixed(0)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-2"
                          >
                            View Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                    {completedOrders.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-14 text-center text-zinc-500 text-xs">
                          No completed orders yet.
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

                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Location Setup</label>
                  <div className="flex gap-4 items-start">
                    <button type="button" onClick={handleGeolocation} className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-xl border border-zinc-700 transition-colors text-xs flex items-center justify-center gap-2">
                      <span>📍</span> Use Live Device Location
                    </button>
                    <div className="flex-1 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 flex justify-around items-center">
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Captured Latitude</p>
                        <p className="text-sm text-emerald-400 font-mono mt-0.5">{shopSettings.lat || 'Pending...'}</p>
                      </div>
                      <div className="w-px h-8 bg-zinc-800"></div>
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Captured Longitude</p>
                        <p className="text-sm text-emerald-400 font-mono mt-0.5">{shopSettings.lng || 'Pending...'}</p>
                      </div>
                    </div>
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

      {/* Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-white font-semibold flex items-center gap-2"><span>🧾</span> Invoice</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div id="invoice-content" className="p-8 space-y-6 bg-white text-black overflow-y-auto">
              <div className="flex justify-between border-b pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">{shopSettings.name || 'Tailor Shop'}</h1>
                  <p className="text-xs text-zinc-500 mt-1">{shopSettings.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg tracking-widest text-zinc-300 uppercase">Invoice</p>
                  <p className="text-xs text-zinc-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="border-b pb-6">
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-2">Bill To:</p>
                <p className="text-base font-semibold text-zinc-800">{selectedOrder.customerName}</p>
                <p className="text-xs text-zinc-500 mt-1">{selectedOrder.customerPhone || 'N/A'}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[10px] uppercase tracking-widest text-zinc-400">
                    <th className="py-3 font-semibold">Description</th>
                    <th className="py-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="py-4 text-zinc-700">{selectedOrder.garment_type} <span className="text-zinc-400 text-xs">(Custom Tailoring)</span></td>
                    <td className="py-4 text-right font-mono text-zinc-800">₹{parseFloat(selectedOrder.total_price || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="space-y-2 text-right text-sm pt-4">
                <p className="text-zinc-600">Total: <span className="font-mono text-zinc-800 ml-4">₹{parseFloat(selectedOrder.total_price || 0).toFixed(2)}</span></p>
                <p className="text-zinc-600">Amount Paid: <span className="font-mono text-emerald-600 ml-4">₹{parseFloat(selectedOrder.amount_paid || 0).toFixed(2)}</span></p>
                <p className="font-bold pt-4 border-t text-zinc-800">Balance Due: <span className="font-mono text-rose-600 ml-4">₹{(parseFloat(selectedOrder.total_price || 0) - parseFloat(selectedOrder.amount_paid || 0)).toFixed(2)}</span></p>
              </div>
            </div>
            <div className="p-4 bg-zinc-950 flex justify-end gap-3 shrink-0 border-t border-zinc-800">
              <button onClick={() => {
                const printContents = document.getElementById('invoice-content').innerHTML;
                const originalContents = document.body.innerHTML;
                document.body.innerHTML = `<div style="max-width:600px;margin:0 auto;padding:40px;font-family:sans-serif;">${printContents}</div>`;
                window.print();
                document.body.innerHTML = originalContents;
                window.location.reload(); // Quick hack to restore react state after replacing DOM
              }} className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-teal-500/20">
                🖨️ Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
