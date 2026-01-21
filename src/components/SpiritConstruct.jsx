import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

// Visual configuration for different states
// Using repeatType: "mirror" ensures seamless back-and-forth loops
const variants = {
    idle: {
        scale: [1, 1.05, 1],
        rotate: [0, 2, -2, 0],
        borderRadius: ["40%", "45%", "40%"],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
    },
    happy: { // Joy
        scale: [1, 1.2, 1],
        rotate: [0, 10, -10, 0],
        borderRadius: ["50%", "30%", "50%"],
        filter: "brightness(1.2)",
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
    },
    sadness: {
        scale: 0.9,
        y: [0, 5, 0],
        borderRadius: "45%",
        filter: "grayscale(0.5)",
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
    },
    anger: {
        scale: [1, 1.1, 1],
        x: [-2, 2, -2],
        borderRadius: ["20%", "25%", "20%"],
        transition: { duration: 0.2, repeat: Infinity, repeatType: "mirror" }
    },
    fear: {
        scale: [0.95, 1, 0.95],
        borderRadius: ["40%", "42%", "40%"],
        transition: { duration: 0.5, repeat: Infinity, repeatType: "mirror" }
    },
    // Special Gamified States
    neglected: {
        scale: 0.8,
        opacity: 0.6,
        y: 20, // Sleeping on floor
        rotate: 90, // Lying down
        filter: "grayscale(1) contrast(0.8)", // Dusty
        transition: { duration: 1 }
    },
    comforting: { // For high stress/anxiety
        scale: 1.3, // "Close to screen"
        borderRadius: "50%",
        filter: "blur(0px) brightness(1.1)", // Soft glow
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
    },
    thriving: { // High wellness
        scale: [1, 1.1, 1],
        y: [-10, 10, -10], // Levitating
        filter: "drop-shadow(0 0 20px gold)", // Glowing
        borderRadius: ["50%", "40%", "50%"],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
    }
};

// Colors for basic emotions
const colors = {
    idle: '#6200EA',
    happy: '#FFD600',
    sadness: '#1E88E5',
    anger: '#D32F2F',
    fear: '#7B1FA2',
    neglected: '#757575',
    comforting: '#00B0FF', // Soft Blue
    thriving: '#FFD700',   // Gold
};

const SpiritConstruct = ({ state = 'idle', evolution = 'neutral', baseColor, streak = 0, todayComplete = false }) => {
    // map state to match variants keys (lowercase)
    let activeVariant = state.toLowerCase();

    // Safety fallback
    if (activeVariant.includes('joy')) activeVariant = 'happy';
    if (!variants[activeVariant]) activeVariant = 'idle';

    // Use baseColor for idle state if provided, otherwise default
    const defaultColor = colors[activeVariant] || colors.idle;
    const currentColor = (activeVariant === 'idle' && baseColor) ? baseColor : defaultColor;

    // Calculate Dots based on Streak (Max 4)
    // 1: Top, 2: Bottom, 3: Right, 4: Left
    const activeDots = [];
    if (streak >= 1) activeDots.push(0);   // Top
    if (streak >= 2) activeDots.push(180); // Bottom
    if (streak >= 3) activeDots.push(90);  // Right
    if (streak >= 4) activeDots.push(270); // Left

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
                position: 'relative'
            }}
        >
            {/* Core Entity */}
            <Box
                component={motion.div}
                variants={variants}
                animate={activeVariant}
                sx={{
                    width: '60%', // Relative size to container
                    height: '60%',
                    maxWidth: 150,
                    maxHeight: 150,
                    aspectRatio: '1/1',
                    bgcolor: currentColor,
                    boxShadow: `0 0 60px ${currentColor}80`,
                    borderRadius: '40%',
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Evolution Accessories (Simple CSS/SVG overlays) */}
                {evolution === 'scholar' && (
                    // Glasses or book symbol
                    <Box sx={{
                        width: '60%',
                        height: '20px',
                        border: '4px solid rgba(255,255,255,0.7)',
                        borderRadius: 4,
                        mt: -2
                    }} />
                )}

                {evolution === 'athlete' && (
                    // Headband
                    <Box sx={{
                        width: '100%',
                        height: '15px',
                        bgcolor: 'rgba(255,0,0,0.5)',
                        position: 'absolute',
                        top: 30
                    }} />
                )}

                {state === 'neglected' && (
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>Zzz...</Typography>
                )}
            </Box>

            {/* Orbiting Particles Container */}
            {(state !== 'neglected' && todayComplete) && (
                <Box
                    component={motion.div}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    sx={{
                        position: 'absolute',
                        width: '90%', // Larger than spirit
                        height: '90%',
                        maxWidth: 220,
                        maxHeight: 220,
                        aspectRatio: '1/1',
                        border: `2px solid ${currentColor}15`,
                        borderRadius: '50%',
                        pointerEvents: 'none'
                    }}
                >
                    {/* Re-implementing dots correctly */}
                    {streak >= 1 && <Box sx={{ width: 12, height: 12, bgcolor: currentColor, borderRadius: '50%', position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', boxShadow: `0 0 10px ${currentColor}` }} />}
                    {streak >= 2 && <Box sx={{ width: 12, height: 12, bgcolor: currentColor, borderRadius: '50%', position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', boxShadow: `0 0 10px ${currentColor}` }} />}
                    {streak >= 3 && <Box sx={{ width: 12, height: 12, bgcolor: currentColor, borderRadius: '50%', position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', boxShadow: `0 0 10px ${currentColor}` }} />}
                    {streak >= 4 && <Box sx={{ width: 12, height: 12, bgcolor: currentColor, borderRadius: '50%', position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', boxShadow: `0 0 10px ${currentColor}` }} />}
                </Box>
            )}

            {/* Special Effects Elements for Thriving */}
            {state === 'thriving' && (
                <Box
                    component={motion.div}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    sx={{
                        position: 'absolute',
                        width: '60%',
                        height: '60%',
                        borderRadius: '50%',
                        border: '2px solid gold',
                    }}
                />
            )}

        </Box>
    );
};

export default SpiritConstruct;
