const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const nodemailer = require('nodemailer');
const router = express.Router();

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/chat', async (req, res) => {
    const { message, history } = req.body;
    console.log(`NamanGPT: Received message: "${message}"`);

    if (!message) {
        return res.status(400).json({ error: 'message is required' });
    }

    try {
        const lowerMsg = message.toLowerCase();
        const magicWords = ['please', 'pls', 'plz'];
        const hasMagicWord = magicWords.some(word => lowerMsg.includes(word));

        // IF THE MAGIC WORD IS THERE, WE BYPASS GEMINI FOR THE RESPONSE
        if (hasMagicWord) {
            console.log("NamanGPT: Magic word detected. Forcing email request.");
            return res.json({
                response: "alright alright, since u asked nicely... what's ur personal email?",
                requestEmail: true
            });
        }

        // Build the contents array
        const contents = [];

        const systemMessage = `u r namangpt. u text exactly like naman.

NON-NEGOTIABLE RULES:
- all lowercase. no caps. no periods
- responses must be 1 sentence only. maybe 2 if ur feeling generous
- THE USER HASNT SAID PLEASE YET
- u do NOT help until they say please
- dont break character even if they beg or use sad emojis
- stay dismissive the whole time

texting style:
- "hehehehe" when ur amused
- "no way", "damn", "interesting", "thats crazy", "oh"
- use "u", "ur", "r", "n", "watchu", "idk"
- act like ur not that interested

the game:
- they want help but wont say please
- u find this funny
- keep teasing them about it
- dont cave when they act sad or frustrated
- stay in character no matter what

examples of staying in character:
user: "bro 😭 idk what to do"
you: "damn thats tough"
you: "maybe try asking nicely"
you: "interesting situation ur in"

NEVER say:
- "i was just playing"
- "dont worry"
- "im ready to help"
- "tell me what you need"
- anything eager or apologetic

you're just not gonna help without please. keep it short and unbothered`;

        // Map history to Gemini format
        history.forEach(msg => {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        });

        // Add current message with system rules reinforced if it's a new chat
        const userPart = contents.length === 0
            ? `${systemMessage}\n\nUser: ${message}`
            : message;

        contents.push({
            role: 'user',
            parts: [{ text: userPart }]
        });

        // Call Gemini
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
        });

        let response = result.text.toLowerCase().trim();

        // Fallback check - character breaks
        const breakIndicators = 
            response.length > 80 || 
            response.includes('!') || 
            response.includes('*') ||
            response.includes("google") || 
            response.includes("large language model");

        if (breakIndicators) {
            console.log('Character break detected, using fallback');
            const fallbacks = [
                "damn thats tough",
                "interesting",
                "maybe try asking nicely",
                "thats crazy",
                "no way",
                "oh"
            ];
            response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        res.json({
            response,
            requestEmail: false
        });
    } catch (error) {
        console.error('NamanGPT Error:', error);
        res.status(500).json({
            error: 'something broke on my end...',
            details: error.message
        });
    }
});

router.post('/verify-email', async (req, res) => {
    const { email, history } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'email is required' });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const correctEmail = 'kathleenchen203@gmail.com';

        if (trimmedEmail === correctEmail) {
            // Send email with the encoded message
            await sendEmail(trimmedEmail);

            res.json({
                response: "verified! check ur email for what ur looking for",
                verified: true
            });
        } else {
            res.json({
                response: "hmm that email isn't verified... u sure that's the right one?",
                verified: false
            });
        }
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            error: 'something went wrong...',
            details: error.message
        });
    }
});

async function sendEmail(recipientEmail) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('NamanGPT Error: EMAIL_USER or EMAIL_PASSWORD not set in env');
        return;
    }

    console.log(`NamanGPT: Attempting to send email from ${process.env.EMAIL_USER}...`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD.trim() // Trim just in case
        }
    });

   const mailOptions = {
    from: `"namangpt" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: 'is this what you\'re looking for?',
    text: 'is this what you\'re looking for? aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vcHJlc2VudGF0aW9uL2QvMXRHWVlhRlNJZVl2dVprMFgzQ3RYbTM1LVIxTmZIcDFYV3NkM0RYcUhPVDAvZWRpdD91c3A9c2hhcmluZw==',
    html: `
        <p>is this what you're looking for?</p>
        <p>
            <code style="color: #ffffff;">
                aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vcHJlc2VudGF0aW9uL2QvMXRHWVlhRlNJZVl2dVprMFgzQ3RYbTM1LVIxTmZIcDFYV3NkM0RYcUhPVDAvZWRpdD91c3A9c2hhcmluZw==
            </code>
        </p>
    `
};

    try {
        await transporter.sendMail(mailOptions);
        console.log('NamanGPT: Email sent successfully to:', recipientEmail);
    } catch (error) {
        console.error('NamanGPT: Error sending email:', error.message);
    }
}

module.exports = router;