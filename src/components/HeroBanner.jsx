"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Play, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { HeroBannerSkeleton } from "../hooks/HeroBannerSkeleton.jsx";
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

export const HeroBanner = ({ heroMovies, isLoading }) => {
  const router = useRouter();
  const [heroIndex, setHeroIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [logoPath, setLogoPath] = useState(null);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [genres, setGenres] = useState([]);

  const intervalRef = useRef(null);
  const metaCache = useRef({}); 

  const moviesToDisplay = useMemo(() => heroMovies.slice(0, 3), [JSON.stringify(heroMovies)]);
  const heroMovie = moviesToDisplay[heroIndex];

  const fetchMeta = useCallback(async (id, type) => {
    if (!id || !type) return;

    if (metaCache.current[id]) {
      setLogoPath(metaCache.current[id].logo);
      setGenres(metaCache.current[id].genres);
      setIsLogoLoading(false);
      return;
    }

    setIsLogoLoading(true);
    setLogoPath(null);
    setGenres([]);

    try {
      const [imgRes, detailRes] = await Promise.all([
        fetch(`${API_BASE_URL}/${type}/${id}/images?api_key=${API_KEY}`),
        fetch(`${API_BASE_URL}/${type}/${id}?api_key=${API_KEY}`),
      ]);
      const [imgData, detailData] = await Promise.all([imgRes.json(), detailRes.json()]);

      const logos = imgData.logos || [];
      const englishLogo = logos.find((l) => l.iso_639_1 === "en") || logos[0];
      const fetchedLogo = englishLogo?.file_path || null;
      const fetchedGenres = detailData.genres || [];

      metaCache.current[id] = { logo: fetchedLogo, genres: fetchedGenres };

      setLogoPath(fetchedLogo);
      setGenres(fetchedGenres);
    } catch {
      setLogoPath(null);
    } finally {
      setIsLogoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!heroMovie) return;
    const type = heroMovie.media_type || (heroMovie.title ? "movie" : "tv");
    fetchMeta(heroMovie.id, type);
  }, [heroMovie?.id, fetchMeta]);

  const goNext = useCallback(() => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % moviesToDisplay.length);
      setIsFading(false);
    }, 500);
  }, [isFading, moviesToDisplay.length]);

  const goPrev = useCallback(() => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      setHeroIndex((prev) => (prev - 1 + moviesToDisplay.length) % moviesToDisplay.length);
      setIsFading(false);
    }, 500);
  }, [isFading, moviesToDisplay.length]);

  useEffect(() => {
    if (!moviesToDisplay.length || !isPlaying) return;
    // intervalRef.current = setInterval(goNext, 8000);
    intervalRef.current = setInterval(() => {
      goNext();
    }, 8000);
    return () => clearInterval(intervalRef.current);
  }, [moviesToDisplay.length, isPlaying, goNext]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { goPrev(); setIsPlaying(false); },
    onSwipedRight: () => { goNext(); setIsPlaying(false); },
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  if (isLoading || !moviesToDisplay.length) return <HeroBannerSkeleton />;
  if (!heroMovie) return null;

  const tmdbType = heroMovie.media_type || (heroMovie.title ? "movie" : "tv");
  const slug = createSlug(heroMovie.title || heroMovie.name);
  const logoUrl = logoPath ? `https://image.tmdb.org/t/p/w500${logoPath}` : null;
  const isAnime = heroMovie.genre_ids?.includes(16);

  const displayTags = genres.length > 0 
    ? genres.slice(0, 3).map(g => g.name)
    : [isAnime ? "Anime" : tmdbType === "movie" ? "Movie" : "TV Series", (heroMovie.release_date || heroMovie.first_air_date || "").split("-")[0]];

  return (
    <div className="relative w-full h-[550px] md:h-[700px] bg-[#000000] p-4 md:p-8 flex justify-center items-start">
      <div 
        {...swipeHandlers} 
        className="relative w-full max-w-[1200px] h-full rounded-md md:rounded-lg overflow-hidden shadow-2xl group border border-white/5 bg-neutral-900"
      >

        <div className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          <div
            className="w-full h-full bg-cover bg-center md:bg-top animate-subtle-zoom"
            style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.poster_path || heroMovie.backdrop_path})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent z-10" />
        </div>

        <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end pb-8 md:pb-12 px-6 z-20 pointer-events-none">
          <div className={`w-full max-w-3xl flex flex-col items-center space-y-4 md:space-y-5 pointer-events-auto transition-all duration-700 transform ${isFading ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'}`}>

            <div className="min-h-[100px] md:min-h-[120px] flex items-end justify-center w-full">
              <div className={`w-full flex justify-center transition-all duration-700 ease-out transform ${
                  isLogoLoading 
                    ? 'opacity-0 blur-md translate-y-4 scale-95' 
                    : 'opacity-100 blur-0 translate-y-0 scale-100'
                }`}>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={heroMovie.title} 
                    className="w-56 md:w-[350px] max-h-[100px] md:max-h-[120px] object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]" 
                  />
                ) : (
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-center text-white leading-tight tracking-tight drop-shadow-xl">
                    {heroMovie.title || heroMovie.name}
                  </h1>
                )}
              </div>
            </div>

            <div className={`flex items-center justify-center flex-wrap gap-2 text-[13px] md:text-sm font-medium text-gray-300 drop-shadow-md transition-opacity duration-300 ${isLogoLoading ? 'opacity-0' : 'opacity-100'}`}>
              {displayTags.map((tag, index) => (
                <React.Fragment key={index}>
                  <span>{tag}</span>
                  {index < displayTags.length - 1 && <span className="text-gray-500 text-[10px]">&bull;</span>}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 w-full max-w-[400px] pt-2">
              <button 
                onClick={() => router.push(`/watch/${tmdbType}/${heroMovie.id}/${slug}`)} 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg font-bold text-sm md:text-base hover:bg-neutral-200 transition-all shadow-lg"
              >
                <Play size={20} className="fill-black" /> Play
              </button>

              <button 
                onClick={() => router.push(`/movie/${heroMovie.id}/${slug}?type=${tmdbType}`)} 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#333333]/90 text-white rounded-lg font-bold text-sm md:text-base hover:bg-[#444444] transition-all shadow-lg"
              >
                <Info size={22} className="text-white" /> More Info
              </button>
            </div>

          </div>
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex">
          {moviesToDisplay.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => { setHeroIndex(idx); setIsPlaying(false); }} 
              className={`transition-all duration-300 rounded-full ${heroIndex === idx ? "w-1.5 h-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-1 h-2 bg-white/40 hover:bg-white/80"}`} 
            />
          ))}
        </div>

      </div>
    </div>
  );
};


