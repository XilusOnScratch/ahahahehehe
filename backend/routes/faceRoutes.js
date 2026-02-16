// routes/faceRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const Profile = require('../models/profileModel');
const { extractFaceDescriptor, findMatchingFace } = require('../faceRec/faceRecognition');

const waitForConnection = (timeoutMs = 25000) => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) return Promise.reject(new Error('Database not configured'));
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs);
    mongoose.connection.once('connected', () => {
      clearTimeout(t);
      resolve();
    });
    mongoose.connect(uri).catch(reject);
  });
};

router.post('/match', upload.single('image'), async (req, res) => {
  try {
    console.log('Face match request received');
    console.log('Request file:', req.file ? 'present' : 'missing');

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No image provided' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size, 'bytes');
    const imageBuffer = req.file.buffer;

    const faceDescriptor = await extractFaceDescriptor(imageBuffer);

    await waitForConnection();
    const profiles = await Profile.find({});
    
    // Find matching face
    const matchingProfile = await findMatchingFace(faceDescriptor, profiles);
    
    if (matchingProfile) {
      // Check if matchingProfile has toObject method (Mongoose document)
      const profileData = matchingProfile.toObject 
        ? matchingProfile.toObject() 
        : matchingProfile;
      
      // Remove the face descriptor from the response
      delete profileData.faceDescriptor;
      
      res.json({ 
        success: true, 
        profile: profileData,
        confidence: matchingProfile.confidence || null
      });
    } else {
      res.json({ success: false, message: 'No matching profile found' });
    }
  } catch (error) {
    console.error('Error in face matching:', error);
    console.error('Error stack:', error.stack);

    let errorMessage = error.message;
    let statusCode = 400;

    if (error.message.includes('No face detected')) {
      errorMessage = 'No face detected in the image. Please ensure your face is clearly visible and try again.';
    } else if (error.message.includes('No image provided')) {
      errorMessage = 'No image provided. Please capture a photo first.';
    } else if (error.message.includes('connection timeout') || error.message.includes('buffering timed out')) {
      statusCode = 503;
      errorMessage = 'Database is reconnecting. Please try again in a few seconds.';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

module.exports = router;