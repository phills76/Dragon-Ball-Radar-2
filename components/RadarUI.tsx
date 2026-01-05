
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

  const designs: Record<RadarDesign, { main: string; glow: string; bg: string | null }> = {
    bulma: { 
      main: '#AAFFAA', 
      glow: 'rgba(170, 255, 170, 0.63)',
      bg: '#185826' 
    },
    capsule: { 
      main: '#3b82f6', 
      glow: 'rgba(59, 130, 246, 0.3)',
      bg: null
    },
    red_ribbon: { 
      main: '#ef4444', 
      glow: 'rgba(239, 68, 68, 0.4)',
      bg: '#310000' 
    },
    saiyan: { 
      main: '#fbbf24', 
      glow: 'rgba(251, 191, 36, 0.3)',
      bg: null
    },
    namek: { 
      main: '#4ade80', 
      glow: 'rgba(74, 222, 128, 0.3)',
      bg: null
    },
    frieza: { 
      main: '#a855f7', 
      glow: 'rgba(168, 85, 247, 0.4)',
      bg: '#1e0030'
    },
    cell: { 
      main: '#4ade80', 
      glow: 'rgba(74, 222, 128, 0.3)',
      bg: '#052c16'
    },
    majin: { 
      main: '#ec4899', 
      glow: 'rgba(236, 72, 153, 0.4)',
      bg: '#33001a'
    },
    hakaishin: { 
      main: '#a855f7', 
      glow: 'rgba(168, 85, 247, 0.6)',
      bg: '#12001f' 
    },
    angel: { 
      main: '#38bdf8', 
      glow: 'rgba(56, 189, 248, 0.5)',
      bg: '#001a2c' 
    },
    zeno: { 
      main: '#f472b6', 
      glow: 'rgba(244, 114, 182, 0.6)',
      bg: '#1a001a' 
    }
  };

  const currentDesign = designs[design] || designs.bulma;

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
    <div 
      className={`relative w-full h-full overflow-hidden flex items-center justify-center ${!currentDesign.bg ? 'radar-bg' : ''}`} 
      style={{ 
        backgroundColor: currentDesign.bg || undefined,
        '--radar-color': currentDesign.main 
      } as any}
    >
      {/* Grille de détection */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-20 z-10">
        {Array.from({ length: 144 }).map((_, i) => (
          <div key={i} className="border-[0.5px]" style={{ borderColor: currentDesign.main }}></div>
        ))}
      </div>
      
      {/* Cercles concentriques */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-1/4 h-1/4 border rounded-full opacity-10" style={{ borderColor: currentDesign.main }}></div>
        <div className="w-1/2 h-1/2 border rounded-full absolute opacity-10" style={{ borderColor: currentDesign.main }}></div>
        <div className="w-3/4 h-3/4 border rounded-full absolute opacity-10" style={{ borderColor: currentDesign.main }}></div>
      </div>

      {/* Ligne de scan rotative */}
      <div className="absolute inset-0 scan-line z-20 pointer-events-none" style={{ 
        background: `linear-gradient(to right, transparent 50%, ${currentDesign.glow} 100%)` 
      }}></div>

      {/* Position de l'utilisateur */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
        <div className="relative">
            <div className={`absolute inset-0 rounded-full animate-ping scale-150 ${design === 'bulma' ? 'bg-[#ff7700]/30' : 'bg-white/20'}`}></div>
            {design === 'bulma' ? (
              <div className="w-4 h-4 bg-[#ff7700] rounded-full shadow-[0_0_12px_#ff7700] border border-white/30"></div>
            ) : (
              <Navigation2 className="text-white w-6 h-6 fill-white drop-shadow-[0_0_8px_white]" />
            )}
        </div>
      </div>

      {/* Dragon Balls détectées */}
      {balls.map((ball) => {
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