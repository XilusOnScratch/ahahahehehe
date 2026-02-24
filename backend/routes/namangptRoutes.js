require('dotenv').config();
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

// Direct debug route - hit this at https://your-server.render.com/api/namangpt/debug-email
router.get('/debug-email', async (req, res) => {
    console.log('--- EXPLICIT DEBUG ROUTE HIT ---');
    try {
        const result = await sendEmail('kathleenchen203@gmail.com');
        res.json({
            message: result ? "Success! Check the email." : "Failed. Check Render logs.",
            env_user_exists: !!process.env.EMAIL_USER,
            env_pass_exists: !!process.env.EMAIL_PASSWORD
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/verify-email', async (req, res) => {
    const { email, history } = req.body;
    console.log('NamanGPT: Verifying email:', email);

    if (!email) {
        return res.status(400).json({ error: 'email is required' });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const correctEmail = 'ahana.virmani@gmail.com';

        console.log(`Comparing "${trimmedEmail}" with "${correctEmail}"`);

        if (trimmedEmail === correctEmail) {
            console.log('Email match! Calling sendEmail...');
            const sent = await sendEmail(trimmedEmail);
            console.log('sendEmail returned:', sent);

            if (sent) {
                res.json({
                    response: "verified! check ur email for what ur looking for",
                    verified: true
                });
            } else {
                res.json({
                    response: "i tried sending it but something broke... maybe try again later?",
                    verified: false
                });
            }
        } else {
            console.log('Email mismatch.');
            res.json({
                response: "hmm that email isn't verified... u sure that's the right one?",
                verified: false
            });
        }
    } catch (error) {
        console.error('Email verification route error:', error);
        res.status(500).json({
            error: 'something went wrong...',
            details: error.message
        });
    }
});

async function sendEmail(recipientEmail) {
    console.log('--- STARTING SEND EMAIL (PORT 587/STARTTLS) ---');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Recipient:', recipientEmail);

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use false for STARTTLS (Port 587)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.trim() : ''
        },
        tls: {
            rejectUnauthorized: false // Helps avoid handshake issues in cloud environments
        },
        connectionTimeout: 15000,
        debug: true,
        logger: true
    });

    try {
        console.log('Attempting SMTP handshake...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: 'is this what you\'re looking for?',
            text: 'is this what you\'re looking for? aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vcHJlc2VudGF0aW9uL2QvMXRHWVlhRlNJZVl2dVprMFgzQ3RYbTM1LVIxTmZIcDFYV3NkM0RYcUhPVDAvZWRpdD91c3A9c2hhcmluZw==',
            html: `
                <div style="font-family: monospace; padding: 20px; background-color: #f5f5f5;">
                    <p>is this what you're looking for?</p>
                    <p style="word-break: break-all; background-color: #333; color: #fff; padding: 10px; border-radius: 5px;">
                        aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vcHJlc2VudGF0aW9uL2QvMXRHWVlhRlNJZVl2dVprMFgzQ3RYbTM1LVIxTmZIcDFYV3NkM0RYcUhPVDAvZWRpdD91c3A9c2hhcmluZw==
                    </p>
                    <p style="font-size: 0.8em; color: #666;">- naman</p>
                </div>
            `
        });
        console.log('Email successfully sent! ID:', info.messageId);
        return true;
    } catch (e) {
        console.log('--- EMAIL SENDING FAILED ---');
        console.error('Error Code:', e.code);
        console.error('Error Message:', e.message);
        return false;
    }
}

module.exports = router;