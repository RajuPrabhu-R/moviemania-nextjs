"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Check, X } from "lucide-react"; // We bring the icons here for the Toast

const GlobalContext = createContext();

const STORAGE_KEY = "moviemania_watch_history";
const MY_LIST_STORAGE_KEY = "moviemania_my_list";
const BLUR_SETTING_KEY = "moviemania_blur_settings";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = "110e5c4f620f3ed443952ecfc0996c50"

const generateProgress = () => Math.floor(Math.random() * 70) + 20;

export const GlobalProvider = ({ children }) => {
  // 1. Setup States with Safe Defaults for Server-Side Rendering
  const [trending,setTrending] = useState([]);
  const [tv, setTv] = useState([]);
  const [romance,setRomance] = useState([]);
  const [animeMovies,setAnimeMovies] = useState([]);
  const [matureAnime,setMatureAnime] = useState([]);
  const [topRated,setTopRated] = useState([]);
  const [actionMovies,setActionMovies] = useState([]);
  const [curatedNew,setCuratedNew] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [myList, setMyList] = useState([]);
  const [isBlurEnabled, setIsBlurEnabled] = useState(true);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  
  // This is the Next.js magic key: It prevents overwriting storage before hydration
  const [isMounted, setIsMounted] = useState(false);
  const toastTimer = useRef(null);

  // 2. Hydration: Read from LocalStorage ONLY once mounted in the browser
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        setHistory(parsed.filter((item) => item.id && (item.poster_path || item.backdrop_path)));
      }

      const storedList = localStorage.getItem(MY_LIST_STORAGE_KEY);
      if (storedList) setMyList(JSON.parse(storedList));

      const savedBlur = localStorage.getItem(BLUR_SETTING_KEY);
      if (savedBlur !== null) setIsBlurEnabled(JSON.parse(savedBlur));
      
      setIsMounted(true);
    } catch (error) {
      console.error("Failed to load local storage:", error);
      setIsMounted(true); // Ensure app still loads even if storage fails
    }
  }, []);

  
  // --- 5. INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const endpoints = {
          trending: "/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc",
          tv: "/discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_count.desc",
          romance: "/discover/movie?with_genres=16,10749&with_original_language=ja",
          animeMovies: "/discover/movie?with_genres=16&with_original_language=ja",
          topRated: "/discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=1000",
          actionMovies: "/discover/tv?with_genres=16,10759&with_original_language=ja",
          matureAnime: "/discover/tv?with_genres=16&sort_by=popularity.desc&certification_country=US&certification=TV-MA"
        };

        const responses = await Promise.all(
          Object.values(endpoints).map(ep => 
            fetch(`${API_BASE_URL}${ep}&api_key=${API_KEY}`).then(res => res.json())
          )
        );

        setTrending(responses[0].results || []);
        setTv(responses[1].results || []);
        setRomance(responses[2].results || []);
        setAnimeMovies(responses[3].results || []);
        setTopRated(responses[4].results || []);
        setActionMovies(responses[5].results || []);
        setMatureAnime(responses[6].results || []);
        
        setIsInitialLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsInitialLoading(false);
      }
    };
    
    // Only fetch after component has safely mounted on client
    if (isMounted) {
      fetchAllData();
    }
  }, [isMounted]);

  // 3. Sync to LocalStorage (Only runs after hydration is complete)
  useEffect(() => {
    if (isMounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(myList));
  }, [myList, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem(BLUR_SETTING_KEY, JSON.stringify(isBlurEnabled));
  }, [isBlurEnabled, isMounted]);

  // 4. Toast Logic
  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // 5. Watch History Logic
  const addToHistory = useCallback((itemData) => {
    const newItem = {
      id: String(itemData.id),
      mediaType: itemData.mediaType || (itemData.title ? "movie" : "tv"),
      title: itemData.title || itemData.name,
      poster_path: itemData.poster_path,
      backdrop_path: itemData.backdrop_path,
      overview: itemData.overview,
      release_date: itemData.release_date,
      first_air_date: itemData.first_air_date,
      watchedAt: Date.now(),
      lastPlayedSeason: itemData.lastPlayedSeason || 1,
      lastPlayedEpisode: itemData.lastPlayedEpisode || 1,
      progress: itemData.progress ?? generateProgress(),
    };

    setHistory((prevHistory) => {
      const filtered = prevHistory.filter(
        (item) => !(item.id === newItem.id && item.mediaType === newItem.mediaType)
      );
      return [newItem, ...filtered].slice(0, 50);
    });
  }, []);

  const clearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear your entire watch history?")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const removeFromHistory = useCallback((idToRemove, mediaTypeToRemove) => {
    setHistory((prevHistory) =>
      prevHistory.filter(
        (item) => !(item.id === String(idToRemove) && item.mediaType === mediaTypeToRemove)
      )
    );
  }, []);

  // 6. My List Logic
  const toggleMyList = useCallback((itemData) => {
    const id = String(itemData.id);
    const mediaType = itemData.mediaType || itemData.media_type || (itemData.title ? "movie" : "tv");

    setMyList((prevList) => {
      const exists = prevList.some((item) => item.id === id && item.mediaType === mediaType);

      if (exists) {
        showToast("Removed from My List");
        return prevList.filter((item) => !(item.id === id && item.mediaType === mediaType));
      } else {
        showToast("Added to My List");
        const newItem = {
          id,
          mediaType,
          title: itemData.title || itemData.name,
          poster_path: itemData.poster_path,
          backdrop_path: itemData.backdrop_path,
          addedAt: Date.now(),
        };
        return [newItem, ...prevList];
      }
    });
  }, [showToast]);

  const isInMyList = useCallback((id, mediaType) => {
    return myList.some((item) => item.id === String(id) && item.mediaType === mediaType);
  }, [myList]);

  // Don't render children until mounted to prevent hydration UI mismatch
  if (!isMounted) {
    return null; // Or a subtle loading spinner if you prefer
  }

  return (
    <GlobalContext.Provider
      value={{
        history, addToHistory, clearHistory, removeFromHistory,
        myList, toggleMyList, isInMyList, toast, 
        isBlurEnabled, setIsBlurEnabled,trending, tv, romance, animeMovies, matureAnime, actionMovies, curatedNew, isInitialLoading
      }}
    >
      {children}
      
      {/* Global Toast Component */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] bg-pink-600/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl shadow-pink-900/40 font-bold text-[13px] animate-fade-in-up flex items-center gap-2 border border-pink-500/50 pointer-events-none">
          {toast === "Added to My List" ? (
            <Check size={16} strokeWidth={3} />
          ) : (
            <X size={16} strokeWidth={3} />
          )}
          {toast}
        </div>
      )}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);


