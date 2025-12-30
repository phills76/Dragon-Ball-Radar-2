
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

export type RadarRange = number; // Changé de type fixe à number pour la zone personnalisée
export type RadarDesign = 'bulma' | 'capsule' | 'saiyan' | 'namek';

export interface RadarState {
  range: RadarRange;
  userLocation: UserLocation | null;
  scanCenter: UserLocation | null;
  dragonBalls: DragonBall[];
  isLoading: boolean;
  error: string | null;
  design: RadarDesign;
  collectionRadius: number; // en km (0.05 = 50m)
  unlockedFeatures: string[]; // 'scouter', 'custom_zone'
  currentRace: string;
}
