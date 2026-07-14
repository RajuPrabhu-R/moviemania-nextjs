// src/components/AutoPlayOverlay.jsx

import React from 'react';
import { Play, X } from 'lucide-react';

// Must match the constant in useAutoPlayNext.js
const AUTO_PLAY_THRESHOLD = 12; 

const AutoPlayOverlay = ({ nextEpisode, countdown, onCancel, onPlayNow }) => {
    // Safety check for rendering
    if (!nextEpisode || countdown === null) return null;

    // Calculate the width for the smooth countdown bar animation
    const widthPercentage = (countdown / AUTO_PLAY_THRESHOLD) * 100;
    
    const nextEpisodeTitle = nextEpisode.name || nextEpisode.title || 'Next Episode';

    return (
        <div style={styles.container}>
            {/* Countdown Bar */}
            <div style={styles.countdownBarContainer}>
                <div 
                    style={{
                        ...styles.countdownBar,
                        width: `${widthPercentage}%`,
                    }}
                />
            </div>
            
            <div style={styles.content}>
                <div style={styles.textContainer}>
                    <p style={styles.heading}>Up Next</p>
                    <p style={styles.title}>
                        S{nextEpisode.season_number} E{nextEpisode.episode_number}: {nextEpisodeTitle}
                    </p>
                </div>
                
                <div style={styles.actions}>
                    {/* Cancel Button */}
                    <button 
                        style={styles.actionButtonCancel} 
                        onClick={onCancel}
                    >
                        <X size={14} style={{ marginRight: 4 }} /> Cancel
                    </button>
                    
                    {/* Play Now Button */}
                    <button 
                        style={styles.actionButtonPlay} 
                        onClick={onPlayNow}
                    >
                        <Play size={16} style={{ marginRight: 6 }} /> Play Now ({countdown})
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Inline Styles (Using standard JavaScript objects for cleaner insertion) ---
const styles = {
    // Outer container for the overlay
    container: {
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        backgroundColor: 'rgba(20, 20, 20, 0.95)', 
        zIndex: 60,
    },
    // Progress Bar container
    countdownBarContainer: {
        height: '4px',
        width: '100%',
        backgroundColor: '#333',
        overflow: 'hidden',
    },
    // The moving bar itself
    countdownBar: {
        height: '100%',
        backgroundColor: '#E74C3C', // Anime Salt color
        transition: 'width 1s linear', // KEY for smooth animation
        float: 'right', // Bar should shrink from the right
    },
    // Text and Buttons area
    content: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 25px',
        color: 'white',
        '@media (max-width: 640px)': {
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '10px 15px',
        }
    },
    textContainer: {
        flexGrow: 1,
        maxWidth: '70%',
        '@media (max-width: 640px)': {
            marginBottom: '10px',
            maxWidth: '100%',
        }
    },
    heading: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#E74C3C',
        margin: 0,
        marginBottom: '2px',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: '16px',
        fontWeight: '600',
        margin: 0,
        lineHeight: '1.4',
    },
    actions: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    actionButtonBase: {
        padding: '8px 15px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        border: 'none',
        transition: 'background-color 0.2s',
    },
    actionButtonCancel: {
        backgroundColor: 'transparent',
        border: '2px solid #555',
        color: '#AAA',
    },
    actionButtonPlay: {
        backgroundColor: '#E74C3C',
        color: 'white',
        // In a real project, use a CSS-in-JS library for hover states
    }
};

export default AutoPlayOverlay;