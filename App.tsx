
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { RadarState, DragonBall, UserLocation, RadarArc, Character, CharacterGroup } from './types';
import { generateValidCoordinates } from './services/overpassService';
import RadarUI from './components/RadarUI';
import { ARCS_DATA, UI_TITLES, DEBUG_FLAGS, COOLDOWN_DURATION } from './config';
import { 
  Zap, RefreshCcw, Menu as MenuIcon, X, Star, Camera, 
  Globe, ArrowLeft, UserCircle2, Trash2, Sparkles, Lock, 
  MapPin, Moon, Sun, Target, BookOpen, Trophy, Plus, Minus, Delete, Hourglass
} from 'lucide-react';

const createDragonBallIcon = (stars: number, found: boolean) => L.divIcon({
  html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${found ? 'bg-gray-400 opacity-50' : 'bg-orange-500 ring-4 ring-yellow-400'} text-white font-bold border-2 border-white transform hover:scale-110 transition-transform">${stars}★</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const createWarriorIcon = () => L.divIcon({
  html: `<div class="w-6 h-6 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_15px_#22d3ee] animate-pulse"></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const MapAutoView: React.FC<{ center: UserLocation, target: DragonBall | null }> = ({ center, target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView([target.lat, target.lng], 18, { animate: true });
    else map.setView([center.lat, center.lng], 15, { animate: true });
  }, [center.lat, center.lng, target?.id, map]);
  return null;
};

const DragonBallInventory: React.FC<{ balls: DragonBall[], radarColor: string }> = ({ balls, radarColor }) => {
  const renderStars = (count: number, isFound: boolean) => {
    const starColor = isFound ? 'fill-red-600' : 'fill-red-950 opacity-20';
    const positions: Record<number, { x: string, y: string }[]> = {
      1: [{ x: '50%', y: '50%' }],
      2: [{ x: '28%', y: '28%' }, { x: '72%', y: '72%' }],
      3: [{ x: '50%', y: '25%' }, { x: '25%', y: '72%' }, { x: '75%', y: '72%' }],
      4: [{ x: '30%', y: '30%' }, { x: '70%', y: '30%' }, { x: '30%', y: '70%' }, { x: '70%', y: '70%' }],
      5: [{ x: '25%', y: '25%' }, { x: '75%', y: '25%' }, { x: '50%', y: '50%' }, { x: '25%', y: '75%' }, { x: '75%', y: '75%' }],
      6: [{ x: '30%', y: '22%' }, { x: '30%', y: '50%' }, { x: '30%', y: '78%' }, { x: '70%', y: '22%' }, { x: '70%', y: '50%' }, { x: '70%', y: '78%' }],
      7: [{ x: '50%', y: '50%' }, { x: '50%', y: '20%' }, { x: '78%', y: '35%' }, { x: '78%', y: '65%' }, { x: '50%', y: '80%' }, { x: '22%', y: '65%' }, { x: '22%', y: '35%' }]
    };
    return (positions[count] || []).map((pos, i) => (
      <Star key={i} size={6} className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${starColor}`} fill="currentColor" />
    ));
  };
  return (
    <div className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-md border rounded-full mb-8 shadow-xl" style={{ borderColor: `${radarColor}33` }}>
      {[1, 2, 3, 4, 5, 6, 7].map(num => {
        const ball = balls.find(b => b.stars === num);
        const isFound = ball?.found || false;
        return (
          <div key={num} className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-700 border ${isFound ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-300 shadow-[0_0_15px_rgba(251,146,60,0.7)]' : 'bg-zinc-800/40 border-white/5 opacity-50'}`}>
            <div className="relative w-full h-full">{renderStars(num, isFound)}</div>
          </div>
        );
      })}
    </div>
  );
};

const CharacterBadge: React.FC<{ char: Character, isUnlocked: boolean, radarColor: string, onSelect: () => void }> = ({ char, isUnlocked, radarColor, onSelect }) => {
  return (
    <button onClick={onSelect} disabled={!isUnlocked} className={`flex flex-col items-center gap-2 group transition-all ${isUnlocked ? 'hover:scale-105' : 'opacity-40 grayscale'}`}>
      <div className={`relative ${char.isMain ? 'w-20 h-20' : 'w-16 h-16'} rounded-full border-4 overflow-hidden flex items-center justify-center transition-all ${isUnlocked ? (char.isMain ? 'border-yellow-500 shadow-[0_0_15_gold]' : 'border-slate-400') : 'border-zinc-800'}`}>
        {isUnlocked && char.image ? (
          <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
        ) : isUnlocked ? (
          <div className="text-[10px] font-black uppercase text-center text-white/70 px-2">{char.name}</div>
        ) : (
          <Lock className="text-white/20" size={char.isMain ? 24 : 20} />
        )}
      </div>
      <span className={`text-[8px] font-black uppercase text-center max-w-[80px] leading-tight ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
        {char.name}
      </span>
    </button>
  );
};

const ScouterAROverlay: React.FC<{ 
  heading: number, 
  userLoc: UserLocation, 
  balls: DragonBall[], 
  radarColor: string,
  isSimulated: boolean,
  onHeadingChange: (h: number) => void
}> = ({ heading, userLoc, balls, radarColor, isSimulated, onHeadingChange }) => {
  const FOV = 60;
  
  const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden flex items-center justify-center">
      {isSimulated && (
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: `linear-gradient(${radarColor}44 1px, transparent 1px), linear-gradient(90deg, ${radarColor}44 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      )}

      {balls.map(ball => {
        const bearing = getBearing(userLoc.lat, userLoc.lng, ball.lat, ball.lng);
        let diff = bearing - heading;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        if (Math.abs(diff) > FOV / 2) return null;

        const xPos = (diff / (FOV / 2)) * 50 + 50;
        const dist = calculateDistance(userLoc.lat, userLoc.lng, ball.lat, ball.lng);
        const scale = Math.max(0.4, 1.2 - dist / 0.5); 

        return (
          <div 
            key={ball.id}
            className="absolute transition-all duration-75 flex flex-col items-center"
            style={{ 
              left: `${xPos}%`, 
              transform: `translate(-50%, -50%) scale(${scale})`,
              top: '50%'
            }}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-[0_0_30px_rgba(251,146,60,0.8)] ${ball.found ? 'bg-gray-500 border-gray-400' : 'bg-orange-500 border-yellow-400'}`}>
              <span className="text-2xl font-black text-white">{ball.stars}★</span>
            </div>
            <div className="mt-3 px-4 py-1.5 bg-black/70 rounded-full border border-white/20 text-[12px] font-black text-white whitespace-nowrap backdrop-blur-md">
              {dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(2)}km`}
            </div>
          </div>
        );
      })}

      {isSimulated && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-72 p-5 bg-black/80 rounded-[2rem] border-2 border-white/10 pointer-events-auto backdrop-blur-xl shadow-2xl">
          <div className="flex justify-between text-[9px] font-black uppercase mb-3 tracking-widest opacity-60">
            <span style={{ color: radarColor }}>Simulation Tactique</span>
            <span style={{ color: radarColor }}>{heading.toFixed(0)}°</span>
          </div>
          <input 
            type="range" min="0" max="360" value={heading} 
            onChange={(e) => onHeadingChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const flattenChars = (groups: CharacterGroup[]) => groups.flatMap(g => g.list);
  const getAllChars = useMemo(() => ARCS_DATA.flatMap(a => flattenChars(a.characters)), []);

  const [state, setState] = useState<RadarState>(() => {
    const isDev = DEBUG_FLAGS.IS_DEV_MODE;
    const unlockAll = isDev && DEBUG_FLAGS.UNLOCK_ALL;
    
    const saved = isDev ? null : localStorage.getItem('radar_v6_arc_progression');
    const firstCharName = flattenChars(ARCS_DATA[0].characters)[0].name;
    
    const defaultState: RadarState = {
      range: 1,
      customRange: 100,
      userLocation: null,
      dragonBalls: [],
      activeCharacterPoint: null,
      isLoading: false,
      error: null,
      currentArcIndex: 0,
      unlockedArcIndexes: unlockAll ? ARCS_DATA.map((_, i) => i) : [0],
      foundCharacterNames: unlockAll ? getAllChars.map(c => c.name) : [firstCharName],
      currentAvatarId: firstCharName,
      unlockedFeatures: unlockAll ? ['scouter', 'range_10k', 'range_world'] : [],
      wishesAvailable: 0,
      lastWishTimestamp: null
    };

    if (saved) {
      try {
        return { ...defaultState, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Erreur de lecture de la sauvegarde", e);
      }
    }
    return defaultState;
  });

  const [radarStep, setRadarStep] = useState(0);
  const [selectedBall, setSelectedBall] = useState<DragonBall | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWishes, setShowWishes] = useState(false);
  const [showShenron, setShowShenron] = useState(false);
  const [openBookSaga, setOpenBookSaga] = useState<number | null>(null);
  const [isScouterMode, setIsScouterMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Vérification périodique du cooldown pour désactiver les boules
  const isCooldownActive = useMemo(() => {
    if (!state.lastWishTimestamp) return false;
    return Date.now() - state.lastWishTimestamp < COOLDOWN_DURATION;
  }, [state.lastWishTimestamp]);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const heading = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
      if (heading !== undefined) setDeviceHeading(heading);
    };

    if (isScouterMode && !DEBUG_FLAGS.IS_DEV_MODE) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isScouterMode]);

  useEffect(() => {
    if (!DEBUG_FLAGS.IS_DEV_MODE) {
      localStorage.setItem('radar_v6_arc_progression', JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setState(prev => ({ ...prev, userLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } })),
        (err) => setState(prev => ({ ...prev, error: "GPS requis." })),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const currentArc = ARCS_DATA[state.currentArcIndex];
  const radarColor = currentArc.colors.main;

  const actualRange = useMemo(() => {
    if (state.range === 10000) return state.customRange;
    return state.range;
  }, [state.range, state.customRange]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const foundInArcCount = state.dragonBalls.filter(b => b.found).length;
  const hasSevenBalls = foundInArcCount === 7;

  const searchBalls = async () => {
    if (!state.userLocation || isCooldownActive) return;
    
    let searchRange = actualRange;
    if (state.range === 10000 && searchRange < 100) {
      searchRange = 100;
      setState(p => ({ ...p, customRange: 100 }));
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const balls = await generateValidCoordinates(state.userLocation, searchRange);
      
      // Logique Détection Guerrier (Point Bleu)
      let warriorPoint = null;
      if (Math.random() < 0.8) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * searchRange;
        const dLat = (dist * Math.cos(angle)) / 111;
        const dLng = (dist * Math.sin(angle)) / (111 * Math.cos(state.userLocation.lat * Math.PI / 180));
        warriorPoint = { lat: state.userLocation.lat + dLat, lng: state.userLocation.lng + dLng };
      }

      setState(prev => ({ ...prev, dragonBalls: balls, activeCharacterPoint: warriorPoint, isLoading: false }));
      setRadarStep(0);
      setSelectedBall(null);
    } catch (err) { setState(prev => ({ ...prev, error: "Satellite indisponible.", isLoading: false })); }
  };

  useEffect(() => {
    if (!state.userLocation || isCooldownActive) {
      if (isCooldownActive && (state.dragonBalls.length > 0 || state.activeCharacterPoint !== null)) {
         setState(prev => ({ ...prev, dragonBalls: [], activeCharacterPoint: null }));
      }
      return;
    }

    // Détection Boules de Cristal
    const updatedBalls = state.dragonBalls.map(ball => {
      if (ball.found) return ball;
      const dist = calculateDistance(state.userLocation!.lat, state.userLocation!.lng, ball.lat, ball.lng);
      return dist < currentArc.radius ? { ...ball, found: true } : ball;
    });

    // Détection Guerrier (Point Bleu)
    let warriorFound = false;
    let newFoundCharacter = null;
    if (state.activeCharacterPoint) {
      const distWarrior = calculateDistance(state.userLocation.lat, state.userLocation.lng, state.activeCharacterPoint.lat, state.activeCharacterPoint.lng);
      if (distWarrior < currentArc.radius) {
        warriorFound = true;
        const arcChars = flattenChars(ARCS_DATA[state.currentArcIndex].characters);
        const availableInArc = arcChars.filter(c => !state.foundCharacterNames.includes(c.name));
        if (availableInArc.length > 0) {
          newFoundCharacter = availableInArc[Math.floor(Math.random() * availableInArc.length)].name;
        }
      }
    }

    const newlyFoundBalls = updatedBalls.filter((b, i) => b.found && !state.dragonBalls[i].found);
    
    if (newlyFoundBalls.length > 0 || warriorFound) {
      const arcChars = flattenChars(ARCS_DATA[state.currentArcIndex].characters);
      const availableCharsInArc = arcChars.filter(c => !state.foundCharacterNames.includes(c.name));
      const shuffled = [...availableCharsInArc].sort(() => Math.random() - 0.5);
      
      const countToUnlock = newlyFoundBalls.length * 3;
      const newCharsFromBalls = shuffled.slice(0, countToUnlock).map(c => c.name);
      
      const finalNewNames = [...new Set([...state.foundCharacterNames, ...newCharsFromBalls, ...(newFoundCharacter ? [newFoundCharacter] : [])])];

      setState(prev => ({ 
        ...prev, 
        dragonBalls: updatedBalls, 
        activeCharacterPoint: warriorFound ? null : prev.activeCharacterPoint,
        foundCharacterNames: finalNewNames
      }));
    }
  }, [state.userLocation, state.dragonBalls, state.activeCharacterPoint, currentArc.radius, state.currentArcIndex, isCooldownActive]);

  const handleWish = (wish: 'restart' | 'next_radar' | 'scouter' | 'range_10k' | 'range_world') => {
    setState(prev => {
      let next = { 
        ...prev, 
        wishesAvailable: Math.max(0, prev.wishesAvailable - 1),
        lastWishTimestamp: Date.now(), // Enregistre le vœu
        dragonBalls: [], // Vide les boules
        activeCharacterPoint: null // Vide le guerrier
      };
      if (wish === 'restart') {
        // Déjà géré par la mise à zéro par défaut
      } else if (wish === 'next_radar') {
        const nextIdx = prev.currentArcIndex + 1;
        if (nextIdx < ARCS_DATA.length) {
          next.currentArcIndex = nextIdx;
          if (!next.unlockedArcIndexes.includes(nextIdx)) next.unlockedArcIndexes.push(nextIdx);
        }
      } else if (wish === 'scouter') {
        next.unlockedFeatures.push('scouter');
      } else if (wish === 'range_10k') {
        next.unlockedFeatures.push('range_10k');
      } else if (wish === 'range_world') {
        next.unlockedFeatures.push('range_world');
      }
      return next;
    });
    setShowWishes(false);
  };

  const totalPossibleCharacters = ARCS_DATA.reduce((acc, arc) => acc + flattenChars(arc.characters).length, 0);
  const canUnlockFinalWishes = state.foundCharacterNames.length >= totalPossibleCharacters && state.unlockedArcIndexes.includes(ARCS_DATA.length - 1);

  const toggleScouter = async () => {
    if (!isScouterMode) {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try { await (DeviceOrientationEvent as any).requestPermission(); } catch (e) {}
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsScouterMode(true);
      } catch (err) { 
        if (DEBUG_FLAGS.IS_DEV_MODE) setIsScouterMode(true);
        else alert("Caméra bloquée."); 
      }
    } else {
      (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
      setIsScouterMode(false);
    }
  };

  const getBallDistance = (ball: DragonBall) => {
    if (!state.userLocation) return '0 m';
    const distKm = calculateDistance(state.userLocation.lat, state.userLocation.lng, ball.lat, ball.lng);
    return distKm < 1 ? `${(distKm * 1000).toFixed(0)} m` : `${distKm.toFixed(2)} km`;
  };

  const rangeOptions = [
    { value: 1, label: '1 KM' },
    { value: 10, label: '10 KM' },
    { value: 100, label: '100 KM' },
    { value: 10000, label: 'ZONE PERSO', feature: 'range_10k' },
    { value: 20000, label: 'SCAN PLANÉTAIRE', feature: 'range_world' },
  ];

  const handleDigit = (digit: number) => {
    setState(prev => {
      const currentStr = prev.customRange.toString();
      if (digit === 0 && prev.customRange === 0) return prev;
      const nextStr = prev.customRange === 0 ? digit.toString() : currentStr + digit;
      let nextNum = parseInt(nextStr);
      if (nextNum > 10000) nextNum = 10000;
      return { ...prev, customRange: nextNum };
    });
  };

  const handleClear = () => {
    setState(prev => ({ ...prev, customRange: 0 }));
  };

  const handleBackstep = () => {
    setState(prev => {
      const currentStr = prev.customRange.toString();
      if (currentStr.length <= 1) return { ...prev, customRange: 0 };
      const nextNum = parseInt(currentStr.slice(0, -1));
      return { ...prev, customRange: nextNum };
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-transparent relative z-10" style={{ color: radarColor }}>
      {isScouterMode && (
        <>
          <video ref={videoRef} autoPlay playsInline className="fixed inset-0 w-full h-full object-cover z-[-1]" />
          {state.userLocation && (
            <ScouterAROverlay 
              heading={deviceHeading} 
              userLoc={state.userLocation} 
              balls={state.dragonBalls} 
              radarColor={radarColor}
              isSimulated={DEBUG_FLAGS.IS_DEV_MODE}
              onHeadingChange={setDeviceHeading}
            />
          )}
          <button 
            onClick={toggleScouter} 
            className="fixed top-6 right-6 z-[2000] p-4 bg-red-600/80 hover:bg-red-600 text-white rounded-full shadow-2xl backdrop-blur-md border border-white/20 transition-all active:scale-90"
          >
            <X size={32} />
          </button>
        </>
      )}
      <div className={`fixed inset-0 z-[-5] transition-opacity duration-1000 ${showWishes ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url('https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/sanctuaire-voeux-page/dragon-voeux-page.png')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}><div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div></div>

      {!showWishes && (
        <>
          <header className="w-full max-w-xl mb-8 bg-black/60 p-4 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col">
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase text-center text-white/40 mb-3">{UI_TITLES.MAIN_APP_TITLE}</h1>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-yellow-500/50 flex items-center justify-center overflow-hidden bg-black/40">
                  {getAllChars.find(c => c.name === state.currentAvatarId)?.image ? (
                    <img src={getAllChars.find(c => c.name === state.currentAvatarId)?.image} className="w-full h-full object-cover" />
                  ) : <UserCircle2 className="text-white/40" />}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-black uppercase italic leading-none" style={{ color: radarColor }}>{currentArc.label}</h2>
                  <p className="text-[8px] font-mono uppercase tracking-widest mt-1 opacity-60">{state.currentAvatarId} • {(currentArc.radius * 1000).toFixed(0)}m</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"><MenuIcon size={24} /></button>
              </div>
            </div>
          </header>

          {!isScouterMode && (
            <>
              <DragonBallInventory balls={state.dragonBalls} radarColor={radarColor} />

              <main className="w-full flex-1 flex flex-col items-center max-w-md relative">
                <div 
                  onClick={() => setRadarStep(p => (p + 1) % 5)} 
                  className="relative w-full aspect-square cursor-pointer active:scale-95 transition-transform mb-6"
                >
                  <div className="absolute inset-0 rounded-full border-[12px] border-zinc-900 z-30 pointer-events-none ring-1 ring-white/10 shadow-2xl"></div>
                  <div className="absolute inset-0 rounded-full overflow-hidden bg-black z-10">
                    {radarStep < 4 ? (
                      <RadarUI 
                        range={actualRange * [1, 0.5, 0.25, 0.1][radarStep]} 
                        userLoc={state.userLocation} 
                        balls={state.dragonBalls} 
                        activeCharacterPoint={state.activeCharacterPoint}
                        onBallClick={setSelectedBall} 
                        arc={currentArc} 
                        lastWishTimestamp={state.lastWishTimestamp}
                      />
                    ) : (
                      <div 
                        className={`w-full h-full ${isDarkMode ? 'map-dark-mode' : ''}`}
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <div className="absolute top-[4rem] right-[5rem] z-[1100]">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsDarkMode(!isDarkMode); }} 
                            className="w-11 h-11 flex items-center justify-center rounded-full border bg-black/60 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-90"
                            style={{ borderColor: `${radarColor}88`, color: radarColor }}
                          >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                          </button>
                        </div>

                        {state.userLocation && (
                          <MapContainer center={[state.userLocation.lat, state.userLocation.lng]} zoom={15} zoomControl={false} className="h-full w-full">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapAutoView center={state.userLocation} target={selectedBall} />
                            <Circle center={[state.userLocation.lat, state.userLocation.lng]} radius={actualRange * 1000} pathOptions={{ color: '#ff7700', fillOpacity: 0.1, weight: 1 }} />
                            <Marker position={[state.userLocation.lat, state.userLocation.lng]} icon={L.divIcon({ html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>', className: '' })} />
                            {state.dragonBalls.map(b => (
                              <Marker key={b.id} position={[b.lat, b.lng]} icon={createDragonBallIcon(b.stars, b.found)} eventHandlers={{ click: (e) => { setSelectedBall(b); } }} />
                            ))}
                            {state.activeCharacterPoint && (
                              <Marker position={[state.activeCharacterPoint.lat, state.activeCharacterPoint.lng]} icon={createWarriorIcon()} />
                            )}
                          </MapContainer>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setRadarStep(0); }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] p-4 bg-black/60 rounded-full border border-white/20 text-white flex items-center gap-2 text-[10px] font-black uppercase shadow-2xl backdrop-blur-md"><ArrowLeft size={18} /> {UI_TITLES.BACK_TO_RADAR}</button>
                      </div>
                    )}
                    {hasSevenBalls && (
                      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-in zoom-in">
                        <button onClick={e => { e.stopPropagation(); setShowShenron(true); }} className="p-10 bg-yellow-500 rounded-full animate-bounce shadow-[0_0_50px_gold]"><Star size={50} fill="black" /></button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBall && (
                  <div className="w-full px-4 mb-4 animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl border rounded-full py-2.5 px-4 shadow-xl overflow-hidden" style={{ borderColor: `${radarColor}44` }}>
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border transition-all ${selectedBall.found ? 'bg-zinc-800 border-zinc-700' : 'bg-orange-500 border-yellow-400 ring-2 ring-yellow-400/20 shadow-[0_0_10px_rgba(251,146,60,0.5)]'}`}>
                        <span className="text-[10px] font-black text-white">{selectedBall.stars}★</span>
                      </div>
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[7px] font-black uppercase text-white/40 tracking-widest leading-none mb-0.5">{UI_TITLES.TARGET_LABEL}</span>
                          <span className="text-[9px] text-white font-bold truncate leading-none">{selectedBall.name || 'Coordonnées'}</span>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-4">
                          <span className="text-[7px] font-black uppercase text-white/40 tracking-widest leading-none mb-0.5">{UI_TITLES.DISTANCE_LABEL}</span>
                          <span className="text-[9px] text-white font-black leading-none">{getBallDistance(selectedBall)}</span>
                        </div>
                      </div>
                      <button onClick={() => setSelectedBall(null)} className="ml-2 p-1.5 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="w-full px-4 space-y-4 mb-6">
                  <div className="grid grid-cols-5 gap-1.5">
                    {rangeOptions.map(opt => {
                      const isUnlocked = !opt.feature || state.unlockedFeatures.includes(opt.feature);
                      const isActive = state.range === opt.value;
                      return (
                        <button 
                          key={opt.value} 
                          disabled={!isUnlocked}
                          onClick={() => isUnlocked && setState(p => ({ ...p, range: opt.value }))} 
                          className={`relative py-3 rounded-xl border font-black uppercase transition-all flex flex-col items-center justify-center gap-1 ${
                            !isUnlocked 
                            ? 'bg-black/20 border-white/5 text-white/10 opacity-30 grayscale cursor-not-allowed' 
                            : isActive 
                            ? 'bg-white/20 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                            : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/5'
                          }`}
                        >
                          <span className={`text-center leading-[1.1] ${opt.label.length > 10 ? 'text-[6px]' : 'text-[7px]'}`}>
                            {opt.label}
                          </span>
                          {!isUnlocked && <Lock size={8} className="text-white/20" />}
                        </button>
                      );
                    })}
                  </div>

                  {state.range === 10000 && (
                    <div className="animate-in zoom-in-95 duration-300 p-5 bg-black/60 rounded-[2rem] border-2 border-white/10 backdrop-blur-xl shadow-2xl">
                       <div className="flex flex-col mb-4 px-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase opacity-60 tracking-[0.4em]">Terminal Capsule Corp</span>
                            <span className="text-[8px] font-mono text-white/20">v4.2-RANGE</span>
                          </div>
                          <div className="mt-2 py-3 px-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase italic" style={{ color: radarColor }}>Distance</span>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-2xl font-black italic glow-text ${state.customRange === 0 ? 'animate-pulse opacity-40' : ''}`} style={{ color: radarColor }}>
                                {state.customRange.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-black" style={{ color: radarColor }}>KM</span>
                            </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button 
                              key={num} 
                              onClick={() => handleDigit(num)}
                              className="py-4 bg-white/5 border border-white/10 rounded-xl text-xl font-black text-white hover:bg-white/10 active:scale-90 transition-all shadow-inner"
                            >
                              {num}
                            </button>
                          ))}
                          <button 
                            onClick={handleClear}
                            className="py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-black text-red-500 hover:bg-red-500/20 active:scale-90 transition-all uppercase"
                          >
                            CLR
                          </button>
                          <button 
                            onClick={() => handleDigit(0)}
                            className="py-4 bg-white/5 border border-white/10 rounded-xl text-xl font-black text-white hover:bg-white/10 active:scale-90 transition-all shadow-inner"
                          >
                            0
                          </button>
                          <button 
                            onClick={handleBackstep}
                            className="py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                          >
                            <Delete size={20} />
                          </button>
                       </div>
                       
                       <p className="mt-4 text-[7px] text-center font-black uppercase text-white/30 tracking-[0.2em]">
                          Min: 100 KM / Max: 10 000 KM
                       </p>
                    </div>
                  )}

                  <button 
                    onClick={searchBalls} 
                    disabled={state.isLoading || !state.userLocation || isCooldownActive} 
                    className={`w-full py-7 rounded-2xl font-black uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all disabled:opacity-50 ${isCooldownActive ? 'bg-zinc-800 text-white/30' : 'bg-orange-500 text-white'}`}
                  >
                    {state.isLoading ? <RefreshCcw className="animate-spin" /> : isCooldownActive ? <Hourglass size={20} className="animate-pulse" /> : <Zap className="fill-current w-6 h-6" />}
                    {state.isLoading ? UI_TITLES.SCAN_BUTTON_LOADING : isCooldownActive ? UI_TITLES.SCAN_BUTTON_COOLDOWN : UI_TITLES.SCAN_BUTTON_IDLE}
                  </button>
                </div>
              </main>
            </>
          )}
        </>
      )}

      {showShenron && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/40 animate-in fade-in">
          <div className="text-center p-12 bg-zinc-900/80 rounded-[4rem] border-2 border-yellow-500/50 max-w-md w-full backdrop-blur-xl">
            <div className="mb-6 text-yellow-500 animate-pulse flex justify-center"><Star size={100} fill="currentColor" /></div>
            <h2 className="text-4xl font-black text-yellow-500 mb-4 uppercase italic">{UI_TITLES.SHENRON_TITLE}</h2>
            <p className="text-white/60 mb-10 italic">{UI_TITLES.SHENRON_SUBTITLE}</p>
            <button onClick={() => { setState(p => ({ ...p, wishesAvailable: p.wishesAvailable + (actualRange >= 100 ? 3 : (actualRange >= 10 ? 2 : 1)), dragonBalls: [] })); setShowWishes(true); setShowShenron(false); }} className="w-full py-6 bg-yellow-500 text-black font-black rounded-3xl uppercase text-xl">{UI_TITLES.SHENRON_ACTION_BUTTON}</button>
          </div>
        </div>
      )}

      {showWishes && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 animate-in zoom-in">
          <div className="w-full max-w-4xl bg-zinc-950/90 border-2 border-yellow-500/30 rounded-[3rem] p-8 flex flex-col max-h-[95vh] shadow-2xl backdrop-blur-2xl">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-yellow-500 uppercase italic">{UI_TITLES.SANCTUARY_TITLE}</h2>
                <span className="text-[10px] text-white/40 uppercase font-bold">{UI_TITLES.WISHES_REMAINING} : {state.wishesAvailable}</span>
              </div>
              <button onClick={() => setShowWishes(false)} className="text-white/40 hover:text-white"><X size={32} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-12">
              <section>
                <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Zap size={16} /> {UI_TITLES.RADARS_SECTION}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ARCS_DATA.map((arc, idx) => {
                    const isUnlocked = state.unlockedArcIndexes.includes(idx);
                    const isNext = Math.max(...state.unlockedArcIndexes) + 1 === idx;
                    const isCurrent = state.currentArcIndex === idx;
                    return (
                      <button 
                        key={arc.id}
                        disabled={!isUnlocked && (!isNext || state.wishesAvailable <= 0)}
                        onClick={() => {
                          if (isUnlocked) setState(p => ({ ...p, currentArcIndex: idx }));
                          else if (isNext) handleWish('next_radar');
                        }}
                        className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all ${isCurrent ? 'bg-orange-500/10 border-orange-500' : isUnlocked ? 'bg-white/5 border-white/20' : isNext ? 'border-dashed border-yellow-500/40 opacity-60 animate-pulse' : 'opacity-10 grayscale'}`}
                      >
                        <img src={arc.icon} className="w-10 h-10 mb-2 object-contain" />
                        <span className="text-[8px] font-black uppercase text-center">{arc.label}</span>
                        <span className="text-[7px] opacity-40">{(arc.radius * 1000).toFixed(0)}m</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><BookOpen size={16} /> {UI_TITLES.CHRONICLES_SECTION}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[1, 2, 3].map(sagaNum => (
                    <button 
                      key={sagaNum} 
                      onClick={() => setOpenBookSaga(sagaNum)}
                      className="relative h-48 bg-zinc-900 rounded-2xl border-2 border-white/10 hover:border-yellow-500/50 group overflow-hidden transition-all"
                    >
                      <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-yellow-500 to-transparent"></div>
                      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                        <BookOpen size={40} className="mb-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-black uppercase tracking-widest text-white">Livre {UI_TITLES.SAGA_NAMES[sagaNum as keyof typeof UI_TITLES.SAGA_NAMES]}</span>
                        <div className="mt-2 text-[10px] text-white/40 font-bold uppercase">
                          {state.foundCharacterNames.filter(name => ARCS_DATA.filter(a => a.saga === sagaNum).flatMap(a => flattenChars(a.characters)).some(c => c.name === name)).length} / {ARCS_DATA.filter(a => a.saga === sagaNum).reduce((acc, arc) => acc + flattenChars(arc.characters).length, 0)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Trophy size={16} /> {UI_TITLES.FORBIDDEN_WISHES_SECTION}</h3>
                <div className="space-y-4">
                  {[
                    { id: 'scouter', label: 'Visière Scouter AR', icon: <Camera />, desc: 'Réalité Augmentée locale', req: 'scouter' },
                    { id: 'range_10k', label: 'Zone Personnalisée', icon: <Target />, desc: 'Portée Intercontinentale', req: 'range_10k' },
                    { id: 'range_world', label: 'Scan Planétaire', icon: <Globe />, desc: 'Accès sans limite au monde entier', req: 'range_world' }
                  ].map(f => {
                    const isUnlocked = state.unlockedFeatures.includes(f.req);
                    return (
                      <button 
                        key={f.id}
                        disabled={!canUnlockFinalWishes || isUnlocked || state.wishesAvailable <= 0}
                        onClick={() => handleWish(f.id as any)}
                        className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${isUnlocked ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : canUnlockFinalWishes ? 'bg-white/5 border-yellow-500/30 text-yellow-500' : 'opacity-20 grayscale border-white/5'}`}
                      >
                        <div className="flex items-center gap-6">
                          {f.icon}
                          <div className="text-left">
                            <span className="block font-black uppercase text-sm">{f.label}</span>
                            <span className="text-[10px] opacity-60 italic">{f.desc}</span>
                          </div>
                        </div>
                        {isUnlocked ? <Sparkles size={20} /> : <Lock size={20} />}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {openBookSaga !== null && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in">
          <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[3rem] p-8 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic">{UI_TITLES.COLLECTION_BOOK_TITLE}</h2>
                <span className="text-[10px] text-white/40 uppercase">{UI_TITLES.SAGA_NAMES[openBookSaga as keyof typeof UI_TITLES.SAGA_NAMES]}</span>
              </div>
              <button onClick={() => setOpenBookSaga(null)} className="text-white/40 hover:text-white"><X size={32} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-12 pr-4">
              {ARCS_DATA.filter(arc => arc.saga === openBookSaga).map(arc => (
                <div key={arc.id} className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-4 border-b border-white/5 pb-4"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> {arc.label}</h3>
                  {arc.characters.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-6">
                      {group.subTitle && (
                        <h4 className="text-[10px] font-black italic uppercase tracking-widest text-white/60 flex items-center gap-3 px-4">
                          <span className="w-4 h-[1px] bg-white/20"></span>
                          {group.subTitle}
                          <span className="flex-1 h-[1px] bg-white/10"></span>
                        </h4>
                      )}
                      <div className="flex flex-wrap gap-6 justify-center sm:justify-start px-4">
                        {group.list.map(char => (
                          <CharacterBadge 
                            key={char.name} 
                            char={char} 
                            isUnlocked={state.foundCharacterNames.includes(char.name)} 
                            radarColor={radarColor}
                            onSelect={() => setState(p => ({ ...p, currentAvatarId: char.name }))}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="fixed inset-0 z-[4000] flex">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-80 h-full bg-zinc-900/90 border-r-2 p-8 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300" style={{ borderColor: `${radarColor}44` }}>
            <div className="flex justify-between items-center mb-10">
              <span className="font-black text-2xl uppercase italic" style={{ color: radarColor }}>{UI_TITLES.MENU_HEADER}</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-white"><X size={32} /></button>
            </div>
            <div className="flex-1 space-y-8 overflow-y-auto">
              <section className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-full border-2 border-yellow-500 flex items-center justify-center overflow-hidden">
                   {getAllChars.find(c => c.name === state.currentAvatarId)?.image ? (
                     <img src={getAllChars.find(c => c.name === state.currentAvatarId)?.image} className="w-full h-full object-cover" />
                   ) : <UserCircle2 />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-white">{state.currentAvatarId}</span>
                  <span className="text-[8px] text-white/40 uppercase">{UI_TITLES.MENU_CURRENT_PROFILE}</span>
                </div>
              </section>
              <button onClick={() => { setShowWishes(true); setIsMenuOpen(false); }} className="w-full py-5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center gap-3 text-yellow-500 font-black uppercase italic text-sm">
                <Star size={20} fill="currentColor" /> {UI_TITLES.MENU_SANCTUARY_LINK}
              </button>
              {state.unlockedFeatures.includes('scouter') && (
                <button onClick={toggleScouter} className={`w-full py-5 rounded-2xl border flex items-center justify-center gap-3 font-black uppercase italic text-sm ${isScouterMode ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-white'}`}>
                  <Camera size={20} /> {isScouterMode ? UI_TITLES.SCOUTER_STOP : UI_TITLES.SCOUTER_START}
                </button>
              )}
            </div>
            <button onClick={() => { if(confirm(UI_TITLES.MENU_RESET_CONFIRM_MSG)) { localStorage.clear(); window.location.reload(); } }} className="mt-auto py-4 bg-red-900/20 text-red-400 border border-red-500/20 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><Trash2 size={16} /> {UI_TITLES.MENU_RESET_LABEL}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
