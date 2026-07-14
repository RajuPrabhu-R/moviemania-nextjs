// src/hooks/useAutoPlayNext.js

import { useState, useEffect, useCallback, useRef } from 'react';

// --- CONFIGURATION CONSTANTS ---
// Start the visual countdown 12 seconds before the estimated end
const AUTO_PLAY_THRESHOLD = 12; 
// Trigger the navigation 2 seconds before the end for a smooth cut-off
const NAVIGATION_TRIGGER = 2;   
// Interval for checking the simulated time (faster than 1s for responsiveness)
const SIMULATION_INTERVAL_MS = 500; 

/**
 * Custom hook to handle auto-play and countdown logic for video player.
 * * Since an <iframe> is used, this hook *simulates* video playback time 
 * based on the provided episode duration (runtime).
 * * @param {object | null} nextEpisode - Details of the next episode (or null if it's the last).
 * @param {function} handleNextEpisode - The function to trigger navigation.
 */
const useAutoPlayNext = (nextEpisode, handleNextEpisode) => {
    // State for the countdown timer (12, 11, 10, ..., 1)
    const [countdown, setCountdown] = useState(null); 
    // Flag to detect if we are in the last few seconds of the video
    const [isNearEnd, setIsNearEnd] = useState(false); 
    // Flag to lock the navigation process
    const [hasNavigated, setHasNavigated] = useState(false); 

    // Ref to hold the simulated video state and the fast interval timer
    const virtualVideoStateRef = useRef({ 
        currentTime: 0, 
        duration: 0,
        startTime: Date.now() 
    });
    const simulationIntervalRef = useRef(null);
    const countdownTimerRef = useRef(null);


    // --- Core Logic: Navigation Trigger ---
    const triggerNavigation = useCallback(() => {
        if (!nextEpisode || hasNavigated) return;
        setHasNavigated(true); // Lock the trigger

        // Stop all timers immediately
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        
        // Call the parent component's navigation function
        handleNextEpisode(); 
        
    }, [nextEpisode, hasNavigated, handleNextEpisode]);


    // --- Simulates Video State Progression ---
    const startVirtualPlayback = useCallback((episodeDurationInSeconds) => {
        // Reset and set initial state
        virtualVideoStateRef.current = {
            currentTime: 0,
            duration: episodeDurationInSeconds,
            startTime: Date.now()
        };
        
        // Clear any previous interval
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

        // Start a fast interval to check the virtual playback time
        simulationIntervalRef.current = setInterval(() => {
            
            // Calculate elapsed time since start
            const elapsedSeconds = Math.floor((Date.now() - virtualVideoStateRef.current.startTime) / 1000);
            
            const totalDuration = virtualVideoStateRef.current.duration;
            const timeRemaining = totalDuration - elapsedSeconds;

            // --- 1. NAVIGATION TRIGGER CHECK ---
            if (timeRemaining <= NAVIGATION_TRIGGER && timeRemaining > 0 && !hasNavigated) {
                // Trigger navigation for a smooth cut-off
                triggerNavigation();
                
            } 
            // --- 2. COUNTDOWN START CHECK ---
            else if (timeRemaining <= AUTO_PLAY_THRESHOLD && timeRemaining > 0 && !isNearEnd) {
                // Set flag to start the visual countdown timer
                setIsNearEnd(true);
            }
            // --- 3. END OF VIDEO / SAFETY CHECK ---
            else if (timeRemaining <= 0) {
                 clearInterval(simulationIntervalRef.current);
                 // If the navigation somehow failed, trigger it now as a safety
                 if(!hasNavigated) triggerNavigation();
            }

        }, SIMULATION_INTERVAL_MS); 

    }, [triggerNavigation, hasNavigated, isNearEnd]);


    // --- Effect 1: Visual Countdown Timer (Runs every 1 second for UI) ---
    useEffect(() => {
        // Only start the visual timer once the near-end flag is set
        if (isNearEnd && countdown === null) {
            setCountdown(AUTO_PLAY_THRESHOLD);
        }

        if (countdown > NAVIGATION_TRIGGER) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            
            // Tick down every second (for smooth visual effect)
            countdownTimerRef.current = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        
        // Clean up the timer
        return () => {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };

    }, [isNearEnd, countdown]);
    
    
    // --- Public Control Functions ---

    const stopCountdown = useCallback(() => {
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setCountdown(null);
        setIsNearEnd(false);
        setHasNavigated(false);
        virtualVideoStateRef.current = { currentTime: 0, duration: 0, startTime: Date.now() };
    }, []);
    
    // The main function exposed to the component to start the feature
    const startCountdown = useCallback((episodeDuration) => {
        if (!nextEpisode || !episodeDuration) return;
        stopCountdown(); // Reset previous state
        startVirtualPlayback(episodeDuration);
    }, [nextEpisode, stopCountdown, startVirtualPlayback]);
    

    // Reset state whenever the nextEpisode object changes (e.g., when the user manually clicks next)
    useEffect(() => {
        // This ensures the timer is reset when a new episode loads
        stopCountdown();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nextEpisode]);

    
    return { 
        // Only show the countdown if it's relevant (not navigating yet)
        countdown: countdown > NAVIGATION_TRIGGER ? countdown : null, 
        startCountdown,
        stopCountdown,
        isAutoPlaying: hasNavigated // Useful for showing a 'Loading' state
    };
};

export default useAutoPlayNext;