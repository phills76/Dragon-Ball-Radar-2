
import { GoogleGenAI, Type } from "@google/genai";
import { DragonBall, UserLocation, RadarRange } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateValidCoordinates(
  userLoc: UserLocation,
  rangeKm: RadarRange
): Promise<DragonBall[]> {
  const prompt = `
    Find 7 safe, public, and accessible locations (parks, public squares, landmarks, nature reserves) 
    within a ${rangeKm}km radius of the coordinates: Latitude ${userLoc.lat}, Longitude ${userLoc.lng}.
    
    IMPORTANT RULES:
    1. The locations MUST be on land (not in oceans, lakes, or large rivers).
    2. The locations MUST be public (avoid private residences, private gardens, or industrial restricted zones).
    3. Provide accurate GPS coordinates for each.
    4. Distribute them somewhat randomly within the ${rangeKm}km radius.
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
              name: { type: Type.STRING, description: "Description of the place (e.g., Central Park Bench)" },
              lat: { type: Type.NUMBER, description: "Latitude coordinate" },
              lng: { type: Type.NUMBER, description: "Longitude coordinate" },
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
    // Fallback: Random generation logic if AI fails (basic bounding box)
    return Array.from({ length: 7 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * rangeKm;
      // Very rough approx: 1 deg lat is ~111km
      const dLat = (dist * Math.cos(angle)) / 111;
      const dLng = (dist * Math.sin(angle)) / (111 * Math.cos(userLoc.lat * Math.PI / 180));
      return {
        id: i + 1,
        lat: userLoc.lat + dLat,
        lng: userLoc.lng + dLng,
        stars: i + 1,
        found: false,
        name: `Inconnue - Zone ${i + 1}`
      };
    });
  }
}
