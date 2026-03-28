
import React, { useState, useEffect } from 'react';
import { DragonBall, UserLocation, RadarArc } from '../types';
import { COOLDOWN_DURATION } from '../config';
import { Hourglass } from 'lucide-react';

interface RadarUIProps {
  range: number; 
  userLoc: UserLocation | null;
  balls: DragonBall[];
  activeCharacterPoint: { lat: number, lng: number } | null;
  onBallClick: (ball: DragonBall) => void;
  arc: RadarArc;
  lastWishTimestamp: number | null;
}

const RadarUI: React.FC<RadarUIProps> = ({ range, userLoc, balls, activeCharacterPoint, onBallClick, arc, lastWishTimestamp }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!userLoc) return null;

  const { colors } = arc;
  const isCooldownActive = lastWishTimestamp ? (now - lastWishTimestamp < COOLDOWN_DURATION) : false;

  const getRelativePos = (lat: number, lng: number) => {
    const latDiff = lat - userLoc.lat;
    const lngDiff = lng - userLoc.lng;
    const yKm = latDiff * 111;
    const xKm = lngDiff * (111 * Math.cos(userLoc.lat * Math.PI / 180));
    const xPercent = 50 + (xKm / range) * 50;
    const yPercent = 50 - (yKm / range) * 50;
    return { x: xPercent, y: yPercent };
  };

  const formatCooldown = () => {
    if (!lastWishTimestamp) return "";
    const remaining = COOLDOWN_DURATION - (now - lastWishTimestamp);
    if (remaining <= 0) return "";

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${days}j : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  };

  return (
    <div 
      className={`relative w-full h-full overflow-hidden flex items-center justify-center`} 
      style={{ backgroundColor: colors.bg }}
    >
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-20 z-10">
        {Array.from({ length: 144 }).map((_, i) => (
          <div key={i} className="border-[0.5px]" style={{ borderColor: colors.grid || colors.main }}></div>
        ))}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-1/4 h-1/4 border rounded-full opacity-10" style={{ borderColor: colors.main }}></div>
        <div className="w-1/2 h-1/2 border rounded-full absolute opacity-10" style={{ borderColor: colors.main }}></div>
        <div className="w-3/4 h-3/4 border rounded-full absolute opacity-10" style={{ borderColor: colors.main }}></div>
      </div>

      <div className="absolute inset-0 scan-line z-20 pointer-events-none" style={{ 
        background: colors.scan 
      }}></div>

      {/* POINT ORANGE CENTRAL FIXE */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
        <div className="relative">
            <div className="absolute inset-0 rounded-full animate-ping scale-150 bg-orange-500/30"></div>
            <div className="w-4 h-4 bg-[#ff7700] rounded-full shadow-[0_0_12px_#ff7700] border border-white/30"></div>
        </div>
      </div>

      {/* OVERLAY HOLOGRAPHIQUE COOLDOWN */}
      {isCooldownActive && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <Hourglass size={48} className="text-cyan-400 opacity-60 drop-shadow-[0_0_10px_#22d3ee]" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-200/60 mb-2">Récupération d'Énergie</span>
              <div className="font-mono text-2xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest bg-black/30 px-6 py-2 rounded-lg border border-cyan-400/20">
                {formatCooldown()}
              </div>
              <span className="mt-3 text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Boules de pierre détectées</span>
            </div>
          </div>
        </div>
      )}

      {/* POINT BLEU (GUERRIER) - Désactivé si cooldown */}
      {!isCooldownActive && activeCharacterPoint && (() => {
        const { x, y } = getRelativePos(activeCharacterPoint.lat, activeCharacterPoint.lng);
        const distFromCenter = Math.sqrt(Math.pow(x-50, 2) + Math.pow(y-50, 2));
        if (distFromCenter > 50) return null;
        return (
          <div 
            className="absolute z-40 w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] border border-white/40 animate-pulse"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
          />
        );
      })()}

      {/* DRAGON BALLS - Désactivées si cooldown */}
      {!isCooldownActive && balls.map((ball) => {
        const { x, y } = getRelativePos(ball.lat, ball.lng);
        const distFromCenter = Math.sqrt(Math.pow(x-50, 2) + Math.pow(y-50, 2));
        if (distFromCenter > 50) return null;

        return (
          <button
            key={ball.id}
            onClick={(e) => { e.stopPropagation(); onBallClick(ball); }}
            className="absolute z-50 transition-all hover:scale-150"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-white/20 ${ball.found ? 'bg-gray-400 opacity-40 scale-75' : 'bg-orange-500 ping ring-2 ring-yellow-400'}`}>
              <span className="text-[8px] text-white font-black">{ball.stars}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default RadarUI;
