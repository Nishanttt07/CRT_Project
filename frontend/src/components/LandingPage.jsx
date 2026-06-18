import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

export default function LandingPage() {
  const [shops, setShops] = useState([])
  const [shopRatings, setShopRatings] = useState({})
  const [selectedShop, setSelectedShop] = useState(null)

  useEffect(() => {
    const fetchShops = async () => {
      const { data } = await supabase.from('shops').select('*').eq('status', 'verified').order('is_promoted', { ascending: false })
      if (data) setShops(data)
      
      const { data: ratingsData } = await supabase.from('shop_ratings').select('*')
      if (ratingsData) {
        const ratingsMap = {}
        ratingsData.forEach(r => { ratingsMap[r.shop_id] = r })
        setShopRatings(ratingsMap)
      }
    }
    fetchShops()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col antialiased">
      {/* Navigation */}
      <header className="border-b border-zinc-800/50 py-4 px-6 md:px-12 flex justify-between items-center bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">TailorFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#map-section" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
            Find Shops
          </a>
          <Link to="/login" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
            Log In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 px-6 md:px-12">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl animate-float-delayed"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-br from-violet-900/5 to-fuchsia-900/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/50 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Now Live — Join Today</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white leading-[1.1]">
              Tailoring Management,<br />
              <span className="font-normal bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Reimagined for Quality.
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Connect directly with master tailors, store secure measurement vaults, and track raw fabrics moving into custom outfits.
            </p>
            <div className="flex justify-center items-center gap-4 pt-2">
              <Link
                to="/signup"
                className="px-6 py-3 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40"
              >
                Join as Customer
              </Link>
              <Link
                to="/signup"
                className="px-6 py-3 text-xs font-semibold text-zinc-300 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/50 rounded-xl transition-all"
              >
                Register Shop
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl w-full mx-auto px-6 md:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🗺️',
                title: 'Geographic Locators',
                desc: 'Tailors share live coordinate positions directly to an integrated mapping platform, matching local ateliers with nearby customers.',
                gradient: 'from-violet-500/10 to-violet-500/5'
              },
              {
                icon: '📏',
                title: 'Measurement Vaults',
                desc: 'Store custom dimensional criteria securely in an adaptive database format, instantly available for any orders.',
                gradient: 'from-fuchsia-500/10 to-fuchsia-500/5'
              },
              {
                icon: '🧵',
                title: 'Active Workflows',
                desc: 'Follow production milestones in real time. Know exactly when your fabric is cut, stitching starts, and when it is ready.',
                gradient: 'from-pink-500/10 to-pink-500/5'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${feature.gradient} border border-zinc-800/50 rounded-2xl p-6 space-y-3 hover:border-zinc-700/50 transition-all group`}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Map Directory */}
        <section id="map-section" className="max-w-6xl w-full mx-auto px-6 md:px-12 py-16 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Interactive Directory</h2>
            <p className="text-zinc-500 text-sm mt-1">Explore local tailor shop locations using real coordinates from our database.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 relative w-full h-[420px] bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm flex items-center justify-center z-0">
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
                        <h4 className="font-semibold text-zinc-900 m-0">
                          {shop.shop_name}
                          {shop.is_promoted && <span className="ml-1 text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded border border-amber-200">Ad</span>}
                        </h4>
                        {shopRatings[shop.id] && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-amber-500 font-bold text-[10px] m-0">{shopRatings[shop.id].average_rating}★</span>
                            <span className="text-zinc-400 text-[9px]">({shopRatings[shop.id].total_reviews})</span>
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-500 mt-1 mb-0">{shop.address}</p>
                        <div className="mt-2 pt-2 border-t border-zinc-200">
                          <Link to="/login" className="text-[10px] font-medium text-violet-600 hover:text-violet-700">Login to order →</Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Shop list */}
            <div className="space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ateliers</h3>
                <p className="text-[10px] text-zinc-600 mt-0.5">{shops.length} registered tailoring profiles.</p>
              </div>
              <div className="space-y-3 max-h-[330px] overflow-y-auto pr-1 custom-scrollbar">
                {shops.map(shop => (
                  <div
                    key={shop.id}
                    onClick={() => setSelectedShop(shop)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedShop?.id === shop.id
                        ? 'border-violet-500/50 bg-violet-500/5'
                        : 'border-zinc-800/50 bg-zinc-900/30 hover:border-zinc-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 flex-wrap">
                          {shop.shop_name}
                          {shop.is_promoted && <span className="bg-amber-500/20 text-amber-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Ad</span>}
                          {shopRatings[shop.id] && (
                            <span className="text-amber-500 text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded-full">{shopRatings[shop.id].average_rating} ★</span>
                          )}
                        </h4>
                      </div>
                      <span className="text-[9px] text-zinc-600 font-mono">
                        {shop.latitude?.toFixed(3)}, {shop.longitude?.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{shop.bio}</p>
                    <p className="text-[10px] text-zinc-600 mt-2">📍 {shop.address}</p>
                  </div>
                ))}
                {shops.length === 0 && (
                  <p className="text-zinc-600 text-xs text-center py-6">No shops configured.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 py-8 px-6 md:px-12 mt-auto">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-white font-bold text-[8px]">T</span>
              </div>
              <span className="text-xs font-medium text-zinc-600">TailorFlow © 2026</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Login</Link>
              <Link to="/signup" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Sign Up</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
