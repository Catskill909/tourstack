
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY is not set. Gemini features will not work.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        responseMimeType: "application/json"
    }
});

router.post('/analyze', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
        }

        // Convert base64 to GenerativePart
        const imagePart = {
            inlineData: {
                data: image,
                mimeType: "image/jpeg", // Assuming JPEG for simplicity, or we can detect/pass MIME
            },
        };

        const prompt = `
    Analyze this museum artifact/image and provide a strict JSON response with the following fields:
    
    1. "description": A detailed, professional catalog description (2-3 sentences).
    2. "tags": An array of 5-10 relevant strings (single words or short phrases).
    3. "objects": An array of main objects identified in the image.
    4. "text": Any text visible in the image (OCR). If none, output null.
    5. "colors": An array of objects with "name" (string) and "hex" (string) for the dominant colors.
    6. "suggestedTitle": A short, catchy title for the image.
    7. "mood": The artistic mood (e.g., "Peaceful", "Melancholic").
    8. "lighting": Lighting style (e.g., "Natural", "Studio").
    9. "artStyle": The artistic style (e.g., "Modernism", "Realism").
    10. "estimatedLocation": Predicted real-world location context (e.g., "Paris, France" or "Indoor Museum").

    Ensure valid JSON output.
    `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Parse JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini JSON response:", text);
            // Fallback or retry logic could go here, but for now return raw text wrapped
            return res.status(500).json({ error: "Failed to parse AI response", raw: text });
        }

        res.json(data);

    } catch (error: any) {
        console.error('Gemini API Error:', error);
        res.status(500).json({
            error: 'Failed to analyze image with Gemini',
            details: error.message
        });
    }
});

// Analyze text from documents
router.post('/analyze-text', async (req, res) => {
    try {
        const { text, prompt, tool } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No text data provided' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
        }

        // Build a structured prompt based on the tool type
        let systemPrompt = '';
        switch (tool) {
            case 'summarize':
                systemPrompt = `Analyze the following document and provide a concise 2-3 sentence summary suitable for a museum exhibit label. Return ONLY a JSON object with a single "result" field containing the summary string.

Document:
${text}`;
                break;
            case 'facts':
                systemPrompt = `Extract key facts from the following document: dates, names, locations, measurements, and important details. Return ONLY a JSON object with a single "result" field containing an array of fact strings.

Document:
${text}`;
                break;
            case 'faq':
                systemPrompt = `Generate 5 FAQ questions that a museum visitor might ask about this content, with clear answers. Return ONLY a JSON object with a single "result" field containing an array of objects, each with "question" and "answer" fields.

Document:
${text}`;
                break;
            case 'tags':
                systemPrompt = `Generate 5-10 relevant keyword tags for cataloging and search purposes. Return ONLY a JSON object with a single "result" field containing an array of tag strings.

Document:
${text}`;
                break;
            default:
                systemPrompt = `${prompt}

Return your response as a JSON object with a single "result" field.

Document:
${text}`;
        }

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const responseText = response.text();

        // Parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse Gemini JSON response:", responseText);
            // Try to extract result from the response
            return res.json({ result: responseText });
        }

        res.json(data);

    } catch (error: any) {
        console.error('Gemini Text Analysis Error:', error);
        res.status(500).json({
            error: 'Failed to analyze text with Gemini',
            details: error.message
        });
    }
});

// Analyze floor plan image for auto-marker placement
router.post('/analyze-floorplan', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
        }

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: "image/jpeg",
            },
        };

        const prompt = `You are analyzing a museum or building floor plan image. Identify all distinct rooms, exhibits, areas of interest, entrances, exits, stairs, elevators, restrooms, and notable features visible on this floor plan.

For each area you identify, provide:
1. A descriptive label (e.g. "Main Gallery", "Gift Shop", "Restroom", "East Wing Entrance")
2. The approximate center position as x,y percentages where 0,0 is top-left and 100,100 is bottom-right
3. A suggested icon type from this list — pick the BEST match:
   - "pin" for exhibits, galleries, display areas
   - "info" for information desks, welcome areas
   - "number" for numbered rooms or sequenced stops
   - "star" for highlights, featured areas, must-see spots
   - "dot" for general points of interest
   - "accessibility" for wheelchair access, accessible routes, ramps
   - "restroom" for bathrooms, washrooms, toilets
   - "stairs" for staircases, steps between levels
   - "elevator" for elevators, lifts
   - "exit" for exits, entrances, emergency exits, doors
   - "cafe" for cafés, restaurants, food courts, water fountains
   - "gift-shop" for gift shops, museum stores, retail
   - "ticket" for ticket counters, admissions, box office
   - "camera" for photo spots, scenic viewpoints, photo-allowed areas
   - "audio-guide" for audio guide stations, listening points
   - "parking" for parking areas, garages
4. A suggested category: "exhibit", "facility", "entrance", or "navigation"

Return ONLY a JSON object with this exact structure:
{
  "markers": [
    {
      "label": "string - descriptive name",
      "x": number (0-100 percentage from left),
      "y": number (0-100 percentage from top),
      "icon": "pin" | "dot" | "number" | "star" | "info" | "accessibility" | "restroom" | "stairs" | "elevator" | "exit" | "cafe" | "gift-shop" | "ticket" | "camera" | "audio-guide" | "parking",
      "category": "exhibit" | "facility" | "entrance" | "navigation",
      "description": "string - brief 1-2 sentence visitor description of this area"
    }
  ],
  "floorName": "string - suggested name for this floor based on any visible text or context",
  "summary": "string - brief description of the overall floor plan layout"
}

Be thorough — identify ALL distinct areas, not just the obvious ones. Aim for 5-20 markers depending on the complexity of the floor plan. Place markers at the visual center of each identified area.`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini floor plan response:", text);
            return res.status(500).json({ error: "Failed to parse AI response", raw: text });
        }

        res.json(data);

    } catch (error: any) {
        console.error('Gemini Floor Plan Analysis Error:', error);
        res.status(500).json({
            error: 'Failed to analyze floor plan with Gemini',
            details: error.message
        });
    }
});

// Generate info text for markers
router.post('/generate-marker-info', async (req, res) => {
    try {
        const { image, markers, language } = req.body;

        if (!markers || !Array.isArray(markers) || markers.length === 0) {
            return res.status(400).json({ error: 'No markers provided' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
        }

        const markerList = markers.map((m: { id: string; label: string; category?: string }, i: number) =>
            `${i + 1}. "${m.label}" (${m.category || 'unknown'} area)`
        ).join('\n');

        let prompt: string;
        const langName = language || 'English';

        if (image) {
            const imagePart = {
                inlineData: {
                    data: image,
                    mimeType: "image/jpeg",
                },
            };

            prompt = `You are writing visitor-friendly descriptions for a museum floor plan. Here is the floor plan image and a list of marked locations on it.

Locations:
${markerList}

For each location, write a brief, engaging 1-2 sentence description that would help a museum visitor understand what they'll find there. Write in ${langName}.

Return ONLY a JSON object:
{
  "descriptions": [
    {
      "id": "marker id exactly as provided",
      "infoText": "visitor-friendly description in ${langName}"
    }
  ]
}`;

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                return res.status(500).json({ error: "Failed to parse AI response", raw: text });
            }
            return res.json(data);
        } else {
            prompt = `You are writing visitor-friendly descriptions for museum locations. Here are the named locations:

${markerList}

For each location, write a brief, engaging 1-2 sentence description that would help a museum visitor understand what they'll find there. Write in ${langName}.

Return ONLY a JSON object:
{
  "descriptions": [
    {
      "id": "marker id exactly as provided",
      "infoText": "visitor-friendly description in ${langName}"
    }
  ]
}`;

            const markerIds = markers.map((m: { id: string }) => m.id);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            let data;
            try {
                data = JSON.parse(text);
                // Ensure IDs match what was sent
                if (data.descriptions) {
                    data.descriptions = data.descriptions.map((d: { id: string; infoText: string }, i: number) => ({
                        ...d,
                        id: markerIds[i] || d.id,
                    }));
                }
            } catch (e) {
                return res.status(500).json({ error: "Failed to parse AI response", raw: text });
            }
            return res.json(data);
        }

    } catch (error: any) {
        console.error('Gemini Marker Info Generation Error:', error);
        res.status(500).json({
            error: 'Failed to generate marker descriptions',
            details: error.message
        });
    }
});

export default router;
