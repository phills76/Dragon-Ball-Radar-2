
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RadarState, RadarRange, DragonBall, UserLocation } from './types';
import { generateValidCoordinates } from './services/geminiService';
import RadarUI from './components/RadarUI';
import { Locate, ShieldCheck, Zap, Info, Map as MapIcon, RefreshCcw, Sun, Moon } from 'lucide-react';

const createDragonBallIcon = (stars: number, found: boolean) => L.divIcon({
  html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${found ? 'bg-gray-400 opacity-50' : 'bg-orange-500 ring-4 ring-yellow-400'} text-white font-bold border-2 border-white transform hover:scale-110 transition-transform">${stars}★</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const MapAutoView: React.FC<{ center: [number, number], range: number }> = ({ center, range }) => {
  const map = useMap();
  const zoomLevel = useMemo(() => {
    if (range <= 1) return 15;
    if (range <= 10) return 12;
    if (range <= 100) return 9;
    if (range <= 1000) return 6;
    return 3;
  }, [range]);

  useEffect(() => {
    map.setView(center, zoomLevel, { animate: true });
  }, [center, zoomLevel, map]);
  return null;
};

const MapClickHandler: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  useMapEvents({ click: () => onClick() });
  return null;
};

const App: React.FC = () => {
  const [state, setState] = useState<RadarState>({
    range: 10,
    userLocation: null,
    dragonBalls: [],
    isLoading: false,
    error: null,
  });

  const [radarStep, setRadarStep] = useState<number>(0);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
  const [selectedBall, setSelectedBall] = useState<DragonBall | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setState(prev => ({
            ...prev,
            userLocation: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            }
          }));
        },
        (err) => {
          setState(prev => ({ ...prev, error: "Localisation requise." }));
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const searchBalls = useCallback(async () => {
    if (!state.userLocation) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const balls = await generateValidCoordinates(state.userLocation, state.range);
      setState(prev => ({ ...prev, dragonBalls: balls, isLoading: false }));
      setRadarStep(0); 
    } catch (err) {
      setState(prev => ({ ...prev, error: "Erreur lors du scan.", isLoading: false }));
    }
  }, [state.userLocation, state.range]);

  const handleNextStep = useCallback(() => {
    setRadarStep((prev) => (prev + 1) % 5);
  }, []);

  const getDisplayRange = (): number => {
    const base = state.range;
    if (radarStep === 0) return base;
    if (radarStep === 1) return base * 0.5;
    if (radarStep === 2) return base * 0.2;
    if (radarStep === 3) return base * 0.05;
    return base;
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!state.userLocation || state.dragonBalls.length === 0) return;
    const updatedBalls = state.dragonBalls.map(ball => {
      if (ball.found) return ball;
      const dist = getDistance(state.userLocation!.lat, state.userLocation!.lng, ball.lat, ball.lng);
      return dist < 0.05 ? { ...ball, found: true } : ball;
    });
    if (JSON.stringify(updatedBalls) !== JSON.stringify(state.dragonBalls)) {
      setState(prev => ({ ...prev, dragonBalls: updatedBalls }));
    }
  }, [state.userLocation, state.dragonBalls]);

  const foundCount = state.dragonBalls.filter(b => b.found).length;
  const isMapView = radarStep === 4;

  const toggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setMapTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <header className="w-full max-w-2xl flex justify-between items-center mb-6 bg-black/40 p-4 rounded-2xl backdrop-blur-md border border-white/5 shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] uppercase">
            DRAGON BALL RADAR <span className="text-xs text-emerald-400/70">v3.3</span>
          </h1>
          <p className="text-[10px] text-emerald-400/60 font-mono">Capsule Corp. Industries</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase text-emerald-400/50">Système</p>
          <p className="text-xs font-bold text-emerald-400 uppercase">
            {isMapView ? `MAP ${mapTheme}` : `RADAR ZOOM x${radarStep + 1}`}
          </p>
        </div>
      </header>

      <div className="w-full max-w-md mb-8 px-4">
        <div className="flex justify-between text-[10px] mb-1 font-mono text-white/80">
          <span className="bg-black/40 px-2 py-0.5 rounded uppercase tracking-tighter">
            {foundCount < 7 ? "BOULES TROUVÉES" : "Vœu Prêt"}
          </span>
          <span className="text-emerald-400 font-bold">{foundCount}/7 ★</span>
        </div>
        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 shadow-inner">
          <div className="h-full bg-emerald-400 shadow-[0_0_15px_#10b981] transition-all duration-700" style={{ width: `${(foundCount/7)*100}%` }} />
        </div>
      </div>

      <main className="w-full flex-1 flex flex-col items-center max-w-4xl">
        {state.error && (
          <div className="bg-red-950/40 backdrop-blur-md border border-red-900 text-red-400 p-3 rounded-xl mb-4 text-xs">
             {state.error}
          </div>
        )}

        <div 
          onClick={!isMapView ? handleNextStep : undefined}
          className={`relative w-full aspect-square max-md:aspect-square max-w-md ${!isMapView ? 'cursor-pointer' : ''} group select-none`}
        >
          <div className="absolute inset-0 rounded-full border-[14px] border-zinc-800 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8),inset_0_0_30px_rgba(0,0,0,0.6)] z-30 pointer-events-none ring-1 ring-white/10"></div>
          
          <div className="absolute inset-0 rounded-full overflow-hidden bg-black z-10 shadow-inner border border-white/5">
            {!isMapView ? (
              <RadarUI 
                range={getDisplayRange()} 
                userLoc={state.userLocation} 
                balls={state.dragonBalls}
                onBallClick={(ball) => setSelectedBall(ball)}
              />
            ) : (
              <div 
                className={`w-full h-full scale-105 ${mapTheme === 'dark' ? 'radar-theme' : 'light-theme'}`} 
                onClick={(e) => e.stopPropagation()} 
              >
                {state.userLocation && (
                  <MapContainer 
                    center={[state.userLocation.lat, state.userLocation.lng]} 
                    zoom={12} 
                    zoomControl={false}
                    className="h-full w-full"
                    style={{ background: mapTheme === 'dark' ? '#001a0d' : '#f0f0f0' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapAutoView center={[state.userLocation.lat, state.userLocation.lng]} range={state.range} />
                    <MapClickHandler onClick={handleNextStep} />
                    
                    <Circle
                      center={[state.userLocation.lat, state.userLocation.lng]}
                      radius={state.range * 1000} 
                      pathOptions={{
                        color: '#10b981',
                        fillColor: '#10b981',
                        fillOpacity: 0.1,
                        weight: 2,
                        dashArray: '10, 10'
                      }}
                    />

                    <Marker position={[state.userLocation.lat, state.userLocation.lng]} icon={L.divIcon({
                      html: `<div class="w-5 h-5 bg-white ring-4 ring-emerald-500/50 rounded-full shadow-[0_0_20px_white]"></div>`,
                      className: '', iconSize: [20, 20], iconAnchor: [10, 10]
                    })} />

                    {state.dragonBalls.map(ball => (
                      <Marker 
                        key={ball.id} 
                        position={[ball.lat, ball.lng]} 
                        icon={createDragonBallIcon(ball.stars, ball.found)}
                      />
                    ))}
                  </MapContainer>
                )}
                
                <button
                  onClick={toggleTheme}
                  className="absolute bottom-16 right-1/2 translate-x-[70px] z-[1001] p-3 rounded-full bg-black/70 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-90 backdrop-blur-sm"
                  title="Thème"
                >
                  {mapTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                   <div className="bg-black/70 px-4 py-1.5 rounded-full border border-emerald-500/30 text-[10px] text-emerald-400 font-mono backdrop-blur-sm shadow-xl">
                      PÉRIMÈTRE SCAN : {state.range} KM
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute -bottom-10 left-0 right-0 text-center opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.2em] bg-black/30 px-3 py-1 rounded-full border border-white/5">
              {isMapView ? "TAP POUR QUITTER" : "TAP POUR ZOOMER"}
            </span>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 w-full max-w-md">
          <div className="flex justify-center gap-2 w-full overflow-x-auto px-4 scrollbar-hide">
            {[1, 10, 100, 1000, 40000].map((r) => (
              <button
                key={r}
                onClick={(e) => { e.stopPropagation(); setState(p => ({...p, range: r as RadarRange})); }}
                className={`px-4 py-2.5 text-[10px] font-bold rounded-xl border transition-all whitespace-nowrap backdrop-blur-sm text-white ${state.range === r ? 'bg-[#ff7700] border-[#ff9d4d] shadow-[0_0_20px_rgba(255,119,0,0.4)]' : 'bg-black/40 border-white/10 hover:border-emerald-500/50'}`}
              >
                {r >= 40000 ? 'PLANÈTE' : `${r}KM`}
              </button>
            ))}
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); searchBalls(); }}
            disabled={state.isLoading || !state.userLocation}
            className="group w-full py-5 bg-[#ff7700] text-white font-black rounded-2xl border-b-4 border-[#cc5e00] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50 shadow-2xl"
          >
            {state.isLoading ? <RefreshCcw className="animate-spin" /> : <Zap className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />}
            {state.isLoading ? "CHARGEMENT..." : "LANCER LE SCAN"}
          </button>
        </div>

        {selectedBall && (
          <div className="mt-8 p-6 bg-black/60 border border-white/10 rounded-2xl w-full max-w-md backdrop-blur-lg animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-emerald-400 font-bold flex items-center gap-2 text-lg">
                  BOULE N°{selectedBall.stars} <span className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">★</span>
                </h3>
                <p className="text-[11px] text-emerald-400/60 uppercase font-mono mt-1 leading-tight tracking-tight">{selectedBall.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-emerald-400/40 font-mono uppercase tracking-tighter">Distance Relative</p>
                <p className="text-3xl font-black text-white leading-none drop-shadow-md">
                  {state.userLocation ? Math.round(getDistance(state.userLocation.lat, state.userLocation.lng, selectedBall.lat, selectedBall.lng) * 100) / 100 : '--'} 
                  <span className="text-sm ml-1 text-emerald-500">KM</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-14 py-8 opacity-40 text-[9px] font-mono text-center uppercase tracking-widest leading-relaxed text-emerald-400">
        <p className="font-bold">© 750 AGE CAPSULE CORP - DESIGN BY BULMA</p>
        <p className="mt-1">PROTOCOLE DE RECHERCHE TERRESTRE ACTIVÉ</p>
      </footer>
    </div>
  );
};

export default App;
