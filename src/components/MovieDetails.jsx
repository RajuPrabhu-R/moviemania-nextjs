"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Play, X, ChevronDown, ChevronLeft, ChevronRight, Clapperboard,
  Search, Star, Loader2, Tag, Bookmark, Check, Eye, EyeOff, Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import RelatedContent from "./RelatedContent";
import { useGlobalContext } from "@/context/GlobalProvider";
import { API_BASE_URL, API_KEY } from "../api/tmdb"; 

const createSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const GenrePill = ({ genre, mediaType, onNavigate }) => {
  const handleClick = () => {
    const media = mediaType === "movie" ? "movie" : mediaType === "tv" ? "tv" : "all";
    onNavigate(`/?genre=${genre.id}&genreName=${encodeURIComponent(genre.name)}&media=${media}`);
  };

  return (
    <button
      onClick={handleClick}
      className="group flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.06] hover:bg-pink-600/20 rounded-lg text-[10px] font-semibold text-gray-400 hover:text-pink-300 border border-white/[0.07] hover:border-pink-600/40 transition-all duration-150 active:scale-95"
    >
      <Tag size={9} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      {genre.name}
    </button>
  );
};

export default function MovieDetails({ id, type, onClose }) {
  const router = useRouter();
  const { isInMyList, toggleMyList, isBlurEnabled, setIsBlurEnabled } = useGlobalContext();

  const [movieData, setMovieData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [cast, setCast] = useState([]);
  const [genres, setGenres] = useState([]);
  const [runtime, setRuntime] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [logoPath, setLogoPath] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [trailer, setTrailer] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // --- EXACT ANIMATION STATE YOU REQUESTED ---
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleSmoothClose = () => {
    setAnimateIn(false);
    setTimeout(() => {
      if (onClose) onClose();
      else router.back();
    }, 250);
  };

  // Safe scroll lock to prevent black screens on unmount
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => { 
      document.body.style.overflow = originalStyle;
      document.body.style.height = "auto";
    };
  }, []);

  const isTV = type === "tv";
  const mediaType = isTV ? "tv" : "movie";
  const isSaved = isInMyList && movieData ? isInMyList(movieData.id, mediaType) : false;

  const title = useMemo(() => {
    if (!movieData) return "";
    return movieData.title || movieData.name || movieData.original_title || movieData.original_name;
  }, [movieData]);

  const slug = useMemo(() => createSlug(title), [title]);

  const backdropUrl = movieData?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}`
    : null;

  const image = movieData?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
    : "/No-Poster.png";

  const logoUrl = logoPath ? `https://image.tmdb.org/t/p/w500${logoPath}` : null;
  const releaseYear = (movieData?.release_date || movieData?.first_air_date)?.split("-")[0];
  const endYear = isTV && movieData?.last_air_date ? movieData.last_air_date.split("-")[0] : "Present";
  const overview = movieData?.overview;

  const filteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) return episodes;
    const q = searchQuery.toLowerCase();
    return episodes.filter(
      (ep) =>
        ep.name.toLowerCase().includes(q) ||
        ep.episode_number.toString().includes(q)
    );
  }, [episodes, searchQuery]);

  // Main Data Fetch
  useEffect(() => {
    if (!id || !type) return;

    let cancelled = false;
    setIsLoading(true);

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,images,seasons,recommendations,videos`
        );
        const data = await res.json();
        if (cancelled) return;

        setMovieData(data); 
        setGenres(data.genres || []);
        setCast(data.credits?.cast?.slice(0, 4) || []);
        setRuntime(data.runtime || data.episode_run_time?.[0] || null);
        setSeasons(data.seasons?.filter((s) => s.season_number > 0) || []);
        setRecommendations(
          data.recommendations?.results?.filter((r) => r.poster_path).slice(0, 12) || []
        );

        const officialTrailer = data.videos?.results?.find(
          (v) => v.site === "YouTube" && v.type === "Trailer"
        );
        setTrailer(officialTrailer?.key || null);

        const logos = data.images?.logos || [];
        const englishLogo = logos.find((l) => l.iso_639_1 === "en") || logos[0];
        setLogoPath(englishLogo?.file_path || null);
      } catch (err) {
        if (!cancelled) console.error("Error fetching details:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [id, type]);

  // TV Episodes Fetch
  useEffect(() => {
    if (!isTV || !id) return;
    let cancelled = false;

    const fetchEpisodes = async () => {
      setLoadingEpisodes(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}`
        );
        const data = await res.json();
        if (!cancelled) setEpisodes(data.episodes || []);
      } catch (err) {
        if (!cancelled) console.error("Error fetching episodes:", err);
      } finally {
        if (!cancelled) setLoadingEpisodes(false);
      }
    };

    fetchEpisodes();
    return () => { cancelled = true; };
  }, [selectedSeason, id, isTV]);

  const handlePlayNow = (s = 1, e = 1) => {
    const query = isTV ? `?s=${s}&e=${e}` : "";
    router.push(`/watch/${type}/${id}/${slug}${query}`);
  };

  const handleGenreNavigate = (url) => {
    if (onClose) onClose();
    router.push(url);
  };

  const handleSeasonChange = (direction) => {
    const currentIdx = seasons.findIndex((s) => s.season_number === selectedSeason);
    if (direction === "prev" && currentIdx > 0) {
      setSelectedSeason(seasons[currentIdx - 1].season_number);
    } else if (direction === "next" && currentIdx < seasons.length - 1) {
      setSelectedSeason(seasons[currentIdx + 1].season_number);
    }
    setSearchQuery("");
  };

  const handleNativeShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/movie/${id}/${slug}?type=${mediaType}` : "";
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!"); 
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // Loading States
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-pink-600 mb-4" />
        <p className="text-white font-medium">Loading details...</p>
      </div>
    );
  }

  if (!movieData) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
        <p className="text-white text-xl font-bold">Movie not found.</p>
        <button onClick={handleSmoothClose} className="mt-4 text-pink-500 underline">Go Back</button>
      </div>
    );
  }

  // MAIN UI
  return (
    <div
      className={`fixed inset-0 z-[200] w-full h-full bg-black/75 backdrop-blur-2xl overflow-y-auto transition-opacity duration-250 ease-out ${
        animateIn ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {backdropUrl && (
        <div className="absolute top-0 left-0 right-0 h-[55vh] z-0 pointer-events-none overflow-hidden">
          <img
            src={backdropUrl}
            className="w-full h-full object-cover opacity-20 mask-image-gradient"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        </div>
      )}

      <div className="sticky top-0 left-0 right-0 z-50 flex justify-between items-center px-5 py-3 bg-black/40 backdrop-blur-xl border-b border-white/[0.05]">
        <button
          onClick={handleSmoothClose}
          className="flex items-center gap-1.5 text-white hover:text-white/70 transition-colors text-[14px] md:text-[15px] font-medium bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-full backdrop-blur-md"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        {setIsBlurEnabled && (
         <button
          onClick={() => setIsBlurEnabled(!isBlurEnabled)}
          className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
            isBlurEnabled
              ? "bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/10"
              : "bg-pink-600 border-pink-500 text-white/90 hover:bg-pink-500"
          }`}
        >
          {isBlurEnabled ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
       )}
      </div>

      {/* --- CONTENT WRAPPER: Exact Slide-up animation applied here --- */}
      <div
        className={`relative z-10 w-full max-w-5xl mx-auto px-4 pt-10 pb-24 transition-all duration-300 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="flex flex-col md:p-15 md:flex-row gap-8 md:gap-10 items-center md:items-start">

          <div className="w-full md:w-[30%] lg:w-[25%] flex flex-col items-center md:items-start gap-6 shrink-0">
            <div className="relative w-[160px] sm:w-[180px] md:w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/[0.1]">
              <img 
                src={image}
                alt={title}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  movieData?.adult && isBlurEnabled ? "blur-2xl scale-110" : ""
                }`}
              />
            </div>

            <div className="w-full max-w-[280px] md:max-w-full flex flex-col gap-3">
              {!isTV && (
                <button
                  onClick={() => handlePlayNow()}
                  className="w-full bg-pink-600 hover:bg-pink-500 active:bg-pink-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[13px] tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-pink-900/30"
                >
                  <Play size={18} fill="white" />
                  PLAY NOW
                </button>
              )}

              {toggleMyList && (
                <button
                  onClick={() => toggleMyList({ ...movieData, mediaType })}
                  className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-[13px] border transition-all active:scale-[0.98] ${
                    isSaved
                      ? "bg-pink-600/15 text-pink-400 border-pink-500/30 hover:bg-pink-600/25"
                      : "bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.08]"
                  }`}
                >
                  {isSaved ? <Check size={16} strokeWidth={3} /> : <Bookmark size={16} />}
                  {isSaved ? "Added to My List" : "Add to My List"}
                </button>
              )}

              <button
                onClick={handleNativeShare}
                className="w-full bg-white/[0.06] hover:bg-white/[0.1] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-[13px] border border-white/[0.08] transition-all active:scale-[0.98]"
              >
                <Share2 size={16} />
                Share
              </button>

              {trailer && !showTrailer && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="w-full bg-white/[0.06] hover:bg-white/[0.1] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-[13px] border border-white/[0.08] transition-all active:scale-[0.98]"
                >
                  <Clapperboard size={16} />
                  Watch Trailer
                </button>
              )}
            </div>
          </div>

          <div className="w-full md:w-[70%] lg:w-[75%] flex flex-col items-center md:items-start text-center md:text-left">
            {showTrailer && trailer ? (
              <div className="w-full mb-8 animate-fade-in">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] bg-black shadow-2xl">
                  <button
                    onClick={() => setShowTrailer(false)}
                    className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md p-2 rounded-full text-white/70 hover:text-white border border-white/15 transition-all"
                  >
                    <X size={16} />
                  </button>
                  <iframe
                    src={`https://www.youtube.com/embed/${trailer}?autoplay=1&rel=0&modestbranding=1`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={`${title} trailer`}
                  />
                </div>
              </div>
            ) : (
              <>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={title}
                    className="object-contain drop-shadow-2xl mb-4 md:mb-6"
                    style={{ maxHeight: "clamp(60px, 15vw, 140px)", maxWidth: "100%" }}
                  />
                ) : (
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 md:mb-6">
                    {title}
                  </h1>
                )}

                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-[12px] font-semibold text-gray-400 mb-4 bg-white/[0.03] border border-white/[0.05] px-4 py-2 rounded-full">
                  {runtime && (
                    <>
                      <span>{runtime} min</span>
                      <span className="w-1 h-1 bg-gray-600 rounded-full" />
                    </>
                  )}
                  <span>
                    {releaseYear}
                    {isTV && `–${endYear}`}
                  </span>
                  {movieData.vote_average > 0 && (
                    <>
                      <span className="w-1 h-1 bg-gray-600 rounded-full" />
                      <span className="flex items-center gap-1 text-white">
                        <Star size={11} fill="gold" className="text-yellow-400" />
                        {movieData.vote_average.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>

                {genres.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                    {genres.slice(0, 5).map((g) => (
                      <GenrePill
                        key={g.id ?? g}
                        genre={g}
                        mediaType={mediaType}
                        onNavigate={handleGenreNavigate}
                      />
                    ))}
                  </div>
                )}

                {cast.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                    {cast.map((person) => (
                      <span
                        key={person.id}
                        className="px-3 py-1.5 bg-white/[0.03] rounded-lg text-[11px] font-medium text-gray-400 border border-white/[0.05]"
                      >
                        {person.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="w-full max-w-3xl mb-8">
                  <p className="text-gray-300 text-[14px] md:text-[15px] leading-relaxed transition-all duration-300">
                    {overview && overview.length > 180 ? (
                      <>
                        {isExpanded ? overview : `${overview.substring(0, 180)}...`}
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="text-pink-500 hover:text-pink-400 font-semibold ml-2 inline-flex focus:outline-none transition-colors active:scale-95"
                        >
                          {isExpanded ? "Read less" : "Read more"}
                        </button>
                      </>
                    ) : (
                      overview || "No overview available."
                    )}
                  </p>
                </div>
              </>
            )}

            {isTV && (
              <div className="w-full mt-2 bg-black/20 p-4 md:p-6 rounded-2xl border border-white/[0.05]">
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => handleSeasonChange("prev")}
                    disabled={seasons.findIndex((s) => s.season_number === selectedSeason) === 0}
                    className="flex items-center gap-1 text-[11px] text-white hover:text-gray-400 font-semibold transition-colors bg-white/[0.08] border border-white/[0.1] px-3 py-2 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  <div className="relative">
                    <select
                      value={selectedSeason}
                      onChange={(e) => {
                        setSelectedSeason(Number(e.target.value));
                        setSearchQuery("");
                      }}
                      className="appearance-none bg-white/[0.08] border border-white/[0.15] rounded-xl px-5 py-2.5 text-white font-bold text-[13px] outline-none cursor-pointer pr-10 hover:bg-white/[0.12] transition-colors text-center"
                    >
                      {seasons.map((s) => (
                        <option key={s.id} value={s.season_number} className="bg-[#111]">
                          Season {s.season_number}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                    />
                  </div>

                  <button
                    onClick={() => handleSeasonChange("next")}
                    disabled={
                      seasons.findIndex((s) => s.season_number === selectedSeason) === seasons.length - 1
                    }
                    className="flex items-center gap-1 text-[11px] text-white hover:text-gray-400 font-semibold transition-colors bg-white/[0.08] border border-white/[0.1] px-3 py-2 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>

                <div className="relative w-full mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                  <input
                    type="text"
                    placeholder="Search episodes…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-11 pr-10 text-white placeholder-gray-500 text-[13px] outline-none focus:border-pink-600/50 focus:bg-white/[0.06] transition-all font-medium text-left"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 md:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {loadingEpisodes ? (
                    <div className="flex justify-center py-10">
                      <Loader2 size={28} className="animate-spin text-pink-600" />
                    </div>
                  ) : filteredEpisodes.length > 0 ? (
                    filteredEpisodes.map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => handlePlayNow(ep.season_number, ep.episode_number)}
                        className="flex gap-4 p-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer group"
                      >
                        <div className="relative w-28 md:w-36 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black/60 shadow-md">
                          <img
                            src={
                              ep.still_path
                                ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                                : backdropUrl || "/No-Poster.png"
                            }
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                              movieData?.adult && isBlurEnabled ? "blur-xl scale-110" : ""
                            }`}
                            alt=""
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Play size={16} fill="white" className="text-white drop-shadow-md ml-0.5" />
                          </div>
                        </div>
                        <div className="flex flex-col justify-center items-start text-left min-w-0 pr-2">
                          <h4 className="text-[13px] md:text-[14px] font-bold text-gray-200 line-clamp-1 group-hover:text-pink-400 transition-colors">
                            {ep.episode_number}. {ep.name}
                          </h4>
                          <span className="text-[11px] text-gray-500 mt-1">
                            {ep.air_date
                              ? new Date(ep.air_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Unknown date"}
                          </span>
                          {ep.runtime && (
                            <span className="text-[11px] text-gray-600 font-medium mt-0.5">{ep.runtime} min</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-[13px] font-medium text-gray-500 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      No episodes match "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full mt-16 border-t border-white/[0.06] pt-10">
          <h3 className="text-[13px] font-black text-gray-400 mb-6 uppercase tracking-widest pl-2 text-left">
            You might also like
          </h3>
          <RelatedContent recommendations={recommendations} />
        </div>
      </div>
    </div>
  );
}
