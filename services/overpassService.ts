
import { DragonBall, UserLocation } from "../types";

/**
 * Service pour interroger l'API Overpass d'OpenStreetMap.
 * Permet de trouver des lieux publics réels et des zones piétonnes.
 */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/**
 * Génère 7 emplacements de boules de cristal en utilisant l'API Overpass.
 */
export async function generateValidCoordinates(
  userLoc: UserLocation,
  rangeKm: number
): Promise<DragonBall[]> {
  const isGlobal = rangeKm >= 20000;
  const isLarge = rangeKm >= 100;

  try {
    let locations: { lat: number; lng: number; name: string }[] = [];

    if (isGlobal) {
      // Mode Planétaire : On choisit 7 points iconiques mondiaux pour garantir la terre ferme
      locations = await getGlobalIconicLocations();
    } else if (isLarge) {
      // Mode Large (100km - 10000km) : On échantillonne des points aléatoires et on les "aimante"
      locations = await getSampledLocations(userLoc, rangeKm);
    } else {
      // Mode Local (1km - 10km) : Requête Overpass directe
      locations = await fetchFromOverpass(userLoc, rangeKm);
    }

    // Si on n'a pas assez de points, on complète avec du fallback sécurisé
    if (locations.length < 7) {
      const fallback = fallbackGeneration(userLoc, rangeKm, 7 - locations.length);
      locations = [...locations, ...fallback];
    }

    // On s'assure d'avoir exactement 7 points et on les transforme en DragonBall
    return locations.slice(0, 7).map((loc, index) => ({
      id: index + 1,
      lat: loc.lat,
      lng: loc.lng,
      stars: index + 1,
      found: false,
      name: loc.name
    }));

  } catch (error) {
    console.error("Overpass Service Error:", error);
    return fallbackGeneration(userLoc, rangeKm, 7).map((loc, index) => ({
      id: index + 1,
      ...loc,
      stars: index + 1,
      found: false
    }));
  }
}

/**
 * Requête directe à Overpass pour les zones locales.
 */
async function fetchFromOverpass(userLoc: UserLocation, rangeKm: number): Promise<{ lat: number; lng: number; name: string }[]> {
  const radius = rangeKm * 1000;
  // Requête ciblant parcs, monuments, places, fontaines et zones piétonnes, en excluant l'eau
  const query = `
    [out:json][timeout:25];
    (
      node["leisure"~"park|playground|garden"](around:${radius}, ${userLoc.lat}, ${userLoc.lng});
      node["amenity"~"place_of_worship|fountain|townhall|library"](around:${radius}, ${userLoc.lat}, ${userLoc.lng});
      node["historic"~"monument|memorial|statue"](around:${radius}, ${userLoc.lat}, ${userLoc.lng});
      node["tourism"~"viewpoint|attraction|museum"](around:${radius}, ${userLoc.lat}, ${userLoc.lng});
      way["highway"~"pedestrian|footway|living_street"](around:${radius}, ${userLoc.lat}, ${userLoc.lng});
    );
    out center 50;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`
  });

  if (!response.ok) throw new Error("Overpass API unreachable");

  const data = await response.json();
  const elements = data.elements || [];

  return elements
    .map((el: any) => ({
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon,
      name: el.tags?.name || el.tags?.amenity || el.tags?.leisure || "Lieu Public"
    }))
    .sort(() => Math.random() - 0.5)
    .slice(0, 7);
}

/**
 * Échantillonnage pour les grandes distances.
 */
async function getSampledLocations(userLoc: UserLocation, rangeKm: number): Promise<{ lat: number; lng: number; name: string }[]> {
  const points: { lat: number; lng: number; name: string }[] = [];
  
  // On tente de trouver 7 points en "snappant" des coordonnées aléatoires
  for (let i = 0; i < 15 && points.length < 7; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * rangeKm;
    const dLat = (dist * Math.cos(angle)) / 111;
    const dLng = (dist * Math.sin(angle)) / (111 * Math.cos(userLoc.lat * Math.PI / 180));
    
    const randomLat = userLoc.lat + dLat;
    const randomLng = userLoc.lng + dLng;

    try {
      // On cherche le lieu public le plus proche (rayon 5km) de ce point aléatoire
      const snapQuery = `
        [out:json][timeout:10];
        (
          node["leisure"](around:5000, ${randomLat}, ${randomLng});
          node["amenity"](around:5000, ${randomLat}, ${randomLng});
          way["highway"~"pedestrian|footway"](around:5000, ${randomLat}, ${randomLng});
        );
        out center 1;
      `;
      const res = await fetch(OVERPASS_URL, { method: "POST", body: `data=${encodeURIComponent(snapQuery)}` });
      const data = await res.json();
      if (data.elements && data.elements.length > 0) {
        const el = data.elements[0];
        points.push({
          lat: el.lat || el.center?.lat,
          lng: el.lon || el.center?.lon,
          name: el.tags?.name || "Point d'Intérêt"
        });
      }
    } catch (e) {
      // Skip error and continue sampling
    }
  }
  return points;
}

/**
 * Points iconiques pour le mode planétaire (garantit d'être sur terre).
 */
async function getGlobalIconicLocations(): Promise<{ lat: number; lng: number; name: string }[]> {
  const landmarks = [
    { name: "Tour Eiffel, Paris", lat: 48.8584, lng: 2.2945 },
    { name: "Statue de la Liberté, NY", lat: 40.6892, lng: -74.0445 },
    { name: "Opéra de Sydney", lat: -33.8568, lng: 151.2153 },
    { name: "Grande Muraille, Chine", lat: 40.4319, lng: 116.5704 },
    { name: "Christ Rédempteur, Rio", lat: -22.9519, lng: -43.2105 },
    { name: "Pyramides de Gizeh", lat: 29.9792, lng: 31.1342 },
    { name: "Mont Fuji, Japon", lat: 35.3606, lng: 138.7274 },
    { name: "Colisée, Rome", lat: 41.8902, lng: 12.4922 },
    { name: "Machu Picchu, Pérou", lat: -13.1631, lng: -72.5450 },
    { name: "Taj Mahal, Inde", lat: 27.1751, lng: 78.0421 }
  ];
  return landmarks.sort(() => Math.random() - 0.5).slice(0, 7);
}

/**
 * Générateur de secours (fallback) si l'API échoue ou ne trouve rien.
 */
function fallbackGeneration(userLoc: UserLocation, rangeKm: number, count: number): { lat: number; lng: number; name: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = (Math.random() * rangeKm) * 0.8;
    const dLat = (dist * Math.cos(angle)) / 111;
    const dLng = (dist * Math.sin(angle)) / (111 * Math.cos(userLoc.lat * Math.PI / 180));
    return {
      lat: userLoc.lat + dLat,
      lng: userLoc.lng + dLng,
      name: `Zone Publique Détectée ${i + 1}`
    };
  });
}
