import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [shops, setShops] = useState([])
  const [shopRatings, setShopRatings] = useState({})
  const [activeTab, setActiveTab] = useState('orders')
  const [selectedShop, setSelectedShop] = useState(null)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  // Rating state
  const [reviewData, setReviewData] = useState({ rating: 0, text: '' })

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
              <div className="lg:col-span-2 relative w-full h-[450px] bg-white border border-zinc-200/60 rounded-2xl overflow-hidden shadow-sm z-0">
                <MapContainer 
                  center={selectedShop ? [selectedShop.latitude || 51.5113, selectedShop.longitude || -0.1402] : (shops.length > 0 ? [shops[0].latitude || 51.5113, shops[0].longitude || -0.1402] : [51.5113, -0.1402])} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  <MapUpdater center={selectedShop ? [selectedShop.latitude || 51.5113, selectedShop.longitude || -0.1402] : null} />
                  
                  {shops.map(shop => (
                    <Marker 
                      key={shop.id} 
                      position={[shop.latitude || 51.5113, shop.longitude || -0.1402]}
                      eventHandlers={{
                        click: () => setSelectedShop(shop),
                      }}
                    >
                      <Popup>
                        <div className="font-sans">
                          <h4 className="font-semibold text-zinc-900 m-0">{shop.shop_name}</h4>
                          {shopRatings[shop.id] && (
                            <span className="text-amber-500 font-bold text-[10px] m-0">{shopRatings[shop.id].average_rating}★</span>
                          )}
                          <p className="text-[10px] text-zinc-500 mt-1 mb-0">{shop.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
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
                      onClick={() => setSelectedShop(shop)}
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
