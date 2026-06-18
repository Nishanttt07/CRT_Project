import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [shops, setShops] = useState([])
  const [shopRatings, setShopRatings] = useState({})
  const [activeTab, setActiveTab] = useState('orders')
  const [selectedShop, setSelectedShop] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  // Rating state
  const [reviewData, setReviewData] = useState({ rating: 0, text: '' })

  // Booking form
  const [bookingGarment, setBookingGarment] = useState('Suit')
  const [bookingPrice, setBookingPrice] = useState('500')
  const [bookingDelivery, setBookingDelivery] = useState('')
  const [bookingChest, setBookingChest] = useState('40')
  const [bookingWaist, setBookingWaist] = useState('34')
  const [bookingSleeve, setBookingSleeve] = useState('25')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const fetchShops = async () => {
    const { data } = await supabase.from('shops').select('*')
    if (data) setShops(data)
    
    const { data: ratingsData } = await supabase.from('shop_ratings').select('*')
    if (ratingsData) {
      const ratingsMap = {}
      ratingsData.forEach(r => { ratingsMap[r.shop_id] = r })
      setShopRatings(ratingsMap)
    }
  }

  const fetchCustomerData = async () => {
    const { data: ordersData } = await supabase.from('orders').select('*').eq('customer_id', user.id)
    if (ordersData) setOrders(ordersData)
    const { data: measData } = await supabase.from('measurements').select('*').eq('customer_id', user.id)
    if (measData) setMeasurements(measData)
  }

  useEffect(() => {
    fetchShops()
    if (user.id) fetchCustomerData()
  }, [user.id])

  const handleSubmitRating = async (orderId) => {
    if (reviewData.rating === 0) return showToast('Please select a rating star')
    setLoading(true)
    try {
      const { error } = await supabase.from('orders').update({
        customer_rating: reviewData.rating,
        customer_review: reviewData.text
      }).eq('id', orderId)
      if (error) throw error
      showToast('Thank you for your feedback!')
      setReviewData({ rating: 0, text: '' })
      fetchCustomerData()
      fetchShops()
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

      showToast('Order placed successfully!')
      setShowBookingModal(false)
      setSelectedShop(null)
      setActiveTab('orders')
      fetchCustomerData()
    } catch (err) {
      showToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getRelativeCoords = (lat, lng) => {
    if (shops.length === 0) return { left: '50%', top: '50%' }
    const lats = shops.map(s => s.latitude)
    const lngs = shops.map(s => s.longitude)
    let minLat = Math.min(...lats), maxLat = Math.max(...lats)
    let minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
    if (maxLat === minLat) { minLat -= 0.01; maxLat += 0.01 }
    if (maxLng === minLng) { minLng -= 0.01; maxLng += 0.01 }
    return {
      left: `${((lng - minLng) / (maxLng - minLng)) * 80 + 10}%`,
      top: `${((maxLat - lat) / (maxLat - minLat)) * 80 + 10}%`
    }
  }

  const stages = ['pending_measurements', 'Fabric Cut', 'Stitching', 'Ready']
  const getStageProgress = (status) => stages.indexOf(status)

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 text-white text-xs font-medium px-5 py-3.5 rounded-xl border border-zinc-800 shadow-2xl shadow-black/20 animate-slide-up flex items-center gap-2">
          <span className="text-green-400">✓</span> {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-zinc-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <span className="text-sm font-semibold text-zinc-900 tracking-tight">TailorFlow</span>
            </Link>
            <span className="text-[10px] bg-violet-100 text-violet-700 font-semibold px-2.5 py-1 rounded-full">Customer</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-100 p-1 rounded-lg">
              {[
                { id: 'orders', label: '📋 Orders', count: orders.length },
                { id: 'browse', label: '🗺️ Map' },
                { id: 'measurements', label: '📏 Measurements', count: measurements.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-violet-100 text-violet-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-zinc-200">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-[10px] font-bold">
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>
          <div className="relative z-10">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Welcome back, {user.username || 'Customer'} 👋
            </h1>
            <p className="text-white/70 text-sm mt-1.5">Manage your orders, browse tailors, and track your garments.</p>
          </div>
          <div className="relative z-10 flex gap-6 mt-6">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
              <p className="text-2xl font-light">{orders.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/60 mt-0.5">Active Orders</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
              <p className="text-2xl font-light">{measurements.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/60 mt-0.5">Measurements</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
              <p className="text-2xl font-light">{shops.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/60 mt-0.5">Available Tailors</p>
            </div>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Your Orders</h2>
              <button
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg shadow-sm transition-all"
              >
                + New Order
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-zinc-200/60 rounded-2xl p-12 text-center">
                <span className="text-4xl block mb-3">🧵</span>
                <h3 className="text-sm font-semibold text-zinc-900 mb-1">No orders yet</h3>
                <p className="text-zinc-400 text-xs max-w-sm mx-auto">Browse the map to find a tailor and place your first custom order.</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-4 px-5 py-2 text-xs font-medium text-violet-600 border border-violet-200 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  Find Tailors
                </button>
              </div>
            ) : (
              <div className="grid gap-5">
                {orders.map(order => {
                  const shop = shops.find(s => s.id === order.tailor_id)
                  const progress = getStageProgress(order.status)
                  return (
                    <div key={order.id} className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-zinc-100">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${order.status === 'Ready' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
                            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">{order.id.slice(0, 8)}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-zinc-900">{order.garment_type}</h4>
                          <p className="text-[11px] text-zinc-500 mt-0.5">by {shop?.shop_name || 'Tailor'}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <span className="text-lg font-semibold text-zinc-900">₹{parseFloat(order.total_price).toFixed(2)}</span>
                          <p className="text-[10px] text-zinc-400 mt-0.5">📅 {order.expected_delivery || 'TBD'}</p>
                        </div>
                      </div>

                      {/* Progress tracker */}
                      <div className="pt-5">
                        <div className="flex items-center justify-between relative">
                          <div className="absolute top-4 left-8 right-8 h-0.5 bg-zinc-100"></div>
                          <div className="absolute top-4 left-8 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700" style={{
                            width: `${(progress / (stages.length - 1)) * 100}%`,
                            maxWidth: 'calc(100% - 64px)'
                          }}></div>
                          {stages.map((stage, i) => (
                            <div key={stage} className="flex flex-col items-center relative z-10 flex-1">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                i <= progress
                                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-500 text-white shadow-lg shadow-violet-500/25'
                                  : 'bg-white border-zinc-200 text-zinc-400'
                              }`}>
                                {i < progress ? '✓' : i + 1}
                              </div>
                              <span className={`mt-2 text-[9px] font-medium text-center leading-tight ${i <= progress ? 'text-violet-600' : 'text-zinc-400'}`}>
                                {stage === 'pending_measurements' ? 'Pending' : stage}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rating Component */}
                      {(order.status === 'Ready' || order.status === 'Delivered') && !order.customer_rating && (
                        <div className="mt-6 p-4 bg-zinc-50 border border-zinc-200/60 rounded-xl animate-fade-in">
                          <p className="text-xs font-semibold text-zinc-900 mb-2">Rate Your Master Tailor</p>
                          <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button 
                                key={star} 
                                onClick={() => setReviewData({ ...reviewData, rating: star })}
                                className={`text-xl transition-colors ${reviewData.rating >= star ? 'text-amber-400' : 'text-zinc-300 hover:text-amber-200'}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <textarea 
                            placeholder="Submit your review..." 
                            value={reviewData.text}
                            onChange={e => setReviewData({ ...reviewData, text: e.target.value })}
                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-violet-500 mb-3 resize-none h-16" 
                          />
                          <button 
                            onClick={() => handleSubmitRating(order.id)}
                            disabled={loading}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-1.5 px-4 rounded-lg transition-colors text-xs disabled:opacity-50"
                          >
                            Submit Feedback
                          </button>
                        </div>
                      )}
                      {order.customer_rating && (
                        <div className="mt-6 p-4 bg-violet-50 border border-violet-100 rounded-xl flex items-start gap-3">
                          <div className="text-amber-500 text-lg">★</div>
                          <div>
                            <p className="text-xs font-semibold text-violet-900 mb-0.5">You rated this {order.customer_rating} out of 5</p>
                            {order.customer_review && <p className="text-[11px] text-violet-700 italic">"{order.customer_review}"</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Map/Browse Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Find Tailors</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 relative w-full h-[450px] bg-white border border-zinc-200/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#8b5cf6_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf6_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-violet-200/30 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-48 h-32 bg-fuchsia-200/30 rounded-full filter blur-3xl"></div>

                {shops.map((shop) => {
                  const coords = getRelativeCoords(shop.latitude, shop.longitude)
                  return (
                    <button
                      key={shop.id}
                      onClick={() => { setSelectedShop(shop); setShowBookingModal(false) }}
                      style={coords}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-transform hover:scale-110"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs group-hover:shadow-xl transition-all">
                          📍
                        </div>
                        <div className="mt-1.5 bg-white px-2.5 py-1 rounded-lg text-[10px] font-medium border border-zinc-200/80 shadow-sm text-zinc-800 max-w-[130px] flex flex-col items-center">
                          <span className="truncate w-full text-center">{shop.shop_name}</span>
                          {shopRatings[shop.id] && (
                            <span className="text-amber-500 font-bold text-[9px]">{shopRatings[shop.id].average_rating}★</span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}

                {shops.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-zinc-400 text-xs">No shops registered yet.</p>
                  </div>
                )}

                {/* Shop info popup */}
                {selectedShop && !showBookingModal && (
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-5 border border-zinc-200 rounded-xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 max-w-lg mx-auto animate-slide-up">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-zinc-900">{selectedShop.shop_name}</h4>
                        {shopRatings[selectedShop.id] && (
                          <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            {shopRatings[selectedShop.id].average_rating}★
                            <span className="font-normal opacity-70">({shopRatings[selectedShop.id].total_reviews})</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{selectedShop.bio}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">📍 {selectedShop.address}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      <button onClick={() => setSelectedShop(null)} className="px-3.5 py-2 text-[10px] border border-zinc-200 hover:bg-zinc-50 rounded-lg font-medium text-zinc-600 transition-colors">
                        Close
                      </button>
                      <button onClick={() => setShowBookingModal(true)} className="px-3.5 py-2 text-[10px] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-violet-600/25">
                        Place Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Booking modal */}
                {showBookingModal && selectedShop && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-6 overflow-y-auto flex flex-col justify-center max-w-md mx-auto my-4 border border-zinc-200 rounded-2xl shadow-2xl space-y-4 animate-fade-in">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">New Order — {selectedShop.shop_name}</h4>
                      <p className="text-[11px] text-zinc-500">Provide garment details and measurements</p>
                    </div>
                    <form onSubmit={handleBookOrder} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Garment Type</label>
                          <select value={bookingGarment} onChange={e => setBookingGarment(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-violet-500 bg-white">
                            <option value="Suit">Suit</option>
                            <option value="Shirt">Shirt</option>
                            <option value="Trousers">Trousers</option>
                            <option value="Dress">Dress</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Price (₹)</label>
                          <input type="number" required value={bookingPrice} onChange={e => setBookingPrice(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-violet-500" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Delivery Date</label>
                        <input type="date" required value={bookingDelivery} onChange={e => setBookingDelivery(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-violet-500 bg-white" />
                      </div>
                      <div className="pt-2 border-t border-zinc-100 space-y-2">
                        <h5 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Measurements (Inches)</h5>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[9px] text-zinc-500">Chest</label>
                            <input type="number" required value={bookingChest} onChange={e => setBookingChest(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:border-violet-500" />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-zinc-500">Waist</label>
                            <input type="number" required value={bookingWaist} onChange={e => setBookingWaist(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:border-violet-500" />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-zinc-500">Sleeve</label>
                            <input type="number" required value={bookingSleeve} onChange={e => setBookingSleeve(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:border-violet-500" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-3">
                        <button type="button" onClick={() => setShowBookingModal(false)} className="px-4 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg font-medium disabled:opacity-50">
                          {loading ? 'Placing...' : 'Confirm Order'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Shop list sidebar */}
              <div className="space-y-4">
                <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Available Tailors</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{shops.length} registered shops</p>
                </div>
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  {shops.map(shop => (
                    <div
                      key={shop.id}
                      onClick={() => { setSelectedShop(shop); setShowBookingModal(false) }}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedShop?.id === shop.id
                          ? 'border-violet-300 bg-violet-50/50 shadow-sm'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                            {shop.shop_name}
                            {shopRatings[shop.id] && (
                              <span className="text-amber-500 text-[10px]">{shopRatings[shop.id].average_rating}★</span>
                            )}
                          </h4>
                        </div>
                        <span className="text-[9px] text-zinc-400 font-mono">{shop.latitude?.toFixed(3)}, {shop.longitude?.toFixed(3)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{shop.bio}</p>
                      <p className="text-[10px] text-zinc-400 mt-2">📍 {shop.address}</p>
                    </div>
                  ))}
                  {shops.length === 0 && (
                    <p className="text-zinc-400 text-xs text-center py-6">No shops yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Measurements Tab */}
        {activeTab === 'measurements' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-violet-50 border-l-4 border-violet-600 p-4 rounded-r-lg mb-6">
              <p className="text-sm text-violet-900 font-medium flex items-start gap-2">
                <span className="text-violet-600 text-lg leading-none mt-0.5">🔒</span>
                Your measurement profile is locked and verified in real-time by your master tailor. Updates can only be committed by the shop during a physical or virtual fitting.
              </p>
            </div>
            
            <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Measurement Vault</h2>
            {measurements.length === 0 ? (
              <div className="bg-white border border-zinc-200/60 rounded-2xl p-12 text-center">
                <span className="text-4xl block mb-3">📏</span>
                <h3 className="text-sm font-semibold text-zinc-900 mb-1">No measurements stored</h3>
                <p className="text-zinc-400 text-xs">Your measurements will appear here after placing your first order.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {measurements.map(m => {
                  const shop = shops.find(s => s.id === m.tailor_id)
                  return (
                    <div key={m.id} className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-900">{m.garment_type}</h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5">by {shop?.shop_name || 'Tailor'}</p>
                        </div>
                        <span className="text-[9px] bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">Stored</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {m.metrics && Object.entries(m.metrics).map(([key, val]) => (
                          <div key={key} className="bg-zinc-50 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-zinc-400 uppercase tracking-wider">{key}</p>
                            <p className="text-sm font-semibold text-zinc-900 mt-0.5">{val}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
