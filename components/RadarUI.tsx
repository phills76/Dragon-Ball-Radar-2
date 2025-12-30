
import React from 'react';
import { RadarRange, DragonBall, UserLocation, RadarDesign } from '../types';
import { Navigation2 } from 'lucide-react';

interface RadarUIProps {
  range: number; 
  userLoc: UserLocation | null;
  balls: DragonBall[];
  onBallClick: (ball: DragonBall) => void;
  design: RadarDesign;
}

const RadarUI: React.FC<RadarUIProps> = ({ range, userLoc, balls, onBallClick, design }) => {
  if (!userLoc) return null;

  const colors = {
    bulma: { main: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' }, // Vert classique
    capsule: { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' }, // Bleu High-tech
    saiyan: { main: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)' }, // Orange/Or
    namek: { main: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' }  // Violet/Bleu Namek
  }[design] || { main: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' };

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
    <div className="relative w-full h-full radar-bg" style={{ '--radar-color': colors.main } as any}>
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-20">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="border-[0.5px]" style={{ borderColor: colors.main }}></div>
        ))}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1/4 h-1/4 border rounded-full opacity-20" style={{ borderColor: colors.main }}></div>
        <div className="w-1/2 h-1/2 border rounded-full absolute opacity-20" style={{ borderColor: colors.main }}></div>
        <div className="w-3/4 h-3/4 border rounded-full absolute opacity-20" style={{ borderColor: colors.main }}></div>
      </div>

      <div className="absolute inset-0 scan-line z-10 pointer-events-none" style={{ 
        background: `linear-gradient(to right, transparent 50%, ${colors.glow} 100%)` 
      }}></div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping scale-150"></div>
            <Navigation2 className="text-white w-6 h-6 fill-white drop-shadow-[0_0_8px_white]" />
        </div>
      </div>

      {balls.map((ball) => {
        const { x, y } = getRelativePos(ball.lat, ball.lng);
        if (x < 0 || x > 100 || y < 0 || y > 100) return null;

        return (
          <button
            key={ball.id}
            onClick={(e) => { e.stopPropagation(); onBallClick(ball); }}
            className="absolute z-30 transition-all hover:scale-150"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shadow-lg ${ball.found ? 'bg-gray-400 opacity-40 scale-75' : 'bg-orange-500 ping ring-2 ring-yellow-400'}`}>
              <span className="text-[7px] text-white font-bold">{ball.stars}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default RadarUI;
