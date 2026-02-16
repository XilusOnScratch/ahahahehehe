// Load environment variables FIRST
require('dotenv').config();

const express = require('express');

// Load TensorFlow.js Node backend - MUST be imported before other TensorFlow libraries
// This ensures the native C++ bindings are used for performance
try {
  require('@tensorflow/tfjs-node');
  console.log('✅ TensorFlow.js Node backend loaded successfully');
} catch (error) {
  console.warn('⚠️ Failed to load @tensorflow/tfjs-node:', error.message);
  console.warn('Falling back to pure JavaScript backend (slower).');
  console.warn('To fix: ensure @tensorflow/tfjs-node is installed and Visual Studio Build Tools are available.');
}

// Log memory usage
const used = process.memoryUsage();
console.log('Initial Memory Usage:');
for (let key in used) {
  console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
}
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import face recognition util
const { loadModels } = require('./faceRec/faceRecognition');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Check if face-api models exist
const MODELS_PATH = path.join(__dirname, 'models/face-api-models');
const modelsExist = fs.existsSync(MODELS_PATH) &&
  fs.readdirSync(MODELS_PATH).length > 0;

// Start server after loading models and connecting to MongoDB
async function startServer() {
  try {
    // Connect to MongoDB first
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is not set');
    }

    console.log('MongoDB URI:', mongoUri.replace(/:[^:@]+@/, ':****@')); // Log without password

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      bufferTimeoutMS: 60000,
    });
    console.log('Connected to MongoDB successfully');

    // Only load face recognition models if they exist
    if (modelsExist) {
      console.log('Loading face recognition models...');
      await loadModels();
      console.log('Face recognition models loaded successfully');
    } else {
      console.warn('WARNING: Face recognition models not found in:', MODELS_PATH);
      console.warn('Face matching features will not work. Run: npm run download-models');
    }

    // Verify Gemini API key is loaded (for AI features)
    if (!process.env.GEMINI_API_KEY) {
      console.warn('WARNING: GEMINI_API_KEY not found in environment variables');
      console.warn('AI features (image analysis, NamanGPT) will not work');
    } else {
      console.log('Gemini API Key loaded:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
    }

    // Import routes
    const aiRoutes = require('./routes/aiRoutes');
    const faceRoutes = require('./routes/faceRoutes');
    const profileRoutes = require('./routes/profileRoutes');
    const compareRoutes = require('./routes/compareRoutes');
    const namangptRoutes = require('./routes/namangptRoutes');

    // Use routes
    app.use('/api/ai', aiRoutes);
    app.use('/api/face', faceRoutes);
    app.use('/api/profiles', profileRoutes);
    app.use('/api/compare', compareRoutes);
    app.use('/api/namangpt', namangptRoutes);

    // Basic route for testing
    app.get('/', (req, res) => {
      const used = process.memoryUsage();
      const memoryUsage = {};
      for (let key in used) {
        memoryUsage[key] = `${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`;
      }
      console.log('Current Memory Usage:', memoryUsage);

      res.json({
        status: 'running',
        memory: memoryUsage,
        features: {
          faceRecognition: modelsExist,
          aiAnalysis: !!process.env.GEMINI_API_KEY,
          namanGPT: !!process.env.GEMINI_API_KEY
        }
      });
    });

    // Start server
    const PORT = process.env.PORT || 5005;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
