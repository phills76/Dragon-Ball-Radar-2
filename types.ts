
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

export type RadarDesign = 'capsule_corp' | 'red_ribbon' | 'daimao' | 'saiyan' | 'frieza' | 'cyborg' | 'buu' | 'god' | 'angels' | 'black' | 'tournament' | 'zeno';

export interface Character {
  name: string;
  image?: string;
  isMain: boolean;
}

export interface CharacterGroup {
  subTitle?: string;
  list: Character[];
}

export interface RadarArc {
  id: RadarDesign;
  label: string;
  saga: 1 | 2 | 3; // 1: DB, 2: DBZ, 3: DBS
  radius: number; // in km
  icon: string;
  characters: CharacterGroup[];
  colors: {
    main: string;
    glow: string;
    bg: string;
    grid: string;
    scan: string;
  };
}

export interface RadarState {
  range: number;
  customRange: number; 
  userLocation: UserLocation | null;
  dragonBalls: DragonBall[];
  activeCharacterPoint: { lat: number, lng: number } | null;
  isLoading: boolean;
  error: string | null;
  currentArcIndex: number; 
  unlockedArcIndexes: number[];
  foundCharacterNames: string[];
  currentAvatarId: string;
  unlockedFeatures: string[];
  wishesAvailable: number;
  lastWishTimestamp: number | null;
}
