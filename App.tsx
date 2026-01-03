
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RadarState, DragonBall, UserLocation, RadarDesign } from './types';
import { generateValidCoordinates } from './services/geminiService';
import RadarUI from './components/RadarUI';
import { 
  Zap, RefreshCcw, Menu as MenuIcon, X, Star, Camera, 
  Wand2, MapPin, Target, Map as MapIcon, Globe, CheckCircle2,
  Palette, Info, ArrowLeft, Cpu, UserCircle2, Ruler, Sun, Moon, BookOpen, Lock, AlertTriangle
} from 'lucide-react';

const createDragonBallIcon = (stars: number, found: boolean) => L.divIcon({
  html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${found ? 'bg-gray-400 opacity-50' : 'bg-orange-500 ring-4 ring-yellow-400'} text-white font-bold border-2 border-white transform hover:scale-110 transition-transform">${stars}★</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const RADAR_DESIGNS_LIST = [
  { id: 'bulma' as const, name: 'Bulma Classic', color: '#AAFFAA', icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-bulma.png' },
  { id: 'capsule' as const, name: 'Capsule Corp', color: '#3b82f6', icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-capsule-corp1.png' },
  { id: 'saiyan' as const, name: 'SAIYAN', color: '#fbbf24', icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-saiyan1.png' },
  { id: 'namek' as const, name: 'NAMEK', color: '#4ade80', icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-namek1.png' }
];

const RACES_DATA = [
  { id: 'Terrien', radius: 0.05, label: 'les Terriens', wishId: 'race_terrien', distWishId: 'dist_terrien' },
  { id: 'Namek', radius: 0.15, label: 'Les Nameks', wishId: 'race_namek', distWishId: 'dist_namek' },
  { id: 'Kaio', radius: 0.3, label: 'Les Kaioshins et les Kaios', wishId: 'race_kaio', distWishId: 'dist_kaio' },
  { id: 'Cyborg', radius: 0.6, label: 'Les Cyborgs', wishId: 'race_cyborg', distWishId: 'dist_cyborg' },
  { id: 'Majin', radius: 1.2, label: 'Les Sorciers, Majins et Démons', wishId: 'race_majin', distWishId: 'dist_majin' },
  { id: 'Froid', radius: 3.0, label: 'Les démons du Froid', wishId: 'race_froid', distWishId: 'dist_froid' },
  { id: 'Saiyan', radius: 7.0, label: 'Les Saiyans', wishId: 'race_saiyan', distWishId: 'dist_saiyan' },
  { id: 'Hakaishin', radius: 15.0, label: 'Les Dieux de la Destructions', wishId: 'race_hakaishin', distWishId: 'dist_hakaishin' },
  { id: 'Ange', radius: 40.0, label: 'Les Anges', wishId: 'race_ange', distWishId: 'dist_ange' },
  { id: 'Zeno', radius: 100.0, label: 'Zeno', wishId: 'race_zeno', distWishId: 'dist_zeno' }
];

const MapAutoView: React.FC<{ center: UserLocation, range: number, target: DragonBall | null }> = ({ center, range, target }) => {
  const map = useMap();
  const zoomLevel = useMemo(() => {
    if (range >= 20000) return 2;
    if (range >= 1000) return 6;
    if (range <= 1) return 15;
    if (range <= 10) return 12;
    if (range <= 100) return 9;
    return 3;
  }, [range]);

  useEffect(() => {
    if (target) {
      map.setView([target.lat, target.lng], map.getZoom(), { animate: true });
    } else {
      map.setView([center.lat, center.lng], zoomLevel, { animate: true });
    }
  }, [center.lat, center.lng, zoomLevel, target?.id, map]);
  
  return null;
};

const App: React.FC = () => {
  const [state, setState] = useState<RadarState>(() => {
    const saved = localStorage.getItem('radar_v_progression_final');
    const defaultState: RadarState = {
      range: 10,
      userLocation: null,
      scanCenter: null,
      dragonBalls: [],
      isLoading: false,
      error: null,
      design: 'bulma',
      collectionRadius: 0.05, 
      unlockedFeatures: ['race_terrien', 'dist_terrien'],
      currentRace: 'Terrien'
    };
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  });

  const [radarStep, setRadarStep] = useState<number>(0);
  const [selectedBall, setSelectedBall] = useState<DragonBall | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWishes, setShowWishes] = useState(false);
  const [showShenron, setShowShenron] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isScouterMode, setIsScouterMode] = useState(false);
  const [isMapDarkMode, setIsMapDarkMode] = useState(false);
  const [customRangeInput, setCustomRangeInput] = useState<string>(state.range.toString());
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    localStorage.setItem('radar_v_progression_final', JSON.stringify(state));
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
        (err) => setState(prev => ({ ...prev, error: "Activez le GPS." })),
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
  const foundCount = state.dragonBalls.filter(b => b.found).length;
  const hasSevenBalls = foundCount === 7;

  const searchBalls = async () => {
    if (!effectiveCenter) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const balls = await generateValidCoordinates(effectiveCenter, state.range);
      setState(prev => ({ ...prev, dragonBalls: balls, isLoading: false }));
      setRadarStep(0);
      setSelectedBall(null);
    } catch (err) {
      setState(prev => ({ ...prev, error: "Erreur satellite.", isLoading: false }));
    }
  };

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

  const handleShenronWish = (type: string, value: any, wishId?: string) => {
    if (type !== 'design' && !hasSevenBalls) return;

    setState(prev => {
      const newState = { ...prev };
      
      if (type === 'design') {
        newState.design = value;
      } else {
        newState.dragonBalls = [];
        if (wishId && !newState.unlockedFeatures.includes(wishId)) {
          newState.unlockedFeatures = [...newState.unlockedFeatures, wishId];
        }

        if (type === 'race') {
          newState.currentRace = value.id;
        }
        if (type === 'dist') {
          newState.collectionRadius = value;
        }
        if (type === 'range') newState.range = parseFloat(value) || prev.range;
        if (type === 'world_scan') newState.range = 20000;
      }
      
      return newState;
    });
    setShowWishes(false);
  };

  const toggleScouter = async () => {
    if (!isScouterMode) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsScouterMode(true);
      } catch (err) { alert("Caméra bloquée."); }
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      setIsScouterMode(false);
    }
  };

  const isUnlocked = (wishId: string) => state.unlockedFeatures.includes(wishId);
  
  const canUnlockRace = (raceIndex: number) => {
    if (raceIndex === 0) return true;
    const prevRace = RACES_DATA[raceIndex - 1];
    return isUnlocked(prevRace.distWishId);
  };

  const canUnlockDist = (raceIndex: number) => {
    const currentRace = RACES_DATA[raceIndex];
    return isUnlocked(currentRace.wishId);
  };

  const canUnlockTech = () => isUnlocked('dist_namek');
  const canUnlockScouter = () => isUnlocked('tech_custom_zone');
  const allProgressionsUnlocked = RACES_DATA.every(r => isUnlocked(r.wishId) && isUnlocked(r.distWishId));

  const radarColor = RADAR_DESIGNS_LIST.find(d => d.id === state.design)?.color || '#AAFFAA';

  const currentDistToSelected = useMemo(() => {
    if (!selectedBall || !state.userLocation) return null;
    const d = calculateDistance(state.userLocation.lat, state.userLocation.lng, selectedBall.lat, selectedBall.lng);
    return d > 1 ? `${d.toFixed(2)} km` : `${(d * 1000).toFixed(0)} m`;
  }, [selectedBall, state.userLocation]);

  const currentRadarRange = useMemo(() => {
    if (state.range >= 20000) return 20000;
    const multipliers = [1, 0.5, 0.2, 0.1, 0.05];
    return state.range * (multipliers[radarStep] || 1);
  }, [state.range, radarStep]);

  const isMapView = radarStep === 4;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-transparent relative z-10" style={{ color: radarColor }}>
      
      {showHelp && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowHelp(false)}></div>
          <div className="relative w-full max-w-2xl bg-zinc-900 border-2 rounded-[2rem] p-8 shadow-2xl overflow-y-auto max-h-[80vh]" style={{ borderColor: radarColor }}>
             <h2 className="text-2xl font-black text-white mb-6 uppercase italic flex items-center gap-4">
               <BookOpen size={28} /> Manuel du Chasseur
             </h2>
             <div className="space-y-6 text-white/80 font-mono text-sm leading-relaxed">
                <p><strong className="text-emerald-400">1. LOCALISATION :</strong> Autorisez le GPS pour voir votre position sur le radar.</p>
                <p><strong className="text-emerald-400">2. SCAN :</strong> Réglez la portée et lancez la détection satellite.</p>
                <p><strong className="text-emerald-400">3. ZOOM & CARTE :</strong> Touchez le radar pour alterner entre les échelles et la vision tactique.</p>
                <p><strong className="text-emerald-400">4. RÉCUPÉRATION :</strong> Approchez-vous d'une boule. Elle sera collectée une fois dans votre rayon.</p>
                <p><strong className="text-yellow-400">5. VOEUX :</strong> Collectez les 7 boules pour exaucer un vœu et progresser.</p>
             </div>
             <button onClick={() => setShowHelp(false)} className="mt-8 w-full py-4 bg-white text-black font-black rounded-xl uppercase tracking-widest hover:bg-zinc-200">Fermer</button>
          </div>
        </div>
      )}

      {showShenron && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95">
          <div className="absolute inset-0 bg-[url('https://www.transparentpng.com/download/dragon-ball/shenron-dragon-ball-z-png-9.png')] bg-contain bg-center bg-no-repeat opacity-40 animate-pulse"></div>
          <div className="relative text-center p-10 bg-black/80 backdrop-blur-3xl rounded-[3rem] border border-yellow-500/30 max-w-lg w-full">
            <h2 className="text-4xl font-black text-yellow-400 mb-6 uppercase italic glow-text">Vœu de Shenron</h2>
            <p className="text-white/70 mb-10 italic">"Énonce ton vœu, je l'exaucerai..."</p>
            <button onClick={() => { setShowWishes(true); setShowShenron(false); }} className="w-full py-5 bg-yellow-500 text-black font-black rounded-2xl uppercase tracking-widest text-lg hover:scale-105 transition-all">Faire un vœu</button>
          </div>
        </div>
      )}

      {showWishes && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center" 
            style={{ 
              backgroundImage: "url('https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/sanctuaire-voeux-page/dragon-voeux-page.png')",
              backgroundColor: '#000'
            }}
          ></div>
          <div className="absolute inset-0 z-10 bg-black/10" onClick={() => setShowWishes(false)}></div>
          
          <div className="relative w-full max-w-4xl bg-black/10 border-2 rounded-[3rem] p-8 max-h-[90vh] overflow-y-auto shadow-2xl z-20 backdrop-blur-[2px]" style={{ borderColor: `${radarColor}44` }}>
             <div className="relative z-10">
               <header className="flex flex-col gap-2 mb-10 sticky top-0 bg-black/40 backdrop-blur-md py-4 z-10 border border-white/5 rounded-2xl px-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-yellow-500 uppercase flex items-center gap-4"><Wand2 /> Sanctuaire Sacré</h2>
                    <button onClick={() => setShowWishes(false)} className="p-2 hover:bg-white/10 rounded-full text-white"><X size={24}/></button>
                  </div>
                  {!hasSevenBalls ? (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-400 animate-pulse">
                      <AlertTriangle size={14} /> Shenron est absent. Collecte les 7 boules pour exaucer un vœu.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                      <Star size={14} className="fill-current" /> Shenron est prêt. Les Dragon Balls brillent !
                    </div>
                  )}
               </header>

               <div className="space-y-16 pb-10">
                  <section>
                      <h3 className="text-xs font-mono text-white/50 mb-6 uppercase tracking-[0.3em] border-l-2 pl-4 flex items-center gap-2" style={{ borderColor: radarColor }}>
                         <Palette size={14}/> 01. Esthétique (Libre)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {RADAR_DESIGNS_LIST.map((d) => (
                              <button 
                                  key={d.id} 
                                  onClick={() => handleShenronWish('design', d.id)}
                                  className={`group relative p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${state.design === d.id ? 'bg-black/90' : 'bg-black/60 border-white/5 hover:border-white/20'}`}
                                  style={{ borderColor: state.design === d.id ? d.color : undefined }}
                              >
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${(d as any).icon ? '' : 'border-2'}`} style={{ borderColor: (d as any).icon ? 'transparent' : d.color, backgroundColor: (d as any).icon ? 'transparent' : `${d.color}22` }}>
                                      {(d as any).icon ? (
                                        <img src={(d as any).icon} alt={d.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: d.color }}></div>
                                      )}
                                  </div>
                                  <span className="text-[10px] font-black uppercase text-center mt-2" style={{ color: d.color }}>{d.name}</span>
                                  {state.design === d.id && <CheckCircle2 size={12} className="absolute top-2 right-2 text-white" />}
                              </button>
                          ))}
                      </div>
                  </section>

                  <section>
                      <h3 className="text-xs font-mono text-white/50 mb-6 uppercase tracking-[0.3em] border-l-2 pl-4 flex items-center gap-2" style={{ borderColor: radarColor }}>
                          <UserCircle2 size={14}/> 02. Races de Guerriers (Progression)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {RACES_DATA.map((r, idx) => {
                              const dependencyLocked = !canUnlockRace(idx);
                              const active = state.currentRace === r.id;
                              const alreadyOwned = isUnlocked(r.wishId);
                              const ballsLocked = !hasSevenBalls && !alreadyOwned;
                              const isLocked = dependencyLocked || ballsLocked;
                              
                              return (
                                <button key={r.id} disabled={isLocked || active} onClick={() => handleShenronWish('race', r, r.wishId)} className={`relative p-5 rounded-2xl border transition-all flex flex-col items-center justify-center min-h-[100px] ${active ? 'bg-black/90 border-yellow-500 border-2 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : alreadyOwned ? 'bg-emerald-500/10 border-emerald-500/30' : isLocked ? 'bg-zinc-800/80 border-white/5 opacity-50 grayscale' : 'bg-black/60 border-white/10 hover:border-yellow-500/50'}`}>
                                  {isLocked && <Lock size={16} className={`absolute top-3 left-3 ${ballsLocked && !dependencyLocked ? 'text-orange-500 animate-pulse' : 'text-white/20'}`} />}
                                  <span className={`font-black uppercase text-sm ${active ? 'text-yellow-400' : alreadyOwned ? 'text-emerald-400' : 'text-white'}`}>{r.label}</span>
                                  {dependencyLocked ? <span className="text-[8px] text-white/30 uppercase mt-2">Précédent Requis</span> : ballsLocked ? <span className="text-[8px] text-orange-500 uppercase mt-2 font-black">7 Boules Requises</span> : null}
                                  {active && <span className="text-[8px] text-yellow-500 uppercase mt-2 font-bold">Race Actuelle</span>}
                                </button>
                              );
                          })}
                      </div>
                  </section>

                  <section>
                      <h3 className="text-xs font-mono text-white/50 mb-6 uppercase tracking-[0.3em] border-l-2 pl-4 flex items-center gap-2" style={{ borderColor: radarColor }}>
                          <Ruler size={14}/> 03. Puissance de Collecte (Distances)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {RACES_DATA.map((r, idx) => {
                          const dependencyLocked = !canUnlockDist(idx);
                          const active = state.collectionRadius === r.radius;
                          const alreadyOwned = isUnlocked(r.distWishId);
                          const ballsLocked = !hasSevenBalls && !alreadyOwned;
                          const isLocked = dependencyLocked || ballsLocked;
                          
                          return (
                            <button key={`dist-${r.id}`} disabled={isLocked || active} onClick={() => handleShenronWish('dist', r.radius, r.distWishId)} className={`relative p-5 rounded-2xl border transition-all flex flex-col items-center justify-center min-h-[100px] ${active ? 'bg-black/90 border-blue-500 border-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : alreadyOwned ? 'bg-emerald-500/10 border-emerald-500/30' : isLocked ? 'bg-zinc-800/80 border-white/5 opacity-50 grayscale' : 'bg-black/60 border-white/10 hover:border-blue-500/50'}`}>
                              {isLocked && <Lock size={16} className={`absolute top-3 left-3 ${ballsLocked && !dependencyLocked ? 'text-orange-500 animate-pulse' : 'text-white/20'}`} />}
                              <span className="text-[10px] text-white/40 uppercase mb-1">{r.label}</span>
                              <span className={`font-black uppercase text-lg ${active ? 'text-blue-400' : 'text-white'}`}>{r.radius < 1 ? `${r.radius * 1000}m` : `${r.radius}km`}</span>
                              {active && <span className="text-[8px] text-blue-500 uppercase mt-2 font-bold">Actif</span>}
                            </button>
                          );
                        })}
                      </div>
                  </section>

                  <section>
                      <h3 className="text-xs font-mono text-white/50 mb-6 uppercase tracking-[0.3em] border-l-2 pl-4 flex items-center gap-2" style={{ borderColor: radarColor }}>
                          <Cpu size={14}/> 04. Technologie (Condition : Namek)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className={`md:col-span-2 p-6 bg-black/60 border rounded-[2rem] flex flex-col gap-4 backdrop-blur-sm transition-all ${canUnlockTech() ? 'border-white/10' : 'border-white/5 opacity-40 grayscale'}`}>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-white/60">Zone Personnalisée (KM)</span>
                                {(!canUnlockTech() || (!hasSevenBalls && !isUnlocked('tech_custom_zone'))) && <Lock size={14} className={!hasSevenBalls && canUnlockTech() ? "text-orange-500 animate-pulse" : "text-white/20"}/>}
                              </div>
                              <div className="flex gap-4">
                                  <input type="number" disabled={!canUnlockTech() || (!hasSevenBalls && !isUnlocked('tech_custom_zone'))} value={customRangeInput} onChange={(e) => setCustomRangeInput(e.target.value)} placeholder="0.00" className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-6 py-4 text-white font-black text-xl focus:outline-none focus:border-yellow-500 transition-colors" />
                                  <button disabled={!canUnlockTech() || (!hasSevenBalls && !isUnlocked('tech_custom_zone'))} onClick={() => handleShenronWish('range', customRangeInput, 'tech_custom_zone')} className="px-8 py-4 bg-yellow-500 text-black font-black rounded-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-20">OK</button>
                              </div>
                          </div>
                          <button disabled={!canUnlockScouter() || (!hasSevenBalls && !isUnlocked('tech_scouter'))} onClick={toggleScouter} className={`p-6 border rounded-[2rem] transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm ${canUnlockScouter() ? 'bg-black/60 border-white/10 hover:border-emerald-500' : 'bg-black/40 border-white/5 opacity-40 grayscale'}`}>
                              {canUnlockScouter() ? (!hasSevenBalls && !isUnlocked('tech_scouter') ? <Lock size={24} className="text-orange-500 animate-pulse" /> : <Camera size={24} className="text-emerald-400"/>) : <Lock size={24} className="text-white/20"/>}
                              <span className="block font-black uppercase text-xs text-emerald-400">Mode Scouter (AR)</span>
                          </button>
                          <button disabled={!allProgressionsUnlocked || (!hasSevenBalls && !isUnlocked('tech_world_scan'))} onClick={() => handleShenronWish('world_scan', null, 'tech_world_scan')} className={`p-6 border rounded-[2rem] transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm ${allProgressionsUnlocked ? 'bg-black/60 border-white/10 hover:border-orange-500' : 'bg-black/40 border-white/5 opacity-40 grayscale'}`}>
                              {allProgressionsUnlocked ? (!hasSevenBalls && !isUnlocked('tech_world_scan') ? <Lock size={24} className="text-orange-500 animate-pulse" /> : <Globe size={24} className="text-orange-400"/>) : <Lock size={24} className="text-white/20"/>}
                              <span className="block font-black uppercase text-xs text-orange-400">Scan Planétaire (20k km)</span>
                          </button>
                      </div>
                  </section>
               </div>
             </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="fixed inset-0 z-[4000] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-72 h-full bg-zinc-950/90 backdrop-blur-xl border-r p-8 flex flex-col shadow-2xl" style={{ borderColor: `${radarColor}22` }}>
            <div className="flex justify-between items-center mb-12">
              <span className="font-black tracking-widest text-xl uppercase italic" style={{ color: radarColor }}>Capsule OS</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-white"><X size={24} /></button>
            </div>
            <nav className="flex-1 space-y-4">
              <button onClick={() => { setShowHelp(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400">
                <span className="flex items-center gap-4"><Info size={20} /><span className="font-black text-xs uppercase">Aide</span></span>
              </button>
              <button onClick={() => { setShowWishes(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-5 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 text-yellow-500">
                <span className="flex items-center gap-4"><Star size={20} /><span className="font-black text-xs uppercase">Sanctuaire</span></span>
              </button>
            </nav>
          </div>
        </div>
      )}

      <header className="w-full max-w-xl flex justify-between items-center mb-6 bg-black/40 p-5 rounded-3xl backdrop-blur-xl border border-white/10 shadow-lg">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none" style={{ color: radarColor }}>DRAGON BALL <span className="opacity-60">RADAR</span></h1>
          <p className="text-[7px] font-mono uppercase tracking-[0.2em] opacity-40 mt-1" style={{ color: radarColor }}>Capsule Corp - {state.currentRace} ({(state.collectionRadius * 1000).toFixed(0)}m)</p>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white"><MenuIcon size={20} /></button>
      </header>

      <div className="w-full max-w-xs mb-6 mx-auto">
        <div className="flex justify-between w-full text-[10px] mb-3 font-mono opacity-50 px-2 uppercase tracking-widest text-white">
          <span>Détection active</span>
          <span>{foundCount}/7</span>
        </div>
        <div className="flex justify-between w-full gap-2 p-4 bg-black/60 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => {
            const isF = state.dragonBalls.find(b => b.stars === s)?.found;
            return (
              <div key={s} className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${isF ? 'bg-orange-500 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'bg-zinc-800/60 border-zinc-700 opacity-20'}`}>
                <span className={`text-[8px] font-black ${isF ? 'text-white' : 'text-zinc-600'}`}>{s}★</span>
              </div>
            );
          })}
        </div>
      </div>

      <main className="w-full flex-1 flex flex-col items-center max-w-md relative">
        <div onClick={() => !isMapView && setRadarStep(p => (p + 1) % 5)} className="relative w-full aspect-square cursor-pointer active:scale-95 transition-transform group">
          <div className="absolute inset-0 rounded-full border-[15px] border-zinc-900 z-30 pointer-events-none ring-1 ring-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"></div>
          <div className={`absolute inset-0 rounded-full overflow-hidden bg-black z-10 border border-white/5`}>
            {!isMapView ? (
              <>
                <RadarUI range={currentRadarRange} userLoc={effectiveCenter} balls={state.dragonBalls} onBallClick={setSelectedBall} design={state.design} />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-black/70 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md pointer-events-none text-white">
                   <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Target size={12}/> ZOOM: {currentRadarRange.toFixed(currentRadarRange < 1 ? 2 : 1)} KM</p>
                </div>
              </>
            ) : (
              <div className={`w-full h-full relative ${isMapDarkMode ? 'map-dark-mode' : ''}`}>
                {effectiveCenter && (
                  <MapContainer center={[effectiveCenter.lat, effectiveCenter.lng]} zoom={13} zoomControl={false} className="h-full w-full" dragging={true} scrollWheelZoom={true} doubleClickZoom={true}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapAutoView center={effectiveCenter} range={state.range} target={selectedBall} />
                    <Circle center={[effectiveCenter.lat, effectiveCenter.lng]} radius={state.range * 1000} pathOptions={{ color: '#ff7700', fillColor: '#ff7700', fillOpacity: 0.1, weight: 2, dashArray: '10, 10' }} />
                    <Marker position={[effectiveCenter.lat, effectiveCenter.lng]} icon={L.divIcon({ html: `<div class="w-6 h-6 bg-white ring-2 rounded-full shadow-lg animate-pulse" style="--tw-ring-color: ${radarColor}"></div>`, className: '', iconSize: [24, 24] })} />
                    {state.dragonBalls.map(b => <Marker key={b.id} position={[b.lat, b.lng]} icon={createDragonBallIcon(b.stars, b.found)} eventHandlers={{ click: () => setSelectedBall(b) }} />)}
                  </MapContainer>
                )}
                <button onClick={(e) => { e.stopPropagation(); setIsMapDarkMode(!isMapDarkMode); }} className="absolute top-[18%] right-[18%] z-[1000] p-4 bg-black/80 rounded-full border-2 border-white/30 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-90 flex items-center justify-center transition-all hover:border-white/60">
                  {isMapDarkMode ? <Sun size={24} className="text-yellow-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" /> : <Moon size={24} className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" />}
                </button>
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30 shadow-lg">Vision Tactique</div>
              </div>
            )}
            
            {hasSevenBalls && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in zoom-in">
                <button onClick={(e) => { e.stopPropagation(); setShowShenron(true); }} className="p-12 bg-yellow-500 text-black font-black rounded-full animate-bounce shadow-2xl flex flex-col items-center">
                  <Star size={40} className="mb-2 fill-current" />
                  <span className="text-[10px] tracking-widest uppercase">Appeler Shenron</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {isMapView && (
          <button onClick={() => setRadarStep(0)} className="mt-6 flex items-center gap-2 px-8 py-3 bg-zinc-900/90 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all animate-in slide-in-from-top-2 shadow-xl text-white backdrop-blur-md">
            <ArrowLeft size={14} /> Retour au Radar
          </button>
        )}

        {!isMapView && (
          <div className="mt-8 flex flex-col items-center gap-4 w-full px-4 animate-in fade-in">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">Portée Satellite: {state.range} KM</h2>
            <div className="grid grid-cols-4 gap-2 w-full mb-1">
              {[1, 10, 100, 1000].map(r => (
                <button key={r} onClick={() => setState(prev => ({ ...prev, range: r }))} className={`py-3 rounded-xl border text-[9px] font-black transition-all uppercase tracking-tighter backdrop-blur-md ${state.range === r ? 'bg-white/10 border-white/40' : 'bg-black/40 border-white/5 opacity-60 hover:opacity-100 hover:bg-black/60'}`} style={{ borderColor: state.range === r ? radarColor : undefined, color: state.range === r ? radarColor : 'white', boxShadow: state.range === r ? `0 0 15px ${radarColor}33` : 'none' }}>{r} KM</button>
              ))}
            </div>
            <button onClick={searchBalls} disabled={state.isLoading || !effectiveCenter} className="w-full py-5 text-white font-black rounded-2xl flex items-center justify-center gap-4 uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,119,0,0.3)] border-b-4 border-black/20" style={{ backgroundColor: '#ff7700' }}>
              {state.isLoading ? <RefreshCcw className="animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
              {state.isLoading ? "RECHERCHE..." : "DÉTECTER LES BOULES"}
            </button>
          </div>
        )}

        {selectedBall && (
          <div className="mt-8 p-6 bg-zinc-900/90 border border-white/10 rounded-2xl w-full backdrop-blur-xl animate-in slide-in-from-bottom-5 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg uppercase tracking-tighter" style={{ color: radarColor }}>BOULE {selectedBall.stars} ★</h3>
                <p className="text-[10px] opacity-60 uppercase font-mono mt-1 flex items-center gap-2"><MapPin size={10}/> {selectedBall.name}</p>
              </div>
              <div className="text-right"><p className={`text-xl font-black ${selectedBall.found ? 'text-emerald-500' : 'text-white'}`}>{selectedBall.found ? 'REÇUE' : currentDistToSelected || '---'}</p></div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-6 opacity-40 text-[7px] font-mono text-center uppercase tracking-[0.5em] text-white"><p>© 750 AGE - CAPSULE CORP.</p></footer>
    </div>
  );
};

export default App;
