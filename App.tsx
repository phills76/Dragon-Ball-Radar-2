
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RadarState, RadarRange, DragonBall, UserLocation } from './types';
import { generateValidCoordinates, relocateBall } from './services/geminiService';
import RadarUI from './components/RadarUI';
import { 
  Zap, 
  RefreshCcw, 
  Sun, 
  Moon, 
  AlertCircle, 
  Clock, 
  Menu as MenuIcon, 
  X, 
  Info, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

const RELOCATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 heures

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
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('light');
  const [selectedBall, setSelectedBall] = useState<DragonBall | null>(null);
  const [isRelocating, setIsRelocating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const [lastRelocationTime, setLastRelocationTime] = useState<number>(() => {
    const saved = localStorage.getItem('last_relocation_timestamp');
    return saved ? parseInt(saved, 10) : 0;
  });

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
          setState(prev => ({ ...prev, error: "Localisation GPS requise." }));
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
      setSelectedBall(null);
    } catch (err) {
      setState(prev => ({ ...prev, error: "Erreur lors du scan.", isLoading: false }));
    }
  }, [state.userLocation, state.range]);

  const canRelocate = useMemo(() => {
    return Date.now() - lastRelocationTime > RELOCATION_COOLDOWN;
  }, [lastRelocationTime]);

  const getTimeRemaining = () => {
    const remaining = RELOCATION_COOLDOWN - (Date.now() - lastRelocationTime);
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const handleRelocate = async () => {
    if (!selectedBall || !state.userLocation || isRelocating || !canRelocate) return;
    
    setIsRelocating(true);
    try {
      const newCoords = await relocateBall(state.userLocation, state.range, selectedBall.stars);
      setState(prev => ({
        ...prev,
        dragonBalls: prev.dragonBalls.map(b => 
          b.id === selectedBall.id ? { ...b, ...newCoords } : b
        )
      }));
      
      const now = Date.now();
      setLastRelocationTime(now);
      localStorage.setItem('last_relocation_timestamp', now.toString());
      
      setSelectedBall(prev => prev ? { ...prev, ...newCoords } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRelocating(false);
    }
  };

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

  const InstructionItem: React.FC<{ number: number; text: string }> = ({ number, text }) => (
    <div className="flex gap-4 items-start mb-6 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold group-hover:bg-emerald-500 group-hover:text-black transition-all">
        {number}
      </div>
      <p className="text-sm text-emerald-100/90 leading-relaxed font-sans">{text}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      {/* Menu Burger & Sidebar */}
      <button 
        onClick={() => setIsMenuOpen(true)}
        className="fixed top-6 left-6 z-[1100] p-3 bg-black/60 border border-emerald-500/30 rounded-xl text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95"
      >
        <MenuIcon size={24} />
      </button>

      {/* Sidebar Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[2000] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-72 h-full bg-black/95 border-r border-emerald-500/20 shadow-2xl animate-in slide-in-from-left duration-300 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <span className="text-emerald-400 font-bold tracking-widest text-lg uppercase">Menu Système</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-emerald-400/60 hover:text-emerald-400">
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1">
              <button 
                onClick={() => { setShowInstructions(true); setIsMenuOpen(false); }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={20} />
                  <span className="font-bold text-sm uppercase">Comment jouer</span>
                </div>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </nav>

            <div className="pt-6 border-t border-emerald-500/10 text-[10px] text-emerald-400/40 font-mono text-center">
              CAPSULE CORP - OS v3.7
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowInstructions(false)}></div>
          <div className="relative w-full max-w-lg bg-[#001a0d]/95 border-2 border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8 border-b border-emerald-500/20 pb-4">
              <h2 className="text-2xl font-bold text-emerald-400 uppercase tracking-tighter flex items-center gap-3">
                <Info size={28} /> Manuel d'Utilisation
              </h2>
              <button onClick={() => setShowInstructions(false)} className="bg-emerald-500/10 p-2 rounded-full text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <InstructionItem number={1} text="Autorisez la géolocalisation pour pouvoir voir les Dragon Balls sur votre position réelle." />
              <InstructionItem number={2} text="Choisissez votre rayon de recherche (de 1km à l'échelle planétaire) via les boutons en bas." />
              <InstructionItem number={3} text="Déplacez-vous physiquement vers chaque Dragon Ball indiquée sur le radar ou la carte." />
              <InstructionItem number={4} text="Une boule est inaccessible ? Cliquez sur son icône pour voir l'option de recalibrage (disponible une fois par jour)." />
              <InstructionItem number={5} text="Collectez les 7 boules magiques pour pouvoir invoquer Shenron et réaliser votre vœu !" />
            </div>

            <button 
              onClick={() => setShowInstructions(false)}
              className="mt-8 w-full py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              Compris !
            </button>
          </div>
        </div>
      )}

      <header className="w-full max-w-2xl flex justify-between items-center mb-6 bg-black/50 p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl ml-14">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] uppercase">
            DRAGON BALL RADAR <span className="text-xs text-emerald-400/70">v3.7</span>
          </h1>
          <p className="text-[10px] text-emerald-400/60 font-mono">Capsule Corp. Industries</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase text-emerald-400/50">Mode Actuel</p>
          <p className="text-xs font-bold text-emerald-400 uppercase">
            {isMapView ? `VUE CARTE (${mapTheme})` : `ZOOM x${radarStep + 1}`}
          </p>
        </div>
      </header>

      {/* Collection des Boules de Cristal */}
      <div className="w-full max-w-md mb-8 px-4 flex flex-col items-center">
        <div className="flex justify-between w-full text-[10px] mb-3 font-mono text-white/80">
          <span className="bg-black/40 px-2 py-0.5 rounded uppercase tracking-tighter">
            {foundCount < 7 ? "BOULES RÉCUPÉRÉES" : "PRÊT POUR LE VŒU"}
          </span>
          <span className="text-emerald-400 font-bold">{foundCount}/7 ★</span>
        </div>
        
        <div className="flex justify-between w-full gap-2 py-2 px-3 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
          {[1, 2, 3, 4, 5, 6, 7].map((stars) => {
            const isFound = state.dragonBalls.find(b => b.stars === stars)?.found;
            return (
              <div 
                key={stars}
                className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-700
                  ${isFound 
                    ? 'bg-orange-500 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] scale-110' 
                    : 'bg-zinc-800/40 border-zinc-700/50 opacity-30 grayscale'
                  }
                `}
              >
                <span className={`text-[10px] font-black ${isFound ? 'text-white drop-shadow-md' : 'text-zinc-600'}`}>
                  {stars}★
                </span>
                {isFound && (
                   <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                )}
              </div>
            );
          })}
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
                        key={`${ball.id}-${ball.lat}`} 
                        position={[ball.lat, ball.lng]} 
                        icon={createDragonBallIcon(ball.stars, ball.found)}
                      />
                    ))}
                  </MapContainer>
                )}
                
                <button
                  onClick={toggleTheme}
                  className="absolute bottom-16 right-1/2 translate-x-[70px] z-[1001] p-3 rounded-full bg-black/70 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-90 backdrop-blur-sm"
                >
                  {mapTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                   <div className="bg-black/70 px-4 py-1.5 rounded-full border border-emerald-500/30 text-[10px] text-emerald-400 font-mono backdrop-blur-sm shadow-xl">
                      SCAN : {state.range} KM
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute -bottom-10 left-0 right-0 text-center opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.2em] bg-black/30 px-3 py-1 rounded-full border border-white/5">
              {isMapView ? "TAP POUR RETOUR AU RADAR" : "TAP POUR ZOOMER"}
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
            {state.isLoading ? "CHARGEMENT..." : "SCANNER LA ZONE"}
          </button>
        </div>

        {selectedBall && (
          <div className="mt-8 p-6 bg-black/60 border border-white/10 rounded-2xl w-full max-w-md backdrop-blur-lg animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-emerald-400 font-bold flex items-center gap-2 text-lg">
                  BOULE N°{selectedBall.stars} <span className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">★</span>
                </h3>
                <p className="text-[11px] text-emerald-400/60 uppercase font-mono mt-1 leading-tight tracking-tight">{selectedBall.name}</p>
                
                {!selectedBall.found && (
                  <div className="mt-4">
                    <button 
                      onClick={handleRelocate}
                      disabled={isRelocating || !canRelocate}
                      className={`flex items-center gap-2 text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all border ${
                        canRelocate 
                        ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30' 
                        : 'bg-zinc-800/50 text-zinc-500 border-zinc-700 cursor-not-allowed opacity-70'
                      }`}
                    >
                      {isRelocating ? <RefreshCcw size={10} className="animate-spin" /> : canRelocate ? <AlertCircle size={10} /> : <Clock size={10} />}
                      {isRelocating ? "RECALIBRAGE..." : canRelocate ? "INACCESSIBLE ? RECALIBRER" : `RECHARGE : ${getTimeRemaining()}`}
                    </button>
                    {!canRelocate && !isRelocating && (
                      <p className="text-[8px] text-zinc-600 font-mono mt-2 uppercase tracking-tighter">
                        Limite : 1 recalibrage toutes les 24h.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right ml-4">
                <p className="text-[10px] text-emerald-400/40 font-mono uppercase tracking-tighter">Distance</p>
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
        <p className="mt-1">IMAGE SOURCE : PERSISTANTE</p>
      </footer>
    </div>
  );
};

export default App;
