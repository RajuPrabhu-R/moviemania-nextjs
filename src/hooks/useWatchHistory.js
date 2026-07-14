import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "moviemania_watch_history";

export const useWatchHistory = () => {
  const [history, setHistory] = useState(() => {
      try {
            const stored = localStorage.getItem(STORAGE_KEY);
                  return stored ? JSON.parse(stored) : [];
                      } catch { return []; }
                        });

                          useEffect(() => {
                              localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
                                }, [history]);

                                  const addToHistory = useCallback((itemData) => {
                                      const newItem = {
                                            id: String(itemData.id),
                                                  mediaType: itemData.mediaType || (itemData.title ? "movie" : "tv"),
                                                        title: itemData.title || itemData.name,
                                                              poster_path: itemData.poster_path,
                                                                    backdrop_path: itemData.backdrop_path, 
                                                                          watchedAt: Date.now(),
                                                                                lastPlayedSeason: itemData.lastPlayedSeason || 1,
                                                                                      lastPlayedEpisode: itemData.lastPlayedEpisode || 1,
                                                                                            progress: Math.floor(Math.random() * 70) + 20, 
                                                                                                };

                                                                                                    setHistory((prev) => {
                                                                                                          const filtered = prev.filter(i => !(i.id === newItem.id && i.mediaType === newItem.mediaType));
                                                                                                                return [newItem, ...filtered].slice(0, 50);
                                                                                                                    });
                                                                                                                      }, []);

                                                                                                                        const removeFromHistory = useCallback((id, type) => {
                                                                                                                            setHistory(prev => prev.filter(i => !(i.id === String(id) && i.mediaType === type)));
                                                                                                                              }, []);

                                                                                                                                const clearHistory = () => {
                                                                                                                                    if (window.confirm("Are you sure you want to clear your entire watch history?")) setHistory([]);
                                                                                                                                      };

                                                                                                                                        return { history, addToHistory, removeFromHistory, clearHistory };
                                                                                                                                        };
                                                                                                                                        