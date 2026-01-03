
export interface DragonBall {
  id: number;
  lat: number;
  lng: number;
  stars: number;
  found: boolean;
  name: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

export type RadarRange = number;
export type RadarDesign = 'bulma' | 'capsule' | 'saiyan' | 'namek';

export interface RadarState {
  range: RadarRange;
  userLocation: UserLocation | null;
  scanCenter: UserLocation | null;
  dragonBalls: DragonBall[];
  isLoading: boolean;
  error: string | null;
  design: RadarDesign;
  collectionRadius: number; 
  unlockedFeatures: string[]; 
  currentRace: string;
}
