
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY is not set. Gemini features will not work.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
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

export default router;
