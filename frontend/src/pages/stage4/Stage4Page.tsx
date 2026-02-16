import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loadStage3Progress, saveStage3Progress, Stage3Progress } from '../../lib/storage';

function Stage4Page() {
    const navigate = useNavigate();
    const [showPopup, setShowPopup] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        const progress = loadStage3Progress();
        if (progress && progress.inventory.some((i: any) => i.id === 'stage4-key')) {
            setHasKey(true);
        }
    }, []);

    const handleKeyClick = () => {
        setShowPopup(true);

        // Add key to stage 3 inventory
        const progress = loadStage3Progress();
        if (progress) {
            const newKey = {
                id: 'stage4-key',
                name: 'key',
                type: 'key',
                x: 0,
                y: 0,
                location: 'house',
                color: '#C0C0C0'
            };

            const newProgress: Stage3Progress = {
                ...progress,
                inventory: [...progress.inventory, newKey]
            };

            saveStage3Progress(newProgress);
        }

        setTimeout(() => {
            navigate('/stage3');
        }, 1000);
    };

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                background: `
          repeating-linear-gradient(
            -45deg,
            #E8DFD0 0px,
            #E8DFD0 6px,
            #F0E8DC 6px,
            #F0E8DC 12px
          )
        `
            }}
        >
            {!hasKey && (
                <motion.div
                    onClick={handleKeyClick}
                    className="absolute left-1/2 top-1/2 cursor-pointer z-10"
                    style={{
                        x: '-50%',
                        y: '-50%',
                        width: 64,
                        height: 64
                    }}
                    animate={{ y: ['-50%', '-60%', '-50%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                    <img
                        src="/key.png"
                        alt="Silver Key"
                        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                    />
                </motion.div>
            )}

            {showPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-[#F5EEE6] border-2 border-[#A69076] rounded-lg p-6 shadow-xl">
                        <p className="text-[#5a4a3a] font-mono text-lg">acquired.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Stage4Page;
