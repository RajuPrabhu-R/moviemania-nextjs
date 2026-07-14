"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { 
    Play, Pause, ArrowLeft, ArrowRight, ChevronDown, SkipBack, 
    SkipForward, Loader2, Star, Info, List, X, Maximize, Volume2, Settings
} from "lucide-react"; 
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Assuming these paths exist in your project structure
import useAutoPlayNext from "../hooks/useAutoPlayNext"; 
import AutoPlayOverlay from "../components/AutoPlayOverlay"; 
import { CUSTOM_EMBED_LINKS } from "../data/customEmbedLinks"; 
import { CUSTOM_EMBED_LINKS_2 } from "../data/customEmbedLinks2"; 
import { CUSTOM_EPISODE_RANGES } from "../data/customEpisodeRanges"; 
import RelatedContent from "./RelatedContent";
import BottomNav from "./BottomNav.jsx";
import { useGlobalContext } from "@/context/GlobalProvider";


// --- API Configurations (Next.js Format) ---
const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY; 
const STREAMUP_API_KEY = process.env.NEXT_PUBLIC_STREAMUP_API_KEY; 
const STREAMUP_EMBED_BASE = 'https://streamup.cc/';

// --- Jellyfin Configurations (Next.js Format) ---
const JELLYFIN_HOST = process.env.NEXT_PUBLIC_JELLYFIN_HOST; 
const JELLYFIN_API_KEY = process.env.NEXT_PUBLIC_JELLYFIN_API_KEY;


// ===================================================================
// UTILITY FUNCTIONS & VIDEO PROCESSOR
// ===================================================================

const createSlug = (title) => {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

const processStreamupVideos = (videos) => {
    const tvRegex = /(.*?)\s*-\s*|(?<=\s|^)(.*?)\s*(?:S(\d+)|s(\d+))\s*(?:E(\d+)|e(\d+))/i;
    const embedMap = {};

    videos.forEach(video => {
        if (!video.Filecode) return;

        let videoTitleClean = video.title.split(/\s*S\d+E\d+\s*/i)[0].trim();
        videoTitleClean = videoTitleClean.replace(/\s*\(.*?\)\s*$/, '').trim(); 
        videoTitleClean = videoTitleClean.replace(/[^a-zA-Z0-9\s-:]/g, '').trim(); 

        const match = video.title.match(tvRegex);
        const embedUrl = `${STREAMUP_EMBED_BASE}${video.Filecode}`;

        if (match) {
            let showTitle = videoTitleClean; 
            let seasonNum = parseInt(match[3] || match[4]); 
            let episodeNum = parseInt(match[5] || match[6]); 

            if (!showTitle || isNaN(seasonNum) || isNaN(episodeNum)) return; 

            if (!embedMap[showTitle]) { embedMap[showTitle] = {}; }
            if (!embedMap[showTitle][seasonNum]) {
                embedMap[showTitle][seasonNum] = [null]; 
            }

            const seasonEpisodes = embedMap[showTitle][seasonNum];
            while (seasonEpisodes.length <= episodeNum) {
                seasonEpisodes.push(null); 
            }

            seasonEpisodes[episodeNum] = embedUrl;

        } else {
            const movieTitle = videoTitleClean;
            if (!embedMap[movieTitle]) { embedMap[movieTitle] = {}; }
            if (!embedMap[movieTitle][0]) { embedMap[movieTitle][0] = []; } 
            embedMap[movieTitle][0][0] = embedUrl;
        }
    });

    return embedMap;
};


// ===================================================================
// 1. EPISODES LIST COMPONENT (Helper Component)
// ===================================================================

const EpisodesList = React.forwardRef(({ 
    tvId, 
    seasons, 
    onEpisodeClick, 
    onSeasonSelect, 
    currentPlayingSeasonNumber,
    currentPlayingEpisodeNumber, 
    selectedSeason, 
    episodeFilter, 
    isBlurEnabled,
    movie
}, ref) => {
    if (!tvId) return null;

    const [episodes, setEpisodes] = useState([]);
    const playingEpisodeRef = useRef(null); 
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);
    const [error, setError] = useState(null);

    const fetchEpisodes = useCallback(async (seasonNumber) => {
        if (!tvId || !seasonNumber) return;

        setLoadingEpisodes(true);
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`
            );
            const data = await res.json();

            if (data.success === false) {
                setError("Failed to load episodes for this season.");
                setEpisodes([]);
                const currentSeasonData = seasons.find(s => s.season_number === seasonNumber) || null;
                onSeasonSelect(currentSeasonData); 
                return;
            }

            setEpisodes(data.episodes || []);
            onSeasonSelect(data); 

        } catch (err) {
            setError("Error fetching episodes.");
        } finally {
            setLoadingEpisodes(false);
        }
    }, [tvId, seasons, onSeasonSelect]);

    useEffect(() => {
        if (selectedSeason) {
            fetchEpisodes(selectedSeason.season_number);
        }
    }, [selectedSeason, fetchEpisodes]);

    useEffect(() => {
        if (playingEpisodeRef.current) {
            playingEpisodeRef.current.scrollIntoView({
                behavior: 'smooth', 
                block: 'center'
            });
        }
    }, [currentPlayingSeasonNumber, currentPlayingEpisodeNumber, episodes]); 

    const filteredEpisodes = episodes.filter(episode => {
        if (!episode || !episode.id) return false; 
        if (!episodeFilter) return true;
        const searchLower = episodeFilter.toLowerCase();
        return (episode.name?.toLowerCase().includes(searchLower));
    });

    const handleEpisodeClick = useCallback((episode) => {
        onEpisodeClick(episode);
    }, [onEpisodeClick]);

    return (
        <div ref={ref}>
            {loadingEpisodes && <div  className="text-pink-500">
                <div className="flex justify-center items-center p-4"><Loader2  size={14} className="animate-spin" /> Loading episodes... </div>
            </div>
            }
            {error && <div className="text-red-500">{error}</div>}

            {!loadingEpisodes && !error && (
                <div className="space-y-3"> 
                    {filteredEpisodes.length > 0 ? (
                        filteredEpisodes.map((episode) => {
                            const episodeName = episode.name || `Episode ${episode.episode_number || 'N/A'}`;
                            const episodeNumber = episode.episode_number || 'N/A';
                            const seasonNumber = episode.season_number || 'N/A';
                            const airDate = episode.air_date;

                            const isCurrentEpisode = 
                                episode.season_number === currentPlayingSeasonNumber && 
                                episode.episode_number === currentPlayingEpisodeNumber;

                            return (
                                <div 
                                    key={episode.id}
                                    ref={isCurrentEpisode ? playingEpisodeRef : null} 
                                    className={`
                                        flex gap-3 p-2 lg:gap-4 lg:p-3 rounded-xl transition-all duration-300 cursor-pointer 
                                        relative overflow-hidden group 

                                        ${isCurrentEpisode 
                                            ? 'bg-gradient-to-r from-pink-950/70 to-gray-900/50 border border-pink-500 shadow-2xl shadow-pink-900/50' 
                                            : 'bg-gray-900/50 border border-transparent hover:bg-gray-800/80 hover:shadow-lg hover:shadow-gray-900/50' 
                                        }
                                    `}
                                    onClick={() => handleEpisodeClick(episode)} 
                                >
                                    {isCurrentEpisode && (
                                        <div className="absolute top-0 left-0 w-1 bg-pink-500 h-full rounded-l-xl"></div>
                                    )}

                                    <div className="relative flex-shrink-0 w-30 sm:w-28 sm:h-16 lg:w-35 rounded-lg overflow-hidden bg-white/10 group-hover:scale-[1.02] transition-transform duration-300">
                                        <img
                                            src={
                                                episode.still_path
                                                    ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
                                                    : '/No-Poster.png'
                                            }
                                            alt={`S${seasonNumber} E${episodeNumber}`}
                                            className={`w-full h-full object-cover transition-all duration-300 ${
                                                movie?.adult && isBlurEnabled ? "blur-xl scale-110" : ""
                                            }`}
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-end justify-start p-1 lg:p-1.5 transition-opacity">
                                            <span className="text-white text-[10px] lg:text-xs font-bold bg-pink-600 px-1.5 py-0.5 rounded-br-md rounded-tr-md">
                                                E{episodeNumber}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-start py-0.5 min-w-0">
                                        <p className="text-[10px] lg:text-xs font-medium text-pink-400 mb-0.5 lg:mb-1">
                                            Season {seasonNumber}
                                        </p>
                                        <h3 className={`font-semibold text-sm line-clamp-2 leading-tight ${isCurrentEpisode ? 'text-pink-300 group-hover:text-pink-100' : 'text-gray-200 group-hover:text-white'} transition-colors duration-200`}>
                                            {episodeNumber}. {episodeName}
                                        </h3>
                                        <p className="text-[10px] lg:text-xs text-gray-500 mt-1 truncate">
                                            {airDate
                                                ? new Date(airDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                                                : 'Date N/A'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-gray-400 p-4 bg-gray-900/50 rounded-lg">
                            {episodeFilter ? `No episodes found matching "${episodeFilter}".` : 'No episodes found for this season.'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

const MemoizedEpisodesList = React.memo(EpisodesList);
MemoizedEpisodesList.displayName = 'EpisodesList';
const EpisodesListWithScroll = MemoizedEpisodesList;


// ===================================================================
// 2. DEDICATED PLAYER SCREEN COMPONENT (Main Component)
// ===================================================================
const DedicatedPlayerScreen = ({ movie, isTV, recommendations }) => { 

    // Next.js Navigation
    const router = useRouter();
    const searchParams = useSearchParams(); 
    const pathname = usePathname();

    // Global Context
    const { isBlurEnabled } = useGlobalContext();

    const title = movie?.title || movie?.name;
    const slug = useMemo(() => createSlug(title), [title]);

    if (!movie) {
        useEffect(() => {
            router.replace("/");
        }, [router]);
        return null;
    }

    const initialSeason = parseInt(searchParams.get('s')) || 1;
    const initialEpisode = parseInt(searchParams.get('e')) || 1;

    const seasons = useMemo(() => movie.seasons || [], [movie.seasons]);

    // --- JELLYFIN STATE ---
    const [jellyfinSource, setJellyfinSource] = useState(null);

    // --- CUSTOM PLAYER STATES (NETFLIX UPGRADE) ---
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null); 
    const controlsTimeoutRef = useRef(null); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showControls, setShowControls] = useState(true);

    // --- SIDEBAR PERSISTENCE FIX ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('moviemania_sidebar_open');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    useEffect(() => {
        localStorage.setItem('moviemania_sidebar_open', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progress);
        }
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = x / width;
        videoRef.current.currentTime = percentage * videoRef.current.duration;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    // --- STREAMUP STATES ---
    const [streamupVideos, setStreamupVideos] = useState([]);
    const streamupEmbedMap = useMemo(() => {
        return processStreamupVideos(streamupVideos);
    }, [streamupVideos]); 
    const [isSearching, setIsSearching] = useState(false);
    const [searchTitle, setSearchTitle] = useState(null); 


    // --- CORE PLAYER STATES ---
    const [currentEpisodeDetails, setCurrentEpisodeDetails] = useState(null); 
    const [currentSeasonDetails, setCurrentSeasonDetails] = useState(null); 
    const [playingEpisode, setPlayingEpisode] = useState({
        season_number: initialSeason,
        episode_number: initialEpisode,
    });
    const [selectedSeason, setSelectedSeason] = useState(null); 
    const [isSeasonListOpen, setIsSeasonListOpen] = useState(false); 
    const [episodeFilter] = useState(''); 
    const [activeTab, setActiveTab] = useState('info'); 

    const iframeRef = useRef(null); 


    // ===================================================================
    // JELLYFIN LOCAL RESOLVER
    // ===================================================================
    useEffect(() => {
        if (!JELLYFIN_HOST || !JELLYFIN_API_KEY || !movie.id) return;

        const fetchJellyfinMedia = async () => {
            setIsSearching(true);
            try {
                const searchRes = await fetch(
                    `${JELLYFIN_HOST}/Items?Recursive=true&AnyProviderIdEquals=tmdb.${movie.id}&api_key=${JELLYFIN_API_KEY}`
                );
                const searchData = await searchRes.json();

                if (searchData.Items && searchData.Items.length > 0) {
                    let finalId = null;

                    if (isTV) {
                        const correctEpisode = searchData.Items.find(item => 
                            item.Type === "Episode" && 
                            item.ParentIndexNumber === playingEpisode.season_number && 
                            item.IndexNumber === playingEpisode.episode_number
                        );

                        if (correctEpisode) {
                            finalId = correctEpisode.Id;
                        }
                    } else {
                        const movieItem = searchData.Items.find(item => item.Type === "Movie" || item.MediaType === "Video");
                        if (movieItem) finalId = movieItem.Id;
                    }

                    if (finalId) {
                        const streamUrl = `${JELLYFIN_HOST}/Videos/${finalId}/stream.mp4?Static=true&api_key=${JELLYFIN_API_KEY}`;
                        setJellyfinSource(streamUrl);
                    } else {
                        setJellyfinSource(null);
                    }
                } else {
                    setJellyfinSource(null);
                }
            } catch (err) {
                console.warn("Jellyfin unreachable. Falling back.");
                setJellyfinSource(null);
            } finally {
                setIsSearching(false);
            }
        };

        fetchJellyfinMedia();
    }, [movie.id, isTV, playingEpisode]);


    // ===================================================================
    // STREAMUP SEARCH
    // ===================================================================
    useEffect(() => {
        if (!title || isSearching || searchTitle === title || jellyfinSource) return;

        const performStreamupSearch = async () => {
            setIsSearching(true);
            setSearchTitle(title);
            const searchTitleQuery = title.replace(/\s*\(.*?\)\s*$/, '').trim(); 
            const encodedTitle = encodeURIComponent(searchTitleQuery);
            const SEARCH_API_URL = `https://api.streamup.cc/v1/data?api_key=${STREAMUP_API_KEY}&search=${encodedTitle}&page=1&per_page=100`;

            try {
                const response = await fetch(SEARCH_API_URL);
                const data = await response.json();
                if (data.videos && Array.isArray(data.videos)) {
                    setStreamupVideos(data.videos); 
                }
            } catch (error) {
                setStreamupVideos([]); 
            } finally {
                setIsSearching(false);
            }
        };

        performStreamupSearch();
    }, [title, isSearching, searchTitle, jellyfinSource]);


    // ===================================================================
    // EPISODE & SEASON UTILITIES
    // ===================================================================

    const updatePlayingEpisode = useCallback((season, episode) => {
        setPlayingEpisode({
            season_number: season,
            episode_number: episode,
        });
        
        // Next.js URL param update without refreshing the page
        const params = new URLSearchParams(searchParams.toString());
        params.set('s', season);
        params.set('e', episode);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false }); 
    }, [searchParams, pathname, router]); 

    const handleEpisodeClick = useCallback((episode) => {
        updatePlayingEpisode(episode.season_number, episode.episode_number);
    }, [updatePlayingEpisode]);

    useEffect(() => {
        if (currentSeasonDetails && currentSeasonDetails.episodes) {
            const episode = currentSeasonDetails.episodes.find(
                (ep) => ep.episode_number === playingEpisode.episode_number
            );
            setCurrentEpisodeDetails(episode);

            if (episode) {
                const baseTitle = movie.title || movie.name;
                document.title = `${baseTitle} - S${episode.season_number}E${episode.episode_number} | MovieMania `;
            }
        }
    }, [currentSeasonDetails, playingEpisode.episode_number, movie.title, movie.name]); 

    const getCustomRange = useCallback((tvId, seasonNum, type) => {
        const showRanges = CUSTOM_EPISODE_RANGES[tvId.toString()];
        if (showRanges && showRanges[type]) {
            return showRanges[type][seasonNum];
        }
        return undefined; 
    }, []);

    const getCurrentSeasonMinEpisode = useCallback((seasonNum) => {
        const customStart = getCustomRange(movie.id, seasonNum, 'start');
        return customStart !== undefined ? customStart : 1;
    }, [movie.id, getCustomRange]);

    const getCurrentSeasonMaxEpisode = useCallback((seasonNum) => {
        const customEnd = getCustomRange(movie.id, seasonNum, 'end');
        return customEnd !== undefined ? customEnd : (currentSeasonDetails?.episodes?.length || 0); 
    }, [movie.id, currentSeasonDetails, getCustomRange]);

    const availableSeasons = useMemo(() => seasons.filter(s => s.season_number > 0).sort((a, b) => a.season_number - b.season_number), [seasons]);


    // --- AUTOPLAY LOGIC ---
    const [nextEpisode] = useMemo(() => {
        if (!isTV) return [null, null];

        const currentSeasonNum = playingEpisode.season_number;
        const currentEpisodeNum = playingEpisode.episode_number;
        const currentMaxEp = getCurrentSeasonMaxEpisode(currentSeasonNum);
        const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === currentSeasonNum);

        let nextEpData = null;

        if (currentEpisodeNum < currentMaxEp) {
            const nextEpisodeNum = currentEpisodeNum + 1;
            nextEpData = {
                season_number: currentSeasonNum,
                episode_number: nextEpisodeNum,
                path: `/watch/${slug}?s=${currentSeasonNum}&e=${nextEpisodeNum}`
            };
        } else if (currentSeasonIndex < availableSeasons.length - 1) {
            const nextSeason = availableSeasons[currentSeasonIndex + 1];
            const nextSeasonStartEpisode = getCurrentSeasonMinEpisode(nextSeason.season_number);
            nextEpData = {
                season_number: nextSeason.season_number,
                episode_number: nextSeasonStartEpisode,
                path: `/watch/${slug}?s=${nextSeason.season_number}&e=${nextSeasonStartEpisode}`
            };
        }
        return [nextEpData];
    }, [isTV, playingEpisode, getCurrentSeasonMaxEpisode, availableSeasons, getCurrentSeasonMinEpisode, slug]);


    const handleNextEpisode = useCallback(() => {
        if (!playingEpisode || !isTV) return;
        const currentSeasonNum = playingEpisode.season_number;
        const currentEpisodeNum = playingEpisode.episode_number;
        const nextEpisodeNum = currentEpisodeNum + 1;
        const maxEpisodeInCurrentSeason = getCurrentSeasonMaxEpisode(currentSeasonNum);

        if (maxEpisodeInCurrentSeason && nextEpisodeNum <= maxEpisodeInCurrentSeason) {
            updatePlayingEpisode(currentSeasonNum, nextEpisodeNum); 
        } else {
            const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === currentSeasonNum);
            const nextSeason = availableSeasons[currentSeasonIndex + 1];
            if (nextSeason) {
                const nextSeasonStartEpisode = getCurrentSeasonMinEpisode(nextSeason.season_number);
                updatePlayingEpisode(nextSeason.season_number, nextSeasonStartEpisode); 
                setSelectedSeason(nextSeason); 
            }
        }
        stopCountdown(); 
    }, [playingEpisode, isTV, updatePlayingEpisode, getCurrentSeasonMaxEpisode, getCurrentSeasonMinEpisode, availableSeasons]);


    const handlePreviousEpisode = useCallback(() => {
        if (!playingEpisode || !isTV) return;
        const currentSeasonNum = playingEpisode.season_number;
        const currentEpisodeNum = playingEpisode.episode_number;
        const prevEpisodeNum = currentEpisodeNum - 1;
        const minEpisodeInCurrentSeason = getCurrentSeasonMinEpisode(currentSeasonNum);

        if (prevEpisodeNum >= minEpisodeInCurrentSeason) {
            updatePlayingEpisode(currentSeasonNum, prevEpisodeNum);
        } else {
            const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === currentSeasonNum);
            const previousSeason = availableSeasons[currentSeasonIndex - 1]; 
            if (previousSeason) {
                const prevSeasonMaxEpisode = getCurrentSeasonMaxEpisode(previousSeason.season_number);
                updatePlayingEpisode(previousSeason.season_number, prevSeasonMaxEpisode || 1);
                setSelectedSeason(previousSeason);
            }
        }
        stopCountdown(); 
    }, [playingEpisode, isTV, updatePlayingEpisode, getCurrentSeasonMinEpisode, getCurrentSeasonMaxEpisode, availableSeasons]);


    const handleSeasonSelect = useCallback((seasonDetails) => {
        setCurrentSeasonDetails(seasonDetails);
    }, []);

    const handleSeasonDropdownChange = useCallback((season) => {
        const nextSeasonNumber = season.season_number;
        const firstEpisodeNumber = getCurrentSeasonMinEpisode(nextSeasonNumber);
        setSelectedSeason(season);
        updatePlayingEpisode(nextSeasonNumber, firstEpisodeNumber); 
        setIsSeasonListOpen(false); 
    }, [getCurrentSeasonMinEpisode, updatePlayingEpisode]);

    const handleBackToDetails = useCallback(() => {
        router.back(); 
    }, [router]);

    useEffect(() => {
        if (availableSeasons.length > 0 && !selectedSeason) {
            const initialSeasonData = availableSeasons.find(s => s.season_number === initialSeason) || availableSeasons.find(s => s.season_number === 1) || availableSeasons[0];
            setSelectedSeason(initialSeasonData);
            if (isTV && window.innerWidth < 768) setActiveTab('episodes'); 
        }
    }, [availableSeasons, initialSeason, selectedSeason, isTV]);


    // ===================================================================
    // getEmbedUrl FUNCTION (UPDATED)
    // ===================================================================
    const getEmbedUrl = useCallback(() => {
        if (jellyfinSource) return jellyfinSource;

        const episodeNum = playingEpisode.episode_number || 1; 
        const seasonNum = playingEpisode.season_number || 1; 
        const itemTitle = movie.title || movie.name;

        let baseTitle = itemTitle.replace(/\s*\(.*?\)\s*$/, '').trim().replace(/^(the|a)\s+/i, '').replace(/[^\w\s-]/g, '').trim();

        if (Object.keys(streamupEmbedMap).length > 0) {
            if (!isTV) {
                const movieLinks = streamupEmbedMap[baseTitle];
                if (movieLinks?.[0]?.[0]) return movieLinks[0][0];
            } else {
                const streamupLinksForShow = streamupEmbedMap[baseTitle];
                if (streamupLinksForShow?.[seasonNum]?.[episodeNum]) {
                    return streamupLinksForShow[seasonNum][episodeNum]; 
                }
            }
        }

        let links = CUSTOM_EMBED_LINKS[movie.id] || CUSTOM_EMBED_LINKS_2[movie.id];
        if (links) {
            if (typeof links === 'object' && !Array.isArray(links)) {
                const seasonLinks = links[seasonNum];
                if (Array.isArray(seasonLinks) && seasonLinks.length > 0) {

                    // --- NEW YOUTUBE PLAYLIST LOGIC ---
                    if (seasonLinks.length === 1 && seasonLinks[0].includes('videoseries')) {
                        return `${seasonLinks[0]}&index=${episodeNum}`;
                    }
                    // ----------------------------------

                    let linkIndex = episodeNum - (getCustomRange(movie.id, seasonNum, 'start') || 1);
                    if (linkIndex >= 0 && linkIndex < seasonLinks.length) {
                        return seasonLinks[linkIndex];
                    }
                }
            } else if (Array.isArray(links)) {
                return links[episodeNum - 1] || links[0];
            } else if (typeof links === 'string') {
                return links;
            }
        }

        return isTV 
            ? `https://player.vidplus.to/embed/tv/${movie.id}/${seasonNum}/${episodeNum}`
            : `https://player.vidplus.to/embed/movie/${movie.id}`;
    }, [jellyfinSource, movie.id, movie.title, movie.name, isTV, playingEpisode, getCustomRange, streamupEmbedMap]);

    const embedUrl = getEmbedUrl();
    const hasEpisodes = seasons.length > 0 && isTV; 
    const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === playingEpisode.season_number);
    const currentMaxEpisode = getCurrentSeasonMaxEpisode(playingEpisode.season_number);
    const currentMinEpisode = getCurrentSeasonMinEpisode(playingEpisode.season_number);
    const isLastEpisodeOfSeason = playingEpisode.episode_number === currentMaxEpisode;
    const canSkipToNextEpisode = isLastEpisodeOfSeason ? currentSeasonIndex < availableSeasons.length - 1 : playingEpisode.episode_number < currentMaxEpisode;
    const canSkipToPreviousEpisode = playingEpisode.episode_number > currentMinEpisode || currentSeasonIndex > 0;
    const canSkipToNextSeason = currentSeasonIndex !== -1 && currentSeasonIndex < availableSeasons.length - 1;
    const canSkipToPreviousSeason = currentSeasonIndex > 0;

    const { countdown, startCountdown, stopCountdown } = useAutoPlayNext(nextEpisode, handleNextEpisode);

    useEffect(() => {
        if (!isTV || !currentEpisodeDetails) {
            stopCountdown();
            return;
        }
        const MOCK_START_DELAY_MS = 40000; 
        const mockEndTimer = setTimeout(() => {
            if (nextEpisode) startCountdown();
        }, MOCK_START_DELAY_MS); 
        return () => {
            clearTimeout(mockEndTimer);
            stopCountdown();
        };
    }, [currentEpisodeDetails, isTV, nextEpisode, startCountdown, stopCountdown]); 


    // --- MEMOIZED UI COMPONENTS ---
    const renderSeasonSelector = useCallback((isMobile) => (
        <div className="flex justify-between items-center w-full gap-1"> 
            <button
                onClick={() => {
                    const previousSeason = availableSeasons[currentSeasonIndex - 1]; 
                    if (previousSeason) handleSeasonDropdownChange(previousSeason);
                }}
                disabled={!canSkipToPreviousSeason}
                className={`flex items-center text-xs lg:text-sm font-semibold p-2 rounded-lg transition duration-200 ${!isMobile ? 'hidden md:flex' : ''} ${canSkipToPreviousSeason ? 'text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
                title="Previous Season"
            >
                <ArrowLeft size={16} className="md:mr-1 lg:mr-1" /> <span className="hidden lg:inline">Prev</span>
            </button>

            <div className={`relative z-20 flex-1 ${isMobile ? 'flex justify-center' : 'mx-1'}`}>
                <button
                    className="flex items-center text-sm lg:text-base font-bold transition text-pink-500 bg-gray-800/70 rounded-xl px-3 py-2 hover:bg-gray-700 w-full min-w-[120px] justify-center" 
                    onClick={() => setIsSeasonListOpen(prev => !prev)}
                >
                    <span className="truncate max-w-[120px] lg:max-w-[140px]">
                        {selectedSeason ? selectedSeason.name : 'Select Season'}
                    </span>
                    <ChevronDown className={`w-4 h-4 lg:w-5 lg:h-5 ml-1 flex-shrink-0 transition-transform ${isSeasonListOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                {isSeasonListOpen && (
                    <div className="absolute right-0 lg:left-0 mt-2 w-full min-w-[150px] max-h-48 overflow-y-auto bg-gray-800 border-2 border-pink-600 rounded-lg shadow-xl z-[60]">
                        {availableSeasons.map((season) => (
                            <div
                                key={season.id}
                                className={`cursor-pointer text-sm transition-colors p-3 ${selectedSeason?.id === season.id ? 'bg-pink-600 font-semibold' : 'hover:bg-white/10'}`}
                                onClick={() => handleSeasonDropdownChange(season)}
                            >
                                {season.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={() => {
                    const nextSeason = availableSeasons[currentSeasonIndex + 1];
                    if (nextSeason) handleSeasonDropdownChange(nextSeason);
                }}
                disabled={!canSkipToNextSeason}
                className={`flex items-center text-xs lg:text-sm font-semibold p-2 rounded-lg transition duration-200 ${!isMobile ? 'hidden md:flex' : ''} ${canSkipToNextSeason ? 'text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
                title="Next Season"
            >
                <span className="hidden lg:inline">Next</span> <ArrowRight size={16} className="ml-1" />
            </button>
        </div>
    ), [availableSeasons, currentSeasonIndex, canSkipToPreviousSeason, canSkipToNextSeason, selectedSeason, isSeasonListOpen, handleSeasonDropdownChange]);


    const renderTabContent = useCallback(() => (
        <div className="p-4 sm:p-6 h-[50vh] md:h-auto overflow-y-auto scrollbar-hide">
            {activeTab === 'related' ? (
               <RelatedContent recommendations={recommendations} /> 
            ) : (
                <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6 text-gray-300"> 
                    <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Overview</h3> 
                    <p className="text-base leading-relaxed">{movie.overview || "No overview available."}</p>
                    <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm"> 
                        {movie.release_date && <p><strong>Release Date:</strong> {new Date(movie.release_date).toLocaleDateString()}</p>}
                        {movie.vote_average > 0 && <p className="flex items-center"><strong>Rating:</strong> <Star size={14} className="text-yellow-400 fill-yellow-400 ml-1 mr-0.5" /> {movie.vote_average.toFixed(1)}</p>}
                        {movie.runtime && !isTV && <p><strong>Runtime:</strong> {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</p>}
                        {movie.genres?.length > 0 && <p><strong>Genres:</strong> {movie.genres.map(g => g.name).join(', ')}</p>}
                    </div>
                </div>
            )}
        </div>
    ), [activeTab, movie, isTV, recommendations]);


    return (
        <div className="fixed top-0 inset-0 bg-black text-white w-full h-full animate-fade-in z-[1000] overflow-hidden">
            <div className="flex flex-col md:flex-row h-full w-full"> 

                {/* Left/Main Column: Scrollable on mobile, but player container will pin via CSS */}
                <div className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto md:overflow-y-auto scrollbar-hide"> 

                    {/* Fixed Player Wrapper on Mobile via sticky placement */}
                    <div className="sticky top-0 z-40 md:relative flex-shrink-0 bg-gray-900 shadow-2xl border-b border-gray-800">
                        <div 
                            ref={playerContainerRef}
                            onMouseMove={handleMouseMove}
                            className={`relative w-full aspect-video animate-fade-in bg-black group overflow-hidden ${!showControls && isPlaying ? 'cursor-none' : 'cursor-default'}`}
                        > 
                            <div className={`absolute top-0 left-0 right-0 p-4 z-50 pointer-events-none bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="flex items-center gap-2 sm:gap-3 w-full">
                                    <button className="flex-shrink-0 pointer-events-auto bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-pink-600 transition-all shadow-md" onClick={handleBackToDetails}>
                                        <ArrowLeft size={20} />
                                    </button>

                                    <div className="flex flex-col flex-grow min-w-0 pr-2">
                                        <h2 className="text-white font-bold text-sm md:text-lg drop-shadow-lg truncate">{title}</h2>
                                        {isTV && (
                                            <span className="text-pink-400 text-[10px] md:text-xs font-medium drop-shadow-md truncate">
                                                S{playingEpisode.season_number} E{playingEpisode.episode_number} • {currentEpisodeDetails?.name || `Episode ${playingEpisode.episode_number}`}
                                            </span>
                                        )}
                                    </div>

                                    {/* HIDDEN ON MOBILE: Desktop Sidebar toggle button inside the header */}
                                    {hasEpisodes && (
                                        <button 
                                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                            className={`hidden md:flex flex-shrink-0 pointer-events-auto ml-auto md:ml-2 p-2 rounded-full transition-colors backdrop-blur-md ${isSidebarOpen ? 'bg-pink-600 text-white' : 'bg-black/40 text-gray-300 hover:bg-white/20'}`}
                                            title="Toggle Episode List"
                                        >
                                            <List size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isSearching ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-900/90 text-pink-500">
                                    <Loader2 className="animate-spin mr-2" size={24} /> Resolving Media...
                                </div>
                            ) : jellyfinSource ? (
                                <div className="relative w-full h-full group/player">
                                    <video 
                                        ref={videoRef}
                                        src={embedUrl} 
                                        autoPlay 
                                        muted         
                                        playsInline         
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-contain cursor-pointer"
                                        onTimeUpdate={handleTimeUpdate}
                                        onClick={togglePlay}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        key={embedUrl}
                                    />

                                    {!isPlaying && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="bg-pink-600/80 p-6 rounded-full animate-pulse shadow-2xl shadow-pink-500/50">
                                                <Play size={40} fill="white" />
                                            </div>
                                        </div>
                                    )}

                                    <div className={`absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-500 z-50 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                                        <div 
                                            className="group/rail relative w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer"
                                            onClick={handleSeek}
                                        >
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-pink-600 shadow-[0_0_10px_#db2777]" 
                                                style={{ width: `${progress}%` }}
                                            />
                                            <div 
                                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-pink-600 rounded-full scale-0 group-hover/rail:scale-100 transition-transform shadow-lg shadow-pink-500/50" 
                                                style={{ left: `${progress}%`, marginLeft: '-8px' }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-6">
                                                <button onClick={togglePlay} className="hover:text-pink-500 transition-colors">
                                                    {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="currentColor" />}
                                                </button>

                                                <button onClick={() => videoRef.current.currentTime -= 10}><SkipBack size={20} /></button>
                                                <button onClick={() => videoRef.current.currentTime += 10}><SkipForward size={20} /></button>

                                                <div className="hidden sm:flex items-center gap-2 group/vol">
                                                    <Volume2 size={20} className="text-gray-400" />
                                                    <input 
                                                        type="range" 
                                                        className="w-0 group-hover/vol:w-20 transition-all accent-pink-500 cursor-pointer"
                                                        onChange={(e) => {
                                                            if (videoRef.current) {
                                                                videoRef.current.volume = e.target.value;
                                                                if (e.target.value > 0) {
                                                                    videoRef.current.muted = false; 
                                                                }
                                                            }
                                                        }}
                                                        min="0" max="1" step="0.1"
                                                        defaultValue="0" 
                                                    />
                                                </div>

                                                <span className="text-xs font-mono text-gray-300">
                                                    {videoRef.current ? Math.floor(videoRef.current.currentTime / 60) : "0"}:
                                                    {videoRef.current ? Math.floor(videoRef.current.currentTime % 60).toString().padStart(2, '0') : "00"} 
                                                    <span className="mx-2 opacity-40">/</span>
                                                    {videoRef.current ? Math.floor(videoRef.current.duration / 60) : "0"}:
                                                    {videoRef.current ? Math.floor(videoRef.current.duration % 60).toString().padStart(2, '0') : "00"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* HIDDEN ON MOBILE: Desktop Sidebar toggle button in bottom controls */}
                                                {hasEpisodes && (
                                                    <button 
                                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                                                        className={`hidden md:block p-2 hover:bg-white/10 rounded-lg transition-colors ${isSidebarOpen ? 'text-pink-500' : 'text-white'}`}
                                                        title="Episodes List"
                                                    >
                                                        <List size={20} />
                                                    </button>
                                                )}

                                                <Settings size={20} className="hover:rotate-45 transition-transform cursor-pointer" />
                                                <button 
                                                    onClick={toggleFullscreen}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                >
                                                    <Maximize size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <iframe
                                    ref={iframeRef} 
                                    src={embedUrl}
                                    allowFullScreen
                                    allow="autoplay; encrypted-media" 
                                    className="w-full h-full object-cover animate-fade-in"
                                    key={embedUrl} 
                                />
                            )}

                            {countdown !== null && nextEpisode && (
                                <AutoPlayOverlay nextEpisode={nextEpisode} countdown={countdown} onCancel={stopCountdown} onPlayNow={handleNextEpisode} />
                            )}
                        </div>

                        {/* Title and Controls under video */}
                        <div className="p-4 sm:p-6 bg-gray-950/40">
                            <div className="flex flex-row justify-between items-center gap-4"> 
                                <div className="flex-grow min-w-0"> 
                                    <h3 className="text-white text-base md:text-xl truncate">{title}</h3> 
                                    {isTV && (
                                        <p className="text-xs md:text-base mt-0.5 truncate"> 
                                            <span className="text-pink-400 mr-1 font-semibold">S{playingEpisode.season_number}</span> 
                                            <span className="text-white font-bold">E{playingEpisode.episode_number}</span>: 
                                            <span className="text-gray-300 ml-1"> {currentEpisodeDetails?.name || `Episode ${playingEpisode.episode_number}`}</span>
                                        </p>
                                    )}
                                </div>
                                {hasEpisodes && (
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <button onClick={handlePreviousEpisode} disabled={!canSkipToPreviousEpisode} className={`p-2 rounded-full transition duration-200 shadow-xl ${canSkipToPreviousEpisode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'}`}>
                                            <SkipBack size={14} /> 
                                        </button>
                                        <button onClick={handleNextEpisode} disabled={!canSkipToNextEpisode} className={`p-2 rounded-full transition duration-200 shadow-2xl ${canSkipToNextEpisode ? 'bg-pink-600 hover:bg-pink-500 text-white' : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'}`}>
                                            <SkipForward size={14} /> 
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div> 

                    {/* Metadata tabs scroll under the sticky mobile header */}
                    <div className="flex-grow bg-black">
                        <div className="border-t border-gray-900">
                            <div className="flex border-b border-gray-900 bg-gray-950 px-4 sm:px-6 sticky top-[var(--video-height)] z-30 md:relative">
                                <button className={`py-3 px-4 flex items-center gap-2 font-semibold transition-colors text-sm ${activeTab === 'info' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('info')}><Info size={16} /> Info</button>
                                <button className={`py-3 px-4 flex items-center gap-2 font-semibold transition-colors text-sm ${activeTab === 'related' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('related')}><Star size={16} /> Related</button>

                                {/* Episodes tab available on mobile regardless of sidebar state */}
                                {hasEpisodes && (
                                    <button 
                                        className={`md:hidden py-3 px-4 flex items-center gap-2 font-semibold transition-colors text-sm ${activeTab === 'episodes' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-400 hover:text-white'}`} 
                                        onClick={() => setActiveTab('episodes')}
                                    >
                                        <List size={16} /> Episodes
                                    </button>
                                )}
                            </div>
                        </div>
                        {activeTab !== 'episodes' ? renderTabContent() : (
                                <div className="p-4 h-[50vh] overflow-y-auto scrollbar-hide sm:p-6 md:hidden">
                                    <div className="pb-4">{renderSeasonSelector(true)}</div>
                                    <EpisodesListWithScroll 
                                        tvId={movie.id} 
                                        seasons={seasons} 
                                        onEpisodeClick={handleEpisodeClick} 
                                        onSeasonSelect={handleSeasonSelect} 
                                        currentPlayingSeasonNumber={playingEpisode.season_number} 
                                        currentPlayingEpisodeNumber={playingEpisode.episode_number} 
                                        selectedSeason={selectedSeason} 
                                        episodeFilter={episodeFilter} 
                                        isBlurEnabled={isBlurEnabled}
                                        movie={movie} 
                                    />
                                </div>
                            )}
                    </div>
                </div>

                {/* Sidebar Area: STRICTLY Desktop Layout container */}
                {hasEpisodes && (
                    <div className={`
                        hidden md:flex flex-col flex-shrink-0 bg-gray-900 relative border-l border-gray-800 z-10 transition-all duration-300 ease-in-out
                        ${isSidebarOpen 
                            ? 'w-80 lg:w-96 opacity-100' 
                            : 'w-0 opacity-0 overflow-hidden border-none'
                        }
                    `}>
                        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md z-30 p-4 border-b border-pink-600/50 shadow-xl flex-shrink-0">
                            <div className="flex items-center justify-between w-full">
                                {renderSeasonSelector(false)}
                            </div>
                        </div>
                        <div className="p-3 lg:p-4 flex-grow overflow-y-auto scrollbar-hide">
                            <EpisodesListWithScroll 
                                tvId={movie.id} 
                                seasons={seasons} 
                                onEpisodeClick={handleEpisodeClick} 
                                onSeasonSelect={handleSeasonSelect} 
                                currentPlayingSeasonNumber={playingEpisode.season_number} 
                                currentPlayingEpisodeNumber={playingEpisode.episode_number} 
                                selectedSeason={selectedSeason} 
                                episodeFilter={episodeFilter}
                                isBlurEnabled={isBlurEnabled}
                                movie={movie} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DedicatedPlayerScreen;
