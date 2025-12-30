
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RadarState, RadarRange, DragonBall, UserLocation, RadarDesign } from './types';
import { generateValidCoordinates } from './services/geminiService';
import RadarUI from './components/RadarUI';
import { 
  Zap, RefreshCcw, Sun, Moon, Menu as MenuIcon, X, BookOpen, Star, Camera, Shield, 
  Wand2, MapPin, Lock, Target, Map, Sparkles, User, Sliders, ArrowLeft, Globe, CheckCircle2
} from 'lucide-react';

const createDragonBallIcon = (stars: number, found: boolean) => L.divIcon({
  html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${found ? 'bg-gray-400 opacity-50' : 'bg-orange-500 ring-4 ring-yellow-400'} text-white font-bold border-2 border-white transform hover:scale-110 transition-transform">${stars}★</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const RACES = [
  { name: 'Humain', icon: '👨‍💼', desc: 'Citoyen de la Terre' },
  { name: 'Sayan', icon: '🔥', desc: 'Guerrier de l\'espace' },
  { name: 'Namek', icon: '🌵', desc: 'Sagesse ancestrale' },
  { name: 'Cyborg', icon: '🤖', desc: 'Puissance infinie' },
  { name: 'Démon', icon: '😈', desc: 'Royaume des ténèbres' },
  { name: 'Dieu', icon: '✨', desc: 'Entité divine' }
];

const MapAutoView: React.FC<{ center: [number, number], range: number }> = ({ center, range }) => {
  const map = useMap();
  const zoomLevel = useMemo(() => {
    if (range >= 10000) return 2;
    if (range <= 1) return 15;
    if (range <= 10) return 12;
    if (range <= 100) return 9;
    if (range <= 1000) return 6;
    return 3;
  }, [range]);
  useEffect(() => { map.setView(center, zoomLevel, { animate: true }); }, [center, zoomLevel, map]);
  return null;
};

const MapPicker: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const App: React.FC = () => {
  const [state, setState] = useState<RadarState>(() => {
    const saved = localStorage.getItem('radar_save_v11');
    const defaultState: RadarState = {
      range: 10,
      userLocation: null,
      scanCenter: null,
      dragonBalls: [],
      isLoading: false,
      error: null,
      design: 'bulma',
      collectionRadius: 0.05, 
      unlockedFeatures: [],
      currentRace: 'Humain'
    };
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  });

  const [radarStep, setRadarStep] = useState<number>(0);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('light');
  const [selectedBall, setSelectedBall] = useState<DragonBall | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWishes, setShowWishes] = useState(false);
  const [showShenron, setShowShenron] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isScouterMode, setIsScouterMode] = useState(false);
  const [isPickingZone, setIsPickingZone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    localStorage.setItem('radar_save_v11', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setState(prev => ({
            ...prev,
            userLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
          }));
        },
        (err) => setState(prev => ({ ...prev, error: "GPS requis." })),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const effectiveCenter = state.scanCenter || state.userLocation;

  const searchBalls = async () => {
    if (!effectiveCenter) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const balls = await generateValidCoordinates(effectiveCenter, state.range);
      setState(prev => ({ ...prev, dragonBalls: balls, isLoading: false }));
      setRadarStep(0);
      setSelectedBall(null);
    } catch (err) {
      setState(prev => ({ ...prev, error: "Erreur de scan.", isLoading: false }));
    }
  };

  const foundCount = state.dragonBalls.filter(b => b.found).length;
  const isMapView = radarStep === 4;

  const isWorldScanAvailable = useMemo(() => {
    return state.unlockedFeatures.includes('scouter') && 
           state.unlockedFeatures.includes('custom_zone') && 
           state.collectionRadius <= 0.001;
  }, [state.unlockedFeatures, state.collectionRadius]);

  useEffect(() => {
    if (!state.userLocation || state.dragonBalls.length === 0) return;
    const updatedBalls = state.dragonBalls.map(ball => {
      if (ball.found) return ball;
      const dist = calculateDistance(state.userLocation!.lat, state.userLocation!.lng, ball.lat, ball.lng);
      return dist < state.collectionRadius ? { ...ball, found: true } : ball;
    });
    if (JSON.stringify(updatedBalls) !== JSON.stringify(state.dragonBalls)) {
      setState(prev => ({ ...prev, dragonBalls: updatedBalls }));
    }
  }, [state.userLocation, state.dragonBalls, state.collectionRadius]);

  const handleShenronWish = (type: string, value: any, unlockKey?: string) => {
    if (foundCount < 7) {
      alert("Il vous faut les 7 Dragon Balls pour exaucer ce vœu !");
      return;
    }

    if (unlockKey === 'world_scan' && !isWorldScanAvailable) {
      alert("Ce vœu suprême nécessite d'avoir d'abord débloqué le Scouter, la Zone Perso et la Maîtrise de Collecte à 1m !");
      return;
    }
    
    setState(prev => {
      const newState = { ...prev };
      if (type === 'design') newState.design = value;
      if (type === 'radius') newState.collectionRadius = value;
      if (type === 'race') newState.currentRace = value;
      if (unlockKey && !newState.unlockedFeatures.includes(unlockKey)) {
        newState.unlockedFeatures = [...newState.unlockedFeatures, unlockKey];
      }
      
      newState.dragonBalls = [];
      setShowShenron(false);
      setShowWishes(false);
      return newState;
    });
  };

  const getNextRadius = () => {
    if (state.collectionRadius > 0.025) return 0.025;
    if (state.collectionRadius > 0.01) return 0.01;
    if (state.collectionRadius > 0.001) return 0.001;
    return 0.001;
  };

  const toggleScouter = async () => {
    if (!state.unlockedFeatures.includes('scouter')) return;
    if (!isScouterMode) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsScouterMode(true);
      } catch (err) { alert("Accès caméra refusé."); }
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      setIsScouterMode(false);
    }
  };

  const radarColor = { bulma: '#10b981', capsule: '#3b82f6', saiyan: '#fbbf24', namek: '#8b5cf6' }[state.design];

  const currentDistToSelected = useMemo(() => {
    if (!selectedBall || !state.userLocation) return null;
    const d = calculateDistance(state.userLocation.lat, state.userLocation.lng, selectedBall.lat, selectedBall.lng);
    return d > 1 ? `${d.toFixed(2)} km` : `${(d * 1000).toFixed(0)} m`;
  }, [selectedBall, state.userLocation]);

  const currentRadarRange = useMemo(() => {
    if (state.range >= 10000) return 20000;
    const multipliers = [1, 0.5, 0.2, 0.05];
    return state.range * (multipliers[radarStep] || 1);
  }, [state.range, radarStep]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 transition-colors duration-1000" style={{ color: radarColor }}>
      {showShenron && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95 animate-in fade-in duration-1000">
          <div className="absolute inset-0 bg-[url('https://www.transparentpng.com/download/dragon-ball/shenron-dragon-ball-z-png-9.png')] bg-contain bg-center bg-no-repeat opacity-40 scale-150 animate-pulse"></div>
          <div className="relative text-center p-8 bg-black/70 backdrop-blur-xl rounded-[3rem] border border-yellow-500/30 max-w-lg w-full shadow-[0_0_100px_rgba(251,191,36,0.2)]">
            <h2 className="text-4xl font-black text-yellow-400 uppercase tracking-widest mb-4">SHENRON</h2>
            <p className="text-white/80 font-mono text-sm mb-10 italic">"Tes vœux seront exaucés..."</p>
            <button onClick={() => { setShowWishes(true); setShowShenron(false); }} className="w-full py-6 bg-yellow-500 text-black font-black rounded-2xl hover:scale-105 transition-all uppercase tracking-widest text-lg">
                Ouvrir le Sanctuaire
            </button>
          </div>
        </div>
      )}

      {isScouterMode && (
        <div className="fixed inset-0 z-[4000] bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 border-[40px] border-emerald-500/10 pointer-events-none flex items-center justify-center">
             <div className="w-80 h-80 border-2 border-emerald-500/20 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-full h-[1px] bg-emerald-500/40"></div>
                <div className="h-full w-[1px] bg-emerald-500/40 absolute"></div>
             </div>
             <div className="absolute top-24 right-12 text-right font-mono text-emerald-400 text-sm space-y-3 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-emerald-500/20">
                <p className="flex items-center gap-2 justify-end">TRACKING: <span className="text-white animate-pulse">ACTIVE</span></p>
                <p>TARGET: {selectedBall ? `BOULE ${selectedBall.stars}` : 'RECHERCHE...'}</p>
                <p>DIST: <span className="text-white text-lg">{currentDistToSelected || '---'}</span></p>
                <p>RADAR: {state.design.toUpperCase()}</p>
             </div>
          </div>
          <button onClick={toggleScouter} className="absolute bottom-16 left-1/2 -translate-x-1/2 px-12 py-5 bg-red-600/90 text-white font-black rounded-full border-2 border-red-400 shadow-xl uppercase tracking-widest">Quitter AR</button>
        </div>
      )}

      <button onClick={() => setIsMenuOpen(true)} className="fixed top-6 left-6 z-[1100] p-3 bg-black/60 border rounded-2xl shadow-xl" style={{ borderColor: `${radarColor}4d`, color: radarColor }}>
        <MenuIcon size={24} />
      </button>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[2000] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-80 h-full bg-black/95 border-r p-8 flex flex-col" style={{ borderColor: `${radarColor}33` }}>
            <div className="flex justify-between items-center mb-12">
              <span className="font-black tracking-widest text-xl uppercase" style={{ color: radarColor }}>SYSTÈME</span>
              <button onClick={() => setIsMenuOpen(false)} style={{ color: `${radarColor}99` }}><X size={28} /></button>
            </div>
            <nav className="flex-1 space-y-5">
              <button onClick={() => { setShowWishes(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-all group" style={{ borderColor: `${radarColor}33` }}>
                <div className="p-3 bg-black/40 rounded-xl group-hover:scale-110 transition-transform"><Wand2 size={24} /></div>
                <span className="font-black text-sm uppercase">Sanctuaire des Vœux</span>
              </button>
              
              {state.unlockedFeatures.includes('scouter') && (
                <button onClick={() => { toggleScouter(); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-5 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group">
                    <div className="p-3 bg-black/40 rounded-xl group-hover:scale-110 transition-transform"><Camera size={24} /></div>
                    <span className="font-black text-sm uppercase">Mode Scouter</span>
                </button>
              )}

              {state.unlockedFeatures.includes('custom_zone') && (
                <button onClick={() => { setIsPickingZone(true); setIsMenuOpen(false); setRadarStep(4); }} className="w-full flex items-center gap-4 p-5 rounded-2xl border bg-blue-500/10 border-blue-500/30 text-blue-400 group">
                    <div className="p-3 bg-black/40 rounded-xl group-hover:scale-110 transition-transform"><MapPin size={24} /></div>
                    <span className="font-black text-sm uppercase">Zone Perso</span>
                </button>
              )}

              <button onClick={() => { setShowInstructions(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-all" style={{ borderColor: `${radarColor}33` }}>
                <div className="p-3 bg-black/40 rounded-xl"><BookOpen size={24} /></div>
                <span className="font-black text-sm uppercase">Guide de Survie</span>
              </button>
            </nav>
            <div className="pt-8 border-t text-[11px] font-mono text-center tracking-widest opacity-40" style={{ borderColor: `${radarColor}1a` }}>
              RACE: {state.currentRace.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {showWishes && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowWishes(false)}></div>
          <div className="relative w-full max-w-4xl bg-black/40 border-2 rounded-[3rem] p-8 sm:p-12 max-h-[92vh] overflow-y-auto scrollbar-hide shadow-[0_0_150px_rgba(0,0,0,1)]" style={{ borderColor: `${radarColor}33` }}>
             <header className="flex justify-between items-center mb-12 sticky top-0 bg-black/40 backdrop-blur-md z-10 py-4 -mx-4 px-4 rounded-3xl">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-black flex items-center gap-5 uppercase tracking-tighter" style={{ color: radarColor }}>
                        <Wand2 size={36} /> Sanctuaire
                    </h2>
                    <p className="text-[11px] font-mono opacity-50 mt-2 uppercase tracking-[0.4em]">Bibliothèque des vœux de Shenron</p>
                </div>
                <button onClick={() => setShowWishes(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5"><X size={24}/></button>
             </header>

             <div className="space-y-16">
                <section>
                    <h3 className="text-xs font-mono opacity-40 mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Map size={16} /> 1. Personnalisation du Radar
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { id: 'bulma', name: 'Original Bulma', color: '#10b981', desc: 'Le classique vert.' },
                            { id: 'capsule', name: 'Capsule Corp.', color: '#3b82f6', desc: 'Design épuré et High-Tech.' },
                            { id: 'saiyan', name: 'Radar Sayen', color: '#fbbf24', desc: 'Thème doré Super Dragon.' },
                            { id: 'namek', name: 'Radar Namek', color: '#8b5cf6', desc: 'Mystique bleu et violet.' }
                        ].map(d => (
                            <button key={d.id} onClick={() => handleShenronWish('design', d.id)} className={`p-6 border rounded-[2rem] transition-all flex flex-col items-center text-center group ${state.design === d.id ? 'bg-white/10 border-white scale-105 shadow-xl' : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'}`}>
                                <div className="w-14 h-14 rounded-full mb-5 shadow-2xl transition-transform group-hover:rotate-12" style={{ backgroundColor: d.color }}></div>
                                <span className="text-[11px] font-black uppercase mb-2">{d.name}</span>
                                <span className="text-[9px] opacity-40 leading-tight">{d.desc}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-mono opacity-40 mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                        <User size={16} /> 2. Évolution de Race (Actuelle: {state.currentRace})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {RACES.map(r => (
                            <button key={r.name} onClick={() => handleShenronWish('race', r.name)} className={`p-5 border rounded-2xl flex flex-col items-center transition-all ${state.currentRace === r.name ? 'bg-white text-black border-white shadow-lg scale-105' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'}`}>
                                <span className="text-3xl mb-3">{r.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-tighter">{r.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-mono opacity-40 mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Target size={16} /> 3. Maîtrise de Collecte
                    </h3>
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-orange-500/20 flex items-center justify-center animate-spin-slow">
                                <Target size={48} className="text-orange-500" />
                            </div>
                            <div className="absolute inset-0 animate-ping opacity-20 border-2 border-orange-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h4 className="font-black text-xl mb-2 uppercase">Rayon Actuel: {state.collectionRadius * 1000} Mètres</h4>
                            <div className="flex gap-2 mb-6 justify-center sm:justify-start">
                                {[50, 25, 10, 1].map(r => (
                                    <div key={r} className={`px-3 py-1 rounded-full text-[9px] font-black ${state.collectionRadius * 1000 === r ? 'bg-orange-500 text-white' : 'bg-white/10 opacity-40'}`}>{r}M</div>
                                ))}
                            </div>
                            {state.collectionRadius > 0.001 ? (
                                <button onClick={() => handleShenronWish('radius', getNextRadius())} className={`px-10 py-4 rounded-xl font-black text-xs uppercase transition-all ${foundCount === 7 ? 'bg-orange-500 text-white shadow-xl hover:scale-105' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}`}>
                                    {foundCount === 7 ? `Passer à ${getNextRadius()*1000}M` : "Shenron Requis"}
                                </button>
                            ) : <span className="text-orange-400 font-black uppercase text-sm tracking-widest flex items-center gap-2 justify-center sm:justify-start"><CheckCircle2 size={16}/> Maîtrise Ultime Débloquée</span>}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-mono opacity-40 mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Sparkles size={16} /> 4. Capacités Spéciales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className={`p-8 rounded-[2.5rem] border transition-all ${state.unlockedFeatures.includes('scouter') ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-5 bg-black/40 rounded-3xl"><Camera size={36} className={state.unlockedFeatures.includes('scouter') ? 'text-emerald-400' : 'text-white/20'}/></div>
                                {state.unlockedFeatures.includes('scouter') ? <span className="bg-emerald-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full">DÉBLOQUÉ</span> : <span className="bg-white/5 text-white/30 text-[10px] font-black px-4 py-1.5 rounded-full border border-white/5">DISPONIBLE</span>}
                            </div>
                            <h4 className="font-black text-lg mb-2 uppercase">Mode Scouter (AR)</h4>
                            <p className="text-[11px] opacity-50 mb-8 leading-relaxed">Vision en réalité augmentée pour localiser précisément les boules.</p>
                            {!state.unlockedFeatures.includes('scouter') && (
                                <button onClick={() => handleShenronWish('unlock', true, 'scouter')} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${foundCount === 7 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>Invoquer</button>
                            )}
                        </div>

                        <div className={`p-8 rounded-[2.5rem] border transition-all ${state.unlockedFeatures.includes('custom_zone') ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-5 bg-black/40 rounded-3xl"><MapPin size={36} className={state.unlockedFeatures.includes('custom_zone') ? 'text-blue-400' : 'text-white/20'}/></div>
                                {state.unlockedFeatures.includes('custom_zone') ? <span className="bg-blue-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full">DÉBLOQUÉ</span> : <span className="bg-white/5 text-white/30 text-[10px] font-black px-4 py-1.5 rounded-full border border-white/5">DISPONIBLE</span>}
                            </div>
                            <h4 className="font-black text-lg mb-2 uppercase">Zone Personnalisée</h4>
                            <p className="text-[11px] opacity-50 mb-8 leading-relaxed">Libérez la portée du radar et choisissez votre zone.</p>
                            {!state.unlockedFeatures.includes('custom_zone') && (
                                <button onClick={() => handleShenronWish('unlock', true, 'custom_zone')} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${foundCount === 7 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>Invoquer</button>
                            )}
                        </div>

                        <div className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden ${state.unlockedFeatures.includes('world_scan') ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : isWorldScanAvailable ? 'bg-white/10 border-indigo-500/30' : 'bg-black/40 border-white/5 opacity-50'}`}>
                            {!isWorldScanAvailable && !state.unlockedFeatures.includes('world_scan') && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Lock size={24} className="text-white/40 mb-2"/>
                                        <p className="text-[9px] font-mono text-white/60 uppercase leading-relaxed">
                                            Vœu Suprême Verrouillé<br/>
                                            Complétez Scouter, Zone & Maîtrise
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-5 bg-black/40 rounded-3xl"><Globe size={36} className={state.unlockedFeatures.includes('world_scan') ? 'text-indigo-400' : 'text-white/20'}/></div>
                                {state.unlockedFeatures.includes('world_scan') ? <span className="bg-indigo-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full">DÉBLOQUÉ</span> : <span className="bg-white/5 text-white/30 text-[10px] font-black px-4 py-1.5 rounded-full border border-white/5">ULTIME</span>}
                            </div>
                            <h4 className="font-black text-lg mb-2 uppercase">Vision Planétaire</h4>
                            <p className="text-[11px] opacity-50 mb-8 leading-relaxed">Détectez les boules à l'échelle mondiale (20 000 km).</p>
                            
                            {!state.unlockedFeatures.includes('world_scan') && (
                                <button 
                                    onClick={() => handleShenronWish('unlock', true, 'world_scan')} 
                                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${foundCount === 7 && isWorldScanAvailable ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                                >
                                    {isWorldScanAvailable ? "Invoquer l'Ultime" : "Pré-requis requis"}
                                </button>
                            )}

                            {!state.unlockedFeatures.includes('world_scan') && (
                                <div className="mt-4 space-y-1">
                                    <div className="flex items-center gap-2 text-[8px] font-mono uppercase">
                                        {state.unlockedFeatures.includes('scouter') ? <CheckCircle2 size={10} className="text-emerald-500"/> : <div className="w-2.5 h-2.5 rounded-full border border-white/20"/>}
                                        <span className={state.unlockedFeatures.includes('scouter') ? 'text-emerald-500' : 'opacity-40'}>Scouter AR</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] font-mono uppercase">
                                        {state.unlockedFeatures.includes('custom_zone') ? <CheckCircle2 size={10} className="text-emerald-500"/> : <div className="w-2.5 h-2.5 rounded-full border border-white/20"/>}
                                        <span className={state.unlockedFeatures.includes('custom_zone') ? 'text-emerald-500' : 'opacity-40'}>Zone Personnalisée</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] font-mono uppercase">
                                        {state.collectionRadius <= 0.001 ? <CheckCircle2 size={10} className="text-emerald-500"/> : <div className="w-2.5 h-2.5 rounded-full border border-white/20"/>}
                                        <span className={state.collectionRadius <= 0.001 ? 'text-emerald-500' : 'opacity-40'}>Maîtrise Collecte (1m)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
             </div>

             <div className="mt-20 p-10 bg-yellow-500/5 border border-yellow-500/20 rounded-[3rem] text-center">
                <p className="text-yellow-500/80 font-mono text-[11px] uppercase tracking-[0.3em] leading-loose">
                    Invoquer Shenron nécessite 7 Dragon Balls.<br/>
                    Actuellement: <span className="text-yellow-500 font-black text-lg">{foundCount}/7</span><br/>
                    Un vœu exaucé consomme et disperse les boules.
                </p>
             </div>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowInstructions(false)}></div>
          <div className="relative w-full max-w-2xl bg-black/40 border-2 rounded-[3rem] p-8 sm:p-12 max-h-[92vh] overflow-y-auto" style={{ borderColor: `${radarColor}33` }}>
             <header className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-widest" style={{ color: radarColor }}>Guide de Survie</h2>
                <button onClick={() => setShowInstructions(false)} className="p-2 hover:bg-white/5 rounded-full transition-all"><X size={24}/></button>
             </header>
             <div className="space-y-6 text-sm font-mono leading-relaxed" style={{ color: `${radarColor}cc` }}>
                <p className="border-l-2 pl-4" style={{ borderColor: radarColor }}>1. Utilisez le RADAR pour localiser les 7 Dragon Balls dispersées autour de vous.</p>
                <p className="border-l-2 pl-4" style={{ borderColor: radarColor }}>2. Cliquez sur le RADAR pour changer d'échelle (Zoom cyclique).</p>
                <p className="border-l-2 pl-4" style={{ borderColor: radarColor }}>3. Atteignez physiquement la position d'une boule pour la collecter automatiquement.</p>
                <p className="border-l-2 pl-4" style={{ borderColor: radarColor }}>4. Une fois les 7 boules réunies, invoquez SHENRON pour débloquer des capacités. Notez que la Vision Planétaire est le vœu final, débloqué seulement après tous les autres.</p>
                <p className="border-l-2 pl-4" style={{ borderColor: radarColor }}>5. Changez votre race et votre design de radar via le Sanctuaire pour varier votre expérience.</p>
             </div>
          </div>
        </div>
      )}

      <header className="w-full max-w-2xl flex justify-between items-center mb-6 bg-black/60 p-5 rounded-3xl backdrop-blur-xl border border-white/10 ml-16 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase" style={{ color: radarColor }}>
            DRAGON BALL RADAR <span className="text-[10px] opacity-60 ml-2 font-mono">X-800</span>
          </h1>
          <p className="text-[10px] opacity-50 font-mono tracking-widest mt-1">PROPRIÉTÉ DE BULMA - {state.currentRace.toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono opacity-40 uppercase">Maîtrise</p>
          <p className="text-lg font-black">{state.collectionRadius * 1000}M</p>
        </div>
      </header>

      <div className="w-full max-w-md mb-10 px-6 flex flex-col items-center">
        <div className="flex justify-between w-full text-[11px] mb-4 font-mono font-bold">
          <span className="opacity-40 uppercase tracking-widest">{foundCount < 7 ? "DÉTECTION EN COURS" : "SHENRON DISPONIBLE"}</span>
          <span style={{ color: radarColor }}>{foundCount}/7 ★</span>
        </div>
        <div className="flex justify-between w-full gap-3 py-3 px-4 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => {
            const isF = state.dragonBalls.find(b => b.stars === s)?.found;
            return (
              <div key={s} className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-1000 ${isF ? 'bg-orange-500 border-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-110' : 'bg-zinc-800/60 border-zinc-700/50 opacity-20'}`}>
                <span className={`text-[10px] font-black ${isF ? 'text-white' : 'text-zinc-600'}`}>{s}★</span>
                {isF && <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>}
              </div>
            );
          })}
        </div>
      </div>

      <main className="w-full flex-1 flex flex-col items-center max-w-4xl relative">
        <div 
          onClick={!isMapView && !isPickingZone ? () => setRadarStep(p => (p+1)%5) : undefined} 
          className={`relative w-full aspect-square max-w-md ${!isMapView ? 'cursor-pointer active:scale-95' : ''} group select-none transition-transform duration-200`}
        >
          <div className="absolute inset-0 rounded-full border-[18px] border-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.8)] z-30 pointer-events-none ring-1 ring-white/10"></div>
          <div className="absolute inset-0 rounded-full overflow-hidden bg-black z-10 border border-white/5">
            {!isMapView ? (
              <>
                <RadarUI range={currentRadarRange} userLoc={effectiveCenter} balls={state.dragonBalls} onBallClick={setSelectedBall} design={state.design} />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                   <p className="text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                      <Target size={10} /> ÉCHELLE: {state.range >= 10000 ? 'PLANÉTAIRE' : `${currentRadarRange.toFixed(currentRadarRange < 1 ? 2 : 1)} KM`}
                   </p>
                </div>
              </>
            ) : (
              <div className={`w-full h-full relative ${mapTheme === 'dark' ? 'radar-theme' : ''}`}>
                {effectiveCenter && (
                  <MapContainer center={[effectiveCenter.lat, effectiveCenter.lng]} zoom={state.range >= 10000 ? 2 : 12} zoomControl={false} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapAutoView center={[effectiveCenter.lat, effectiveCenter.lng]} range={state.range} />
                    {isPickingZone && (
                        <MapPicker onPick={(lat, lng) => {
                            setState(p => ({ ...p, scanCenter: { lat, lng, accuracy: 0 } }));
                            setIsPickingZone(false);
                            setRadarStep(0);
                        }} />
                    )}
                    <Circle center={[effectiveCenter.lat, effectiveCenter.lng]} radius={state.range * 1000} pathOptions={{ color: radarColor, fillOpacity: 0.05 }} />
                    <Marker position={[effectiveCenter.lat, effectiveCenter.lng]} icon={L.divIcon({ html: `<div class="w-6 h-6 bg-white ring-4 rounded-full shadow-2xl" style="--tw-ring-color: ${radarColor}"></div>`, className: '', iconSize: [24, 24] })} />
                    {state.dragonBalls.map(b => (
                      <Marker 
                        key={b.id} 
                        position={[b.lat, b.lng]} 
                        icon={createDragonBallIcon(b.stars, b.found)} 
                        eventHandlers={{ click: () => setSelectedBall(b) }}
                      />
                    ))}
                  </MapContainer>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setMapTheme(p => p==='dark'?'light':'dark'); }} 
                  className="absolute top-24 right-14 z-[1001] w-12 h-12 bg-black/80 text-white rounded-full border-2 shadow-2xl flex items-center justify-center active:scale-90 transition-all hover:bg-white/10"
                  style={{ borderColor: radarColor }}
                >
                  {mapTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            )}
            
            {foundCount === 7 && !isMapView && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowShenron(true); }}
                  className="p-12 bg-yellow-500 text-black font-black rounded-full animate-bounce shadow-[0_0_100px_rgba(251,191,36,1)] flex flex-col items-center group active:scale-95 transition-all"
                >
                  <Star size={60} className="mb-2 group-hover:rotate-[360deg] transition-transform duration-1000" />
                  <span className="text-sm tracking-widest uppercase">Shenron</span>
                </button>
              </div>
            )}
          </div>
          <div className="absolute -bottom-12 left-0 right-0 text-center opacity-40 font-mono text-[9px] tracking-[0.4em] uppercase">
            {isMapView ? "Exploration Interactive" : "Tap pour Zoom cyclique"}
          </div>
        </div>

        {isMapView && (
          <div className="mt-8 flex animate-in fade-in slide-in-from-top-4 duration-300">
            <button 
              onClick={() => setRadarStep(0)} 
              className="px-6 py-4 bg-black/80 text-white rounded-2xl border-2 shadow-2xl flex items-center gap-3 font-black text-[12px] uppercase active:scale-95 transition-all hover:bg-white/10"
              style={{ borderColor: radarColor }}
            >
              <ArrowLeft size={20}/> RETOUR RADAR
            </button>
          </div>
        )}

        <div className={`${isMapView ? 'mt-12' : 'mt-24'} flex flex-col items-center gap-8 w-full max-w-md transition-all duration-500`}>
          <div className="w-full space-y-4 px-4">
             <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest flex items-center gap-2">Portée de Scan</span>
                <span className="text-xs font-black" style={{ color: radarColor }}>{state.range >= 10000 ? 'MONDE' : `${state.range} KM`}</span>
             </div>
             <div className="flex flex-wrap justify-center gap-2 w-full">
                {[1, 10, 100, 1000].map((r) => (
                    <button key={r} onClick={() => setState(p => ({...p, range: r}))} className={`flex-1 min-w-[60px] py-3 text-[9px] font-black rounded-xl border transition-all ${state.range === r ? 'text-black shadow-lg' : 'bg-black/40 text-white border-white/10'}`} style={{ backgroundColor: state.range === r ? radarColor : undefined, borderColor: state.range === r ? radarColor : undefined }}>
                        {r}KM
                    </button>
                ))}
                {state.unlockedFeatures.includes('world_scan') && (
                    <button onClick={() => setState(p => ({...p, range: 20000}))} className={`flex-1 min-w-[60px] py-3 text-[9px] font-black rounded-xl border transition-all ${state.range === 20000 ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-indigo-900/40 text-indigo-200 border-indigo-500/30'}`}>
                        MONDE
                    </button>
                )}
                {state.unlockedFeatures.includes('custom_zone') && (
                    <button onClick={() => {
                        const val = prompt("Entrez la portée en KM (max 10 000) :");
                        if(val && !isNaN(Number(val)) && Number(val) >= 1) {
                            const num = Number(val);
                            if (num > 10000) {
                                alert("Seul le vœu 'Vision Planétaire' peut percer le voile au-delà de 10 000 km !");
                                setState(p => ({...p, range: 10000}));
                            } else {
                                setState(p => ({...p, range: num}));
                            }
                        }
                    }} className={`flex-1 min-w-[60px] py-3 text-[9px] font-black rounded-xl border transition-all ${state.range > 1000 && state.range <= 10000 ? 'bg-blue-600 text-white' : 'bg-white/5 text-blue-400 border-blue-400/30'}`}>
                        LIBRE
                    </button>
                )}
             </div>
          </div>

          <button onClick={searchBalls} disabled={state.isLoading || !effectiveCenter} className="w-full py-5 text-white font-black rounded-2xl flex items-center justify-center gap-4 uppercase tracking-[0.15em] disabled:opacity-50 shadow-2xl transition-all hover:scale-[1.02] active:scale-95" style={{ backgroundColor: '#ff7700' }}>
            {state.isLoading ? <RefreshCcw className="animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
            {state.isLoading ? "Analyse..." : "Lancer le Scan"}
          </button>
        </div>

        {selectedBall && (
          <div className="mt-10 p-8 bg-black/60 border rounded-[2.5rem] w-full max-w-md backdrop-blur-2xl animate-in slide-in-from-bottom-8 shadow-2xl relative overflow-hidden group" style={{ borderColor: `${radarColor}33` }}>
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Star size={80}/></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tighter" style={{ color: radarColor }}>Boule n°{selectedBall.stars} <span className="text-orange-500 animate-pulse">★</span></h3>
                <p className="text-[11px] opacity-60 uppercase font-mono mt-2 flex items-center gap-2"><MapPin size={10}/> {selectedBall.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-40 font-mono uppercase tracking-widest mb-1">Distance</p>
                <p className={`text-2xl font-black ${selectedBall.found ? 'text-emerald-500' : 'text-white'}`}>
                    {selectedBall.found ? 'REÇUE' : currentDistToSelected || '---'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 py-10 opacity-30 text-[10px] font-mono text-center uppercase tracking-[0.5em]">
        <p>© 750 AGE CAPSULE CORP - DESIGN BY BULMA</p>
      </footer>
    </div>
  );
};

export default App;
