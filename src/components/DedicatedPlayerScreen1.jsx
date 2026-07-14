import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { 
    Play, 
    ArrowLeft, 
    ArrowRight ,
    ChevronDown, 
    SkipBack, 
    SkipForward, 
    Loader, 
    Star, 
    Info,
    List, 
    X, 
} from "lucide-react"; 
import { useNavigate, useSearchParams } from "react-router-dom";

// Assuming these paths exist in your project structure
import useAutoPlayNext from "../hooks/useAutoPlayNext"; 
import AutoPlayOverlay from "../components/AutoPlayOverlay"; 
import { CUSTOM_EMBED_LINKS } from "../data/customEmbedLinks"; 
import { CUSTOM_EMBED_LINKS_2 } from "../data/customEmbedLinks2"; 
import { CUSTOM_EPISODE_RANGES } from "../data/customEpisodeRanges"; 
import RelatedContent from "./RelatedContent"; 


// --- API Configurations ---
const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY; 
const STREAMUP_API_KEY = import.meta.env.VITE_STREAMUP_API_KEY; 
const STREAMUP_EMBED_BASE = 'https://streamup.cc/';


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

/**
 * Processes the Streamup API search response into a key-value map 
 * for quick lookup (Title -> Season -> Episode -> Link).
 */
const processStreamupVideos = (videos) => {
    const tvRegex = /(.*?)\s*-\s*|(?<=\s|^)(.*?)\s*(?:S(\d+)|s(\d+))\s*(?:E(\d+)|e(\d+))/i;
    const embedMap = {};

    videos.forEach(video => {
        if (!video.Filecode) return;

        // Clean the title for use as the map key (e.g., "Death Note - S01E01" -> "Death Note")
        let videoTitleClean = video.title.split(/\s*S\d+E\d+\s*/i)[0].trim();
        videoTitleClean = videoTitleClean.replace(/\s*\(.*?\)\s*$/, '').trim(); 
        videoTitleClean = videoTitleClean.replace(/[^a-zA-Z0-9\s-:]/g, '').trim(); 

        const match = video.title.match(tvRegex);
        const embedUrl = `${STREAMUP_EMBED_BASE}${video.Filecode}`;

        if (match) {
            // TV SHOW LOGIC (S#E# found)
            let showTitle = videoTitleClean; 
            let seasonNum = parseInt(match[3] || match[4]); 
            let episodeNum = parseInt(match[5] || match[6]); 

            if (!showTitle || isNaN(seasonNum) || isNaN(episodeNum)) {
                return; 
            }

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
            // MOVIE LOGIC (No S#E# found)
            const movieTitle = videoTitleClean;

            if (!embedMap[movieTitle]) { embedMap[movieTitle] = {}; }

            // Store the movie link at map[TITLE][0][0]
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
    episodeFilter
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
            // Scroll to the currently playing episode
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
                <div className="flex justify-center items-center p-4"><Loader size={14} className="animate-spin" /> Loading episodes... </div>
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
                                        flex gap-4 p-3 rounded-xl transition-all duration-300 cursor-pointer 
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

                                    {/* Thumbnail */}
                                    <div className="relative flex-shrink-0 w-36 h-20 rounded-lg overflow-hidden bg-white/10 group-hover:scale-[1.02] transition-transform duration-300">
                                        <img
                                            src={
                                                episode.still_path
                                                    ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
                                                    : '/No-Poster.png'
                                            }
                                            alt={`S${seasonNumber} E${episodeNumber}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-end justify-start p-1.5 transition-opacity">
                                            <span className="text-white text-xs font-bold bg-pink-600 px-2 py-0.5 rounded-br-md rounded-tr-md">
                                                E{episodeNumber}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-grow flex flex-col justify-start py-0.5">
                                        <p className="text-xs font-medium text-pink-400 mb-1">
                                            Season {seasonNumber}
                                        </p>
                                        <h3 className={`font-semibold line-clamp-2 ${isCurrentEpisode ? 'text-pink-300 group-hover:text-pink-100' : 'text-gray-200 group-hover:text-white'} transition-colors duration-200`}>
                                            {episodeNumber}. {episodeName}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
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
const DedicatedPlayerScreen = ({ movie, isTV }, ref) => { 

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams(); 

    const title = movie?.title || movie?.name;
    const slug = useMemo(() => createSlug(title), [title]);

    if (!movie) {
        useEffect(() => {
            navigate("/", { replace: true });
        }, [navigate]);
        return null;
    }

    const initialSeason = parseInt(searchParams.get('s')) || 1;
    const initialEpisode = parseInt(searchParams.get('e')) || 1;

    const seasons = useMemo(() => movie.seasons || [], [movie.seasons]);

    // --- STREAMUP STATES (Holds only search results) ---
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
    const iframeRef = useRef(null); 


    // ===================================================================
    // HOOK: TARGETED STREAMUP SEARCH
    // Runs once per show title to fetch its video links efficiently.
    // ===================================================================
    useEffect(() => {
        if (!title || isSearching ||  searchTitle === title) return;

        // Only search if the title is new or if we haven't searched yet
        if (searchTitle === title) return;

        const performStreamupSearch = async () => {
            setIsSearching(true);
            setSearchTitle(title);
            setStreamupVideos([]); // Clear previous results

            // Use the base title for the search query
            const searchTitleQuery = title.replace(/\s*\(.*?\)\s*$/, '').trim(); 
            const encodedTitle = encodeURIComponent(searchTitleQuery);

            const SEARCH_API_URL = 
                `https://api.streamup.cc/v1/data?api_key=${STREAMUP_API_KEY}&search=${encodedTitle}&page=1&per_page=100`;

            try {
                console.log(`Searching Streamup for: ${searchTitleQuery}...`);
                const response = await fetch(SEARCH_API_URL);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.videos && Array.isArray(data.videos)) {
                    console.log(`Found ${data.videos.length} results for ${searchTitleQuery}`);
                    setStreamupVideos(data.videos); 
                } else {
                    setStreamupVideos([]);
                }
            } catch (error) {
                console.error("Streamup Search Failed:", error); 
                setStreamupVideos([]); 
            } finally {
                setIsSearching(false);
            }
        };

        performStreamupSearch();

    }, [title, isSearching, searchTitle, setStreamupVideos]);


    // ===================================================================
    // EPISODE & SEASON UTILITIES (Unchanged)
    // ===================================================================

    const updatePlayingEpisode = useCallback((season, episode) => {
        setPlayingEpisode({
            season_number: season,
            episode_number: episode,
        });
        setSearchParams({ s: season, e: episode, slug: slug }, { replace: true }); 
    }, [setSearchParams, slug]); 

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
        } else {
            setCurrentEpisodeDetails(null);
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
        if (customEnd !== undefined) {
            return customEnd;
        }
        return currentSeasonDetails?.episodes?.length || 0; 
    }, [movie.id, currentSeasonDetails, getCustomRange]);

    const availableSeasons = useMemo(() => seasons.filter(s => s.season_number > 0).sort((a, b) => a.season_number - b.season_number), [seasons]);


    // --- AUTOPLAY LOGIC (Finding Next Episode) ---
    const [nextEpisode, nextEpisodeDetailsFromTMDB] = useMemo(() => {
        if (!isTV) return [null, null];

        const currentSeasonNum = playingEpisode.season_number;
        const currentEpisodeNum = playingEpisode.episode_number;
        const currentMaxEp = getCurrentSeasonMaxEpisode(currentSeasonNum);
        const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === currentSeasonNum);

        let nextEpData = null;
        let nextEpTMDB = null;

        if (currentEpisodeNum < currentMaxEp) {
            const nextEpisodeNum = currentEpisodeNum + 1;
            nextEpTMDB = currentSeasonDetails?.episodes?.find(e => e.episode_number === nextEpisodeNum);

            nextEpData = {
                season_number: currentSeasonNum,
                episode_number: nextEpisodeNum,
                title: nextEpTMDB?.name || `Episode ${nextEpisodeNum}`,
                path: `/watch/${slug}?s=${currentSeasonNum}&e=${nextEpisodeNum}`
            };

        } else if (currentSeasonIndex < availableSeasons.length - 1) {
            const nextSeason = availableSeasons[currentSeasonIndex + 1];
            const nextSeasonStartEpisode = getCurrentSeasonMinEpisode(nextSeason.season_number);

            nextEpData = {
                season_number: nextSeason.season_number,
                episode_number: nextSeasonStartEpisode,
                title: nextSeason.name || `Season ${nextSeason.season_number}`,
                path: `/watch/${slug}?s=${nextSeason.season_number}&e=${nextSeasonStartEpisode}`
            };
        }

        return [nextEpData, nextEpTMDB];
    }, [isTV, playingEpisode, getCurrentSeasonMaxEpisode, availableSeasons, getCurrentSeasonMinEpisode, currentSeasonDetails, slug]);
    // ---------------------------------------------


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
            } else {
                alert("Congratulations! You've reached the end of the available episodes.");
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
                const targetEpisode = prevSeasonMaxEpisode || 1; 

                updatePlayingEpisode(previousSeason.season_number, targetEpisode);
                setSelectedSeason(previousSeason);
            } else {
                alert("You are already on the first episode of the first season.");
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
        navigate(-1); 
    }, [navigate]);

    useEffect(() => {
        if (availableSeasons.length > 0 && !selectedSeason) {
            const initialSeasonData = availableSeasons.find(s => s.season_number === initialSeason) || availableSeasons.find(s => s.season_number === 1) || availableSeasons[0];
            setSelectedSeason(initialSeasonData);
            if (isTV) {
                 setActiveTab('episodes'); 
            }
        }
    }, [availableSeasons, initialSeason, selectedSeason, isTV]);


    // ===================================================================
    // getEmbedUrl FUNCTION (Main Link Resolver)
    // ===================================================================
    const getEmbedUrl = useCallback(() => {
        const episodeNum = playingEpisode.episode_number || 1; 
        const seasonNum = playingEpisode.season_number || 1; 
        const itemTitle = movie.title || movie.name;

        // 1. DETERMINE THE BASE TITLE FOR STREAMUP LOOKUP (Aggressive Cleaning)
        let baseTitle = itemTitle;

        baseTitle = baseTitle.replace(/\s*\(.*?\)\s*$/, '').trim(); 
        baseTitle = baseTitle.replace(/^(the|a)\s+/i, '').trim(); 
        baseTitle = baseTitle.replace(/[-\s]*(TV\s*Series|The\s*Movie|Part\s*\d)\s*$/gi, '').trim(); 
        baseTitle = baseTitle.replace(/[\s.-]*$/, '').trim(); 
        baseTitle = baseTitle.replace(/[^\w\s-]/g, '').trim(); 


        let secondaryBaseTitle = null;
        if (isTV && currentSeasonDetails && currentSeasonDetails.name && seasonNum === currentSeasonDetails.season_number) {
             // For arc-based shows (e.g., Black Butler: Public School Arc)
             secondaryBaseTitle = `${itemTitle}: ${currentSeasonDetails.name}`;
             secondaryBaseTitle = secondaryBaseTitle.replace(/: Season \d+/i, '').replace(/: The Movie/i, '').trim();
             secondaryBaseTitle = secondaryBaseTitle.replace(/\s*\(.*?\)\s*$/, '').trim(); 
             secondaryBaseTitle = secondaryBaseTitle.replace(/[^\w\s-]/g, '').trim(); 
        }

        // 2. CHECK DYNAMIC STREAMUP DATA (from the search results)
        if (Object.keys(streamupEmbedMap).length > 0) {

            // A. Handle MOVIES
            if (!isTV) {
                const movieLinks = streamupEmbedMap[baseTitle];
                if (movieLinks && movieLinks[0] && movieLinks[0][0]) {
                    return movieLinks[0][0];
                }
            }

            // B. Handle TV Shows
            if (isTV) {

                const potentialTitles = [baseTitle];

                // 2.1. Try Arc-Specific Title
                if (secondaryBaseTitle) {
                    potentialTitles.unshift(secondaryBaseTitle);
                }

                // 2.2. Try Japanese Rōmaji titles for common anime
                if (itemTitle.toLowerCase().includes('death note')) {
                    potentialTitles.push('Desu Nōto'); 
                }
                if (itemTitle.toLowerCase().includes('black butler')) {
                    potentialTitles.push('Kuroshitsuji'); 
                }

                const uniqueTitles = [...new Set(potentialTitles.filter(t => t.length > 0))];

                for (const checkTitle of uniqueTitles) {
                    const streamupLinksForShow = streamupEmbedMap[checkTitle];

                    if (streamupLinksForShow) {
                        const seasonLinks = streamupLinksForShow[seasonNum];

                        if (seasonLinks && seasonLinks[episodeNum]) {
                            return seasonLinks[episodeNum]; 
                        }
                    }
                }
            }
        }

        // 3. FALLBACK to existing CUSTOM_EMBED_LINKS logic...

        let links = CUSTOM_EMBED_LINKS[movie.id] || CUSTOM_EMBED_LINKS_2[movie.id];

        if (links) {
            if (typeof links === 'object' && !Array.isArray(links)) {
                const seasonLinks = links[seasonNum];
                if (seasonLinks && Array.isArray(seasonLinks)) {
                    let linkIndex = episodeNum - 1; 
                    const startEpisode = getCustomRange(movie.id, seasonNum, 'start');

                    if (startEpisode !== undefined) {
                        linkIndex = episodeNum - startEpisode; 
                    }

                    if (linkIndex >= 0 && linkIndex < seasonLinks.length) {
                        let url = seasonLinks[linkIndex];
                        if (url.includes('drive.google.com')) {
                            url = url.replace('/view?usp=drivesdk', '/preview');
                            url = url.replace(/\/file\/d\/([\w-]+)\/view/g, '/file/d/$1/preview');
                        }
                        return url;
                    }
                }
            }
            if (Array.isArray(links)) {
                let url = links[episodeNum - 1] || links[0];
                if (url) {
                    return url;
                }
            }
            if (typeof links === 'string') {
                return links;
            }
        }

        // 4. FINAL FALLBACK LINK (Search/Generic Player)
        const encodedTitle = encodeURIComponent(itemTitle);
        if (isTV) {
            return `https://search.fallbackplayer.com/?q=${encodedTitle}+S${seasonNum}E${episodeNum}`; 
        } else {
            return `https://player.vidplus.to/embed/movie/${movie.id}`;
        }
    }, [
        movie.id, 
        movie.title, 
        movie.name, 
        isTV, 
        playingEpisode.episode_number, 
        playingEpisode.season_number, 
        getCustomRange, 
        streamupEmbedMap, 
        currentSeasonDetails
    ]);

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

    // --- HOOK INTEGRATION ---
    const { countdown, startCountdown, stopCountdown } = useAutoPlayNext(
        nextEpisode, 
        handleNextEpisode
    );

    // --- MANUAL START COUNTDOWN EFFECT (MOCK VIDEO END) ---
    useEffect(() => {
        if (!isTV || !currentEpisodeDetails) {
            stopCountdown();
            return;
        }

        const MOCK_START_DELAY_MS = 30000; 

        const mockEndTimer = setTimeout(() => {
            if (nextEpisode) {
                startCountdown();
            }
        }, MOCK_START_DELAY_MS); 

        return () => {
            clearTimeout(mockEndTimer);
            stopCountdown();
        };
    }, [currentEpisodeDetails, isTV, nextEpisode, startCountdown, stopCountdown]); 


    const renderSeasonSelector = (isMobile) => { 
        const baseClasses = "flex justify-between items-center w-full"; 
        const desktopOnlyClasses = "hidden md:flex"; 
        const mobileContainerClasses = "flex justify-center flex-grow"; 

        return (
            <div className={baseClasses}> 
                {/* Prev Season Button */}
                <button
                    onClick={() => {
                        const previousSeason = availableSeasons[currentSeasonIndex - 1]; 
                        if (previousSeason) {
                            handleSeasonDropdownChange(previousSeason);
                        }
                    }}
                    disabled={!canSkipToPreviousSeason}
                    className={`flex items-center text-sm font-semibold p-2 rounded-lg transition duration-200 
                        ${!isMobile ? desktopOnlyClasses : ''}
                        ${canSkipToPreviousSeason ? 'text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
                >
                    <ArrowLeft size={16} className="mr-1" /> {!isMobile ? 'Prev Season' : ''}
                </button>

                {/* Season Dropdown Container */}
                <div className={`relative z-20 mx-2 ${isMobile ? mobileContainerClasses : 'md:mx-0'}`}>
                    <button
                        className="flex items-center text-lg font-extrabold transition text-pink-500 bg-gray-800/70 rounded-xl px-4 py-2 hover:bg-gray-700 w-full min-w-[200px] justify-center" 
                        onClick={() => setIsSeasonListOpen(prev => !prev)}
                    >
                        <span className="max-w-[140px] whitespace-nowrap overflow-hidden text-ellipsis block">
                            {selectedSeason ? selectedSeason.name : 'Select Season'}
                        </span>
                        <ChevronDown className={`w-5 h-5 ml-1 transition-transform ${isSeasonListOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                    {isSeasonListOpen && (
                        <div className="absolute right-0 mt-2 w-60 max-h-60 overflow-y-auto bg-gray-800 border-2 border-pink-600 rounded-lg shadow-xl z-20">
                            {availableSeasons.map((season) => (
                                <div
                                    key={season.id}
                                    className={`cursor-pointer text-sm transition-colors p-3 ${
                                        selectedSeason && selectedSeason.id === season.id
                                            ? 'bg-pink-600 font-semibold' 
                                            : 'hover:bg-white/10' 
                                    }`}
                                    onClick={() => handleSeasonDropdownChange(season)}
                                >
                                    {season.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Next Season Button */}
                <button
                    onClick={() => {
                        const nextSeason = availableSeasons[currentSeasonIndex + 1];
                        if (nextSeason) {
                            handleSeasonDropdownChange(nextSeason);
                        }
                    }}
                    disabled={!canSkipToNextSeason}
                    className={`flex items-center text-sm font-semibold p-2 rounded-lg transition duration-200 
                        ${!isMobile ? desktopOnlyClasses : ''}
                        ${canSkipToNextSeason ? 'text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
                >
                    {!isMobile ? 'Next Season' : ''} <ArrowRight size={16} className="ml-1" />
                </button>
            </div>
        );
    };


    const renderTabContent = () => {
        if (!movie) return null; 

        if (activeTab === 'related') {
            return (
                <div className="p-4 sm:p-6">
                    <RelatedContent 
                        mediaId={movie.id} 
                        isTV={isTV} 
                    />
                </div>
            );
        }

        return (
            <div className="p-4 sm:p-6">
                <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6 text-gray-300"> 
                    <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Overview</h3> 
                    <p className="text-base leading-relaxed">{movie.overview || "No overview available."}</p>

                    <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm"> 
                        {movie.release_date && (
                            <p><strong>Release Date:</strong> {new Date(movie.release_date).toLocaleDateString()}</p>
                        )}
                        {movie.vote_average > 0 && (
                            <p className="flex items-center">
                                <strong>Rating:</strong> <Star size={14} className="text-yellow-400 fill-yellow-400 ml-1 mr-0.5" /> {movie.vote_average.toFixed(1)}
                            </p>
                        )}
                        {movie.runtime && !isTV && (
                            <p><strong>Runtime:</strong> {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</p>
                        )}
                        {movie.genres && movie.genres.length > 0 && (
                            <p><strong>Genres:</strong> {movie.genres.map(g => g.name).join(', ')}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    // -------------------------------------------------------------------
    // PLAYER SCREEN RENDER (JSX) 
    // -------------------------------------------------------------------
    return (
        <div className="fixed top-0 inset-0 bg-black text-white w-full animate-fade-in z-[1000]">
            <div className="flex flex-col md:flex-row h-full"> 

                <div 
                    className={`
                        w-full flex-shrink-0 transition-all duration-300 ease-in-out 
                        flex flex-col h-full 
                        ${isSidebarOpen && hasEpisodes ? 'md:w-2/3' : 'md:w-full'}
                    `}
                > 
                    <div className="flex-shrink-0 bg-gray-900 shadow-2xl z-20 border-b border-gray-800">

                        {/* Video Player Container */}
                        <div className="relative w-full aspect-video animate-fade-in bg-black group"> 

                            {/* --- ADDED: TOP FLOATING TITLE BAR --- */}
                            <div className="absolute top-0 left-0 right-0 p-4 z-50 pointer-events-none bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-100">
                                <div className="flex items-center gap-3">
                                    <button
                                        className="pointer-events-auto bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-pink-600 transition-all shadow-md"
                                        onClick={handleBackToDetails}
                                    >
                                        <ArrowLeft size={20} />
                                    </button>

                                    <div className="flex flex-col">
                                        <h2 className="text-white font-bold text-sm md:text-lg drop-shadow-lg line-clamp-1">
                                            {title}
                                        </h2>
                                        {isTV && (
                                            <span className="text-pink-400 text-[10px] md:text-xs font-medium drop-shadow-md">
                                                S{playingEpisode.season_number} E{playingEpisode.episode_number} • {currentEpisodeDetails?.name || `Episode ${playingEpisode.episode_number}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Conditional Rendering for Search Status */}
                            {isSearching ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-900/90 text-pink-500">
                                    <Loader className="animate-spin mr-2" size={24} /> Fetching video links...
                                </div>
                            ) : (
                                <iframe
                                    ref={iframeRef} 
                                    src={embedUrl}
                                    title="Content Player"
                                    allowFullScreen
                                    allow="autoplay; encrypted-media; gyroscope" 
                                    className="w-full h-full object-cover animate-fade-in"
                                    key={embedUrl} 
                                />
                            )}

                            {/* --- AUTO-PLAY OVERLAY --- */}
                            {countdown !== null && nextEpisode && (
                                <AutoPlayOverlay 
                                    nextEpisode={nextEpisode}
                                    countdown={countdown}
                                    onCancel={stopCountdown} 
                                    onPlayNow={handleNextEpisode} 
                                />
                            )}


                            {/* --- Sidebar Toggle Button (Mobile only) --- */}
                            {hasEpisodes && !isSidebarOpen && (
                                <button
                                    className="hidden absolute top-4 right-4 bg-pink-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-pink-500 transition-all flex items-center gap-1 text-sm font-medium z-50 shadow-md"
                                    onClick={() => setIsSidebarOpen(true)}
                                    title="Show Episode List"
                                >
                                    <List size={16} />
                                </button>
                            )}
                        </div>

                        {/* Episode Info and Navigation */}
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-row sm:justify-between sm:items-center gap-4"> 
                                <div className="flex-grow"> 
                                    <h3 className="font-extrabold text-white">{title}</h3> 
                                    {playingEpisode && isTV && (
                                        <p className="text-lg mt-1"> 
                                            <span className="text-pink-400 mr-1">S{playingEpisode.season_number}</span> 
                                            <span className="text-white font-bold">E{playingEpisode.episode_number}</span>: 
                                            <span className="text-gray-200 ml-1"> {currentEpisodeDetails?.name || `Episode ${playingEpisode.episode_number}`}</span>
                                        </p>
                                    )}
                                </div>

                                {hasEpisodes && (
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={handlePreviousEpisode}
                                            disabled={!canSkipToPreviousEpisode}
                                            className={`
                                                p-2 rounded-full transition duration-200 shadow-xl 
                                                ${canSkipToPreviousEpisode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'}
                                            `}
                                            title="Previous Episode"
                                        >
                                            <SkipBack size={15} /> 
                                        </button>
                                        <button
                                            onClick={handleNextEpisode}
                                            disabled={!canSkipToNextEpisode}
                                            className={`
                                                p-2 rounded-full transition duration-200 shadow-2xl 
                                                ${canSkipToNextEpisode ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/50 text-white' : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'}
                                            `}
                                            title="Next Episode"
                                        >
                                            <SkipForward size={15} /> 
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div> 


                    {/* SCROLLABLE TAB CONTENT BLOCK */}
                    <div className="flex-grow overflow-y-auto">
                        <div className="border-t border-gray-800 mt-0">
                            <div className="flex border-b border-gray-800 px-4 sm:px-6">
                                {/* Info Tab */}
                                <button
                                    className={`
                                        py-3 px-4 flex items-center gap-2 font-semibold transition-colors duration-200 
                                        ${activeTab === 'info' 
                                            ? 'text-pink-500 border-b-2 border-pink-500' 
                                            : 'text-gray-400 hover:text-white'
                                        }
                                    `}
                                    onClick={() => setActiveTab('info')} 
                                >
                                    <Info size={18} /> Info
                                </button>

                                {/* Related Content Tab */}
                                <button
                                    className={`
                                        py-3 px-4 flex items-center gap-2 font-semibold transition-colors duration-200 
                                        ${activeTab === 'related' 
                                            ? 'text-pink-500 border-b-2 border-pink-500' 
                                            : 'text-gray-400 hover:text-white'
                                        }
                                    `}
                                    onClick={() => setActiveTab('related')} 
                                >
                                    <Star size={18} /> Related
                                </button>

                                {/* Episode List Tab for small screens only */}
                                {hasEpisodes && !isSidebarOpen && (
                                    <button
                                        className={`

md:hidden py-3 px-4 flex items-center gap-2 font-semibold transition-colors duration-200 
                                            ${activeTab === 'episodes' 
                                                ? 'text-pink-500 border-b-2 border-pink-500' 
                                                : 'text-gray-400 hover:text-white'
                                            }
                                        `}
                                        onClick={() => setActiveTab('episodes')} 
                                    >
                                        <List size={18} /> Episodes
                                    </button>
                                )}
                            </div>

                            {/* Tab Content Renderer */}
                            {activeTab !== 'episodes' ? (
                                renderTabContent()
                            ) : (
                                <div className="p-4 sm:p-6 min-h-screen md:hidden">
                                    <div className="pb-4"> 
                                        {renderSeasonSelector(true)} 
                                    </div>
                                    <div>
                                        <EpisodesListWithScroll 
                                            tvId={movie.id} 
                                            seasons={seasons} 
                                            onEpisodeClick={handleEpisodeClick}
                                            onSeasonSelect={handleSeasonSelect} 
                                            currentPlayingSeasonNumber={playingEpisode.season_number} 
                                            currentPlayingEpisodeNumber={playingEpisode.episode_number}
                                            selectedSeason={selectedSeason}
                                            episodeFilter={episodeFilter}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Episodes List/Sidebar Section (md:w-1/3) */}
                {hasEpisodes && (
                    <div 
                        className={`
                            fixed right-0 top-0 h-full w-full bg-gray-900 z-50 transition-transform duration-300 ease-in-out
                            md:relative md:w-1/3 md:translate-x-0 md:border-l border-gray-800 md:z-auto
                            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                            overflow-y-auto 
                        `}
                    >
                        {/* STICKY HEADER AREA */}
                        <div 
                            className="sticky top-0 bg-gray-900/90 backdrop-blur-sm z-10 p-4 border-b border-pink-600/50 shadow-xl shadow-black/50" 
                        >
                            <div className="flex justify-between items-center w-full"> 
                                {/* Hide Sidebar Button */}
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="md:hidden flex items-center text-sm font-semibold p-2 rounded-lg transition text-white hover:bg-white/10"
                                    title="Close Episode List"
                                >
                                    <X size={16} className="mr-1" />                                </button>

                                {/* Season Navigation and Dropdown */}
                                <div className="flex items-center justify-between w-full md:w-auto">
                                    {renderSeasonSelector(false)}
                                </div>
                            </div>
                        </div>


                        {/* EPISODES LIST */} 
                        <div className="p-4">
                            <EpisodesListWithScroll
                                tvId={movie.id} 
                                seasons={seasons} 
                                onEpisodeClick={handleEpisodeClick}
                                onSeasonSelect={handleSeasonSelect} 
                                currentPlayingSeasonNumber={playingEpisode.season_number} 
                                currentPlayingEpisodeNumber={playingEpisode.episode_number}
                                selectedSeason={selectedSeason}
                                episodeFilter={episodeFilter}
                            />
                        </div>
                    </div>
                )}
               </div>
      </div>
    );
};

export default DedicatedPlayerScreen;