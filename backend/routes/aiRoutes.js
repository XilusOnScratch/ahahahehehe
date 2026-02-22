const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const router = express.Router();

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/analyze-image', async (req, res) => {
    const { base64Image } = req.body;

    if (!base64Image) {
        console.error('AI Proxy: No image data received');
        return res.status(400).json({ error: 'base64Image is required' });
    }

    try {
        console.log('AI Proxy: Sending request to Gemini using @google/genai SDK...');

        // Remove data URL prefix if present (data:image/jpeg;base64,)
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

        // Use the models.generateContent method with a stable model
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Changed from gemini-2.0-flash-exp
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: "Does this image contain an object shaped like a butterfly? If yes, respond with 'yes'. If no, identify the main object in the image and respond with 'no: a/an [object name]'. If you see a girl, respond with 'no: an ahana'."
                        },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        });

        // Access the text directly from the response object
        let text = response.text.toLowerCase().trim();
        console.log('AI Proxy: Gemini response:', text);

        if (text.includes('no:')) {
            const objectName = text.split('no:')[1].trim().replace(/\.$/, '');
            text = `i see ${objectName}. not exactly what ur looking for tho...`;
        }

        res.json({ analysisResult: text });
    } catch (error) {
        console.error('Gemini AI Error:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Error stack:', error.stack);
        }

        res.status(500).json({
            error: 'Failed to communicate with Gemini AI',
            details: error.message
        });
    }
});

module.exports = router;