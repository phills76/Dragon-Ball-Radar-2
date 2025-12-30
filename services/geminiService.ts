
import { GoogleGenAI, Type } from "@google/genai";
import { DragonBall, UserLocation, RadarRange } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateValidCoordinates(
  userLoc: UserLocation,
  rangeKm: RadarRange
): Promise<DragonBall[]> {
  const isGlobal = rangeKm >= 10000;
  
  const prompt = `
    TASK: Find 7 real-world coordinates for a "treasure hunt" game.
    CENTER: Latitude ${userLoc.lat}, Longitude ${userLoc.lng}
    RADIUS: ${rangeKm}km
    ${isGlobal ? "MODE: GLOBAL SCAN. Choose 7 iconic public landmarks on different continents (e.g., Eiffel Tower, Statue of Liberty, Great Wall, Opera House, etc.) to represent a worldwide search." : ""}

    STRICT CONSTRAINTS:
    1. NO PRIVATE PROPERTY: Locations must be strictly public (public parks, city squares, public monuments, beaches, open hiking trails).
    2. NO WATER: Coordinates must be on dry land. Avoid the middle of lakes, rivers, or oceans.
    3. ACCESSIBILITY: The spot must be reachable by a person on foot without climbing fences or breaking laws.
    4. NO SENSITIVE AREAS: Avoid cemeteries, military bases, hospitals, or schools.
    5. VARIETY: Spread the 7 points across the ${rangeKm}km radius.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Detailed name of the public place" },
              lat: { type: Type.NUMBER, description: "Latitude" },
              lng: { type: Type.NUMBER, description: "Longitude" },
            },
            required: ["name", "lat", "lng"]
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.slice(0, 7).map((item: any, index: number) => ({
      id: index + 1,
      lat: item.lat,
      lng: item.lng,
      stars: index + 1,
      found: false,
      name: item.name
    }));
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return fallbackGeneration(userLoc, rangeKm);
  }
}

export async function relocateBall(
  userLoc: UserLocation,
  rangeKm: RadarRange,
  ballStars: number
): Promise<Partial<DragonBall>> {
  const prompt = `
    Find ONE new replacement coordinate.
    CENTER: Latitude ${userLoc.lat}, Longitude ${userLoc.lng}
    RADIUS: ${rangeKm}km
    
    STRICT RULES: 
    - MUST be a public space (Park, Square, Landmark).
    - MUST be on solid ground (No water).
    - MUST NOT be a private house or yard.
    - MUST be safe and legal to access.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
          },
          required: ["name", "lat", "lng"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return {
      lat: data.lat,
      lng: data.lng,
      name: data.name
    };
  } catch (error) {
    console.error("Gemini Relocation Error:", error);
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (rangeKm / 2);
    return {
      lat: userLoc.lat + (dist * Math.cos(angle)) / 111,
      lng: userLoc.lng + (dist * Math.sin(angle)) / (111 * Math.cos(userLoc.lat * Math.PI / 180)),
      name: `Point Public Recalibré`
    };
  }
}

function fallbackGeneration(userLoc: UserLocation, rangeKm: RadarRange): DragonBall[] {
  return Array.from({ length: 7 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = (Math.random() * rangeKm) * 0.8;
    const dLat = (dist * Math.cos(angle)) / 111;
    const dLng = (dist * Math.sin(angle)) / (111 * Math.cos(userLoc.lat * Math.PI / 180));
    return {
      id: i + 1,
      lat: userLoc.lat + dLat,
      lng: userLoc.lng + dLng,
      stars: i + 1,
      found: false,
      name: `Zone Verte Publique ${i + 1}`
    };
  });
}
