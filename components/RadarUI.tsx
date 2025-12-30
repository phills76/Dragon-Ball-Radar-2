
import React from 'react';
import { RadarRange, DragonBall, UserLocation } from '../types';
import { Navigation2 } from 'lucide-react';

interface RadarUIProps {
  range: number; 
  userLoc: UserLocation | null;
  balls: DragonBall[];
  onBallClick: (ball: DragonBall) => void;
}

const RadarUI: React.FC<RadarUIProps> = ({ range, userLoc, balls, onBallClick }) => {
  if (!userLoc) return null;

  const getRelativePos = (lat: number, lng: number) => {
    const latDiff = lat - userLoc.lat;
    const lngDiff = lng - userLoc.lng;
    const yKm = latDiff * 111;
    const xKm = lngDiff * (111 * Math.cos(userLoc.lat * Math.PI / 180));
    const xPercent = 50 + (xKm / range) * 50;
    const yPercent = 50 - (yKm / range) * 50;
    return { x: xPercent, y: yPercent };
  };

  return (
    <div className="relative w-full h-full radar-bg">
      {/* Grille Verte */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-30">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-emerald-500/50"></div>
        ))}
      </div>
      
      {/* Cercles Concentriques */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1/4 h-1/4 border border-emerald-500/20 rounded-full"></div>
        <div className="w-1/2 h-1/2 border border-emerald-500/20 rounded-full absolute"></div>
        <div className="w-3/4 h-3/4 border border-emerald-500/20 rounded-full absolute"></div>
      </div>

      {/* Ligne de Scan */}
      <div className="absolute inset-0 scan-line z-10 pointer-events-none"></div>

      {/* Icône Joueur */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping scale-150"></div>
            <Navigation2 className="text-white w-6 h-6 fill-white drop-shadow-[0_0_8px_white]" />
        </div>
      </div>

      {/* Dragon Balls */}
      {balls.map((ball) => {
        const { x, y } = getRelativePos(ball.lat, ball.lng);
        if (x < 0 || x > 100 || y < 0 || y > 100) return null;

        return (
          <button
            key={ball.id}
            onClick={(e) => {
                e.stopPropagation();
                onBallClick(ball);
            }}
            className="absolute z-30 transition-all hover:scale-150 group"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] ${ball.found ? 'bg-yellow-100 opacity-40 scale-75' : 'bg-orange-500 ping ring-2 ring-yellow-400'}`}>
              <span className="text-[7px] text-white font-bold">{ball.stars}</span>
            </div>
          </button>
        );
      })}

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-40">
        <span className="bg-black/40 px-3 py-0.5 rounded-full text-[9px] font-mono text-emerald-400/80 tracking-tighter border border-emerald-500/20">
          SCAN: {range.toFixed(range < 1 ? 2 : 1)} KM
        </span>
      </div>
    </div>
  );
};

export default RadarUI;
