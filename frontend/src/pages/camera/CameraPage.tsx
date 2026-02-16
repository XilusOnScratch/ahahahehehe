import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { setAuthenticated, isAuthenticated } from '../../lib/storage';

function Camera() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [photoData, setPhotoData] = useState<string | null>(null);
  
  // New states for backend interaction
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setErrorMessage('');
      }

      // Also set the background video to the same stream
      if (backgroundVideoRef.current) {
        backgroundVideoRef.current.srcObject = stream;
        backgroundVideoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setErrorMessage(
        'Could not access the camera. Please ensure you have granted camera permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());
      (videoRef.current as HTMLVideoElement).srcObject = null;
      setCameraActive(false);
    }
    if (backgroundVideoRef.current && backgroundVideoRef.current.srcObject) {
      (backgroundVideoRef.current as HTMLVideoElement).srcObject = null;
    }
  };

  const takePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const width = (videoRef.current as HTMLVideoElement).videoWidth;
    const height = (videoRef.current as HTMLVideoElement).videoHeight;

    (canvasRef.current as HTMLCanvasElement).width = width;
    (canvasRef.current as HTMLCanvasElement).height = height;

    const ctx = (canvasRef.current as HTMLCanvasElement).getContext('2d');
    if (ctx) {
      // Flip the canvas horizontally to match the flipped video
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current as HTMLVideoElement, 0, 0, width, height);
      setHasPhoto(true);
      
      // Store the photo data as a base64 string
      const photoDataUrl = (canvasRef.current as HTMLCanvasElement).toDataURL('image/jpeg');
      setPhotoData(photoDataUrl);
    }
  };

  const clearPhoto = () => {
    if (!canvasRef.current) return;
    const ctx = (canvasRef.current as HTMLCanvasElement).getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, (canvasRef.current as HTMLCanvasElement).width, (canvasRef.current as HTMLCanvasElement).height);
      setHasPhoto(false);
      setPhotoData(null);
    }
  };

  const processPhoto = () => {
    if (!canvasRef.current || !photoData) return;
    
    setIsProcessing(true);
    setErrorMessage('');

    (canvasRef.current as HTMLCanvasElement).toBlob((blob) => {
      if (!blob) {
        setIsProcessing(false);
        setErrorMessage('Failed to process photo');
        return;
      }
      
      // Create form data to send to backend
      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');
      
      // Send the photo to the backend for face matching
      fetch('https://aha-backend-ph63.onrender.com/api/face/match', {
        method: 'POST',
        body: formData,
      })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg = data?.message || data?.error || 'Server error: ' + response.status;
          throw new Error(msg);
        }
        return data;
      })
      .then(data => {
        setIsProcessing(false);
        
        if (data.success && data.profile) {
          // Check if the matched person is naman - TESTING!! Should actually be ahana
          const matchedName = data.profile.name.toLowerCase();
          if (matchedName.includes('naman')) {
            // Store the matched profile
            setMatchedProfile(data.profile);
            
            // Save authentication status to localStorage
            setAuthenticated(true);
            
            // Navigate to dashboard after successful face unlock
            navigate('/dash');
          } else {
            // Not naman, show error - SHOULD BE ahana
            setErrorMessage('Access denied. Only Naman is authorized.');
          }
        } else {
          // No match found, show error
          setErrorMessage('Face not recognized. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error connecting to backend:', error);
        setIsProcessing(false);
        setErrorMessage(error?.message || 'Face not found. Please try again.');
      });
    }, 'image/jpeg', 0.8);
  };

  useEffect(() => {
    // If already authenticated, skip camera entirely
    if (isAuthenticated()) {
      navigate('/dash');
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden font-serif">
      {/* Full-screen blurred background camera */}
      <video
        ref={backgroundVideoRef}
        className="absolute inset-0 w-full h-full opacity-3 0 object-cover opacity-10 blur-3xl scale-110"
        playsInline
        autoPlay
        muted
        style={{ filter: 'blur(40px) brightness(0.7)', transform: 'scaleX(-1)' }}
      ></video>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-200/50 via-purple-200/40 to-pink-200/50" />

      {/* Content */}
      <motion.div 
        className="relative h-full flex flex-col items-center justify-center px-6 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div 
          className="absolute top-8 left-0 right-0 flex justify-between items-center px-6 z-10"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.button 
            onClick={() => navigate('/')} 
            className="text-white hover:text-pink-200 transition-colors backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg"
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            ← back
          </motion.button>
          <motion.h1 
            className="text-2xl text-white font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            face unlock
          </motion.h1>
          <div className="w-16" />
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              className="absolute top-24 w-full max-w-md bg-red-500/90 backdrop-blur-sm border-2 border-red-300 text-white px-6 py-3 rounded-xl z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main camera preview - horizontal rectangle */}
        <motion.div 
          className="flex flex-col items-center gap-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Camera container */}
          <motion.div 
            className="relative w-full max-w-2xl aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${hasPhoto ? 'hidden' : 'block'}`}
              playsInline
              autoPlay
              style={{ transform: 'scaleX(-1)' }}
            ></video>
            <motion.canvas
              ref={canvasRef}
              className={`w-full h-full object-cover ${hasPhoto ? 'block' : 'hidden'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: hasPhoto ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            ></motion.canvas>
            
            {/* Processing Overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div 
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-white text-center">
                    <motion.div 
                      className="mb-4 w-12 h-12 border-4 border-t-transparent border-white rounded-full mx-auto"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    ></motion.div>
                    <p className="text-xl font-medium">thinking...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Controls */}
          <motion.div 
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {/* Capture button */}
            <motion.button
              onClick={hasPhoto ? clearPhoto : takePhoto}
              disabled={!cameraActive && !hasPhoto || isProcessing}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all backdrop-blur-sm ${
                (cameraActive || hasPhoto) && !isProcessing 
                  ? 'bg-white/20 hover:bg-white/30 text-white border-2 border-white/50' 
                  : 'opacity-30 cursor-not-allowed'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {hasPhoto ? '✓' : '○'}
            </motion.button>

            {/* Unlock Button */}
            <AnimatePresence>
              {hasPhoto && !isProcessing && (
                <motion.button
                  onClick={processPhoto}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full px-10 py-4 flex items-center justify-center gap-3 text-lg font-semibold shadow-2xl hover:shadow-pink-500/50 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    🔓
                  </motion.span>
                  <span>unlock</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Camera;
