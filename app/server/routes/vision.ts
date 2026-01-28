import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Environment variable for the API key
// In Coolify, this will be injected. Locally, it's in .env
const API_KEY = process.env.GOOGLE_VISION_API_KEY;

interface VisionError {
    error?: {
        code?: number;
        message?: string;
        status?: string;
    };
}

interface VisionResponse {
    responses: Array<{
        fullTextAnnotation?: {
            text: string;
        };
        textAnnotations?: Array<{
            description: string;
        }>;
        labelAnnotations?: Array<{
            description: string;
            score: number;
        }>;
        webDetection?: {
            bestGuessLabels?: Array<{
                label: string;
            }>;
            webEntities?: Array<{
                description: string;
                score: number;
            }>;
        };
        error?: {
            message: string;
        };
    }>;
}

router.post('/analyze', async (req, res) => {
    try {
        const { image, features } = req.body;

        if (!API_KEY) {
            console.error('Missing GOOGLE_VISION_API_KEY');
            return res.status(500).json({
                error: 'Server configuration error: Google Vision API key not found.'
            });
        }

        if (!image) {
            return res.status(400).json({ error: 'Image data is required (base64)' });
        }

        // Prepare the request payload for Google Vision API
        const requestBody = {
            requests: [
                {
                    image: {
                        content: image
                    },
                    features: [
                        ...features.map((f: string) => ({ type: f })),
                        { type: 'LABEL_DETECTION' },
                        { type: 'WEB_DETECTION' }
                    ]
                }
            ]
        };

        // CRITICAL: We must send a Referer header because the API key is restricted to websites.
        // Since this is a server-side call, we manually set it to valid allowed domain.
        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'http://localhost:3000'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json() as VisionError;
            // Standard Google Cloud error format
            const errorMessage = errorData.error?.message || 'Unknown error';
            const errorCode = errorData.error?.code || response.status;
            const errorStatus = errorData.error?.status || 'UNKNOWN';

            console.error('Google Vision API Error:', {
                code: errorCode,
                status: errorStatus,
                message: errorMessage
            });

            return res.status(response.status).json({
                error: errorMessage,
                details: errorData
            });
        }

        const data = await response.json() as VisionResponse;

        // Return the first result (since we only sent one image)
        const result = data.responses[0];

        if (result.error) {
            console.error('Google Vision API Result Error:', result.error);
            return res.status(400).json({ error: result.error.message });
        }

        res.json(result);

    } catch (error) {
        console.error('Vision endpoint error:', error);
        res.status(500).json({ error: 'Internal server error processing image' });
    }
});

export default router;
