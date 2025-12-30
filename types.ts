
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

export type RadarRange = 1 | 10 | 100 | 1000 | 40000; // 40000 is approx earth circum

export interface RadarState {
  range: RadarRange;
  userLocation: UserLocation | null;
  dragonBalls: DragonBall[];
  isLoading: boolean;
  error: string | null;
}
