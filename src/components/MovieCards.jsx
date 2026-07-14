"use client";

import React from "react";
import Link from "next/link";
import { Play, X, CheckCircle2, Bookmark } from "lucide-react";
import { createSlug } from "../utils/helpers";

// ─── HISTORY ROW CARD ─────────────────────────────────────────────────────────
export const HistoryRowCard = ({ movie, onRemove }) => {
  const title = movie.title || movie.name;
  const slug = createSlug(title);
  const image = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
    : movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/No-Poster.png";

  const season = movie.lastPlayedSeason || 1;
  const episode = movie.lastPlayedEpisode || 1;
  const progress = typeof movie.progress === "number" ? movie.progress : 30;

  const toPath =
    movie.mediaType === "tv"
      ? `/watch/tv/${movie.id}/${slug}?s=${season}&e=${episode}`
      : `/watch/${movie.mediaType}/${movie.id}/${slug}`;

  // ADDED snap-start to the outermost wrapper
  return (
    <div className="relative group w-full aspect-video transition-all duration-200 hover:scale-[1.03] hover:z-30 hover:shadow-2xl hover:shadow-black/70 cursor-pointer snap-start">
      <div className="absolute inset-0 rounded-xl overflow-hidden border border-white/[0.06] bg-[#111]">
        {/* REMOVED snap-x from the Link tag */}
        <Link href={toPath} className="block w-full h-full">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
            <div className="bg-pink-600/90 backdrop-blur-md p-3 rounded-full shadow-lg shadow-pink-900/40">
              <Play size={20} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-3">
            <h3 className="text-md md:text-[13px] font-medium text-white truncate">{title}</h3>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] font-medium text-gray-400">
              {movie.mediaType === "tv" && (
                <span className="text-white/80 bg-white/15 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold">
                  S{season} E{episode}
                </span>
              )}
              <span>{progress}% watched</span>
            </div>
          </div>
        </Link>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(movie.id, movie.mediaType);
        }}
        className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm text-white/60 hover:text-white hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 z-40"
        title="Remove from history"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ─── STANDARD MOVIE CARD ──────────────────────────────────────────────────────
export const MovieCard = ({ 
  movie, 
  index, 
  isSpecialView, 
  onRemove, 
  isBlurEnabled, 
  isCurated,
  isInMyList,
  toggleMyList 
}) => {
  if (!movie) return null;

  const type = movie.mediaType || movie.media_type || (movie.title ? "movie" : "tv");
  const title = movie.title || movie.name;
  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : "/No-Poster.png";
  const slug = createSlug(title);
  const isAdultContent = movie.adult;
  const shouldApplyBlur = isAdultContent && isBlurEnabled;

  const isSaved = isInMyList ? isInMyList(movie.id, type) : false;
  const seasonText = movie.season != null ? `Season ${movie.season}` : movie.seasonText;
  const episodeText = movie.episodeRange != null ? `EP:${movie.episodeRange}` : movie.episodeText;

  // ADDED snap-start to the outermost wrapper
  return (
    <div
      className={`group w-full relative flex flex-col gap-2 transition-all duration-200 hover:z-30 snap-start ${
        isSpecialView ? "animate-fade-in-up" : ""
      }`}
      style={isSpecialView ? { animationDelay: `${Math.min(index * 0.04, 0.4)}s` } : {}}
    >
      {/* REMOVED snap-mandatory from the Link tag */}
      <Link
        href={`/movie/${movie.id}/${slug}?type=${type}`}
        className="block relative rounded-sm overflow-hidden aspect-[2/3] transition-transform duration-200 group-hover:scale-[1.02] group-hover:shadow-lg border border-white/[0.04] bg-[#1a1a1a]"
      >
        <img
          src={posterSrc}
          alt={title}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-500 ${
            shouldApplyBlur ? "blur-2xl scale-110" : ""
          }`}
        />

        {seasonText && (
          <div className="absolute top-1.5 left-1.5 z-20 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] md:text-[11px] font-medium text-gray-200 pointer-events-none tracking-wide">
            {seasonText}
          </div>
        )}

        {episodeText && (
          <div className="absolute bottom-1.5 left-1.5 z-20 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] md:text-[11px] font-medium text-gray-200 pointer-events-none tracking-wide">
            {episodeText}
          </div>
        )}

        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end z-20 pointer-events-none">
          {isCurated && (
            <div className="bg-pink-600/90 backdrop-blur-sm p-1 rounded shadow-md">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          )}
          {isAdultContent && (
            <div className="bg-red-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center shadow-md">
              <span className="text-[9px] font-black text-white">18+</span>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:flex items-center justify-center">
          <div className="bg-pink-600/90 backdrop-blur-md p-2.5 rounded-full shadow-lg">
            <Play size={18} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
      </Link>

      <h2 className="text-[10px] md:text-[12px] px-0.5 font-semibold text-gray-400 truncate group-hover:text-white transition-colors leading-tight">
        {title}
      </h2>

      {/* Interactive Actions Overlay */}
      <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 z-40 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(movie.id, type);
            }}
            className="p-1.5 rounded bg-black/60 backdrop-blur-sm text-white/60 hover:text-white hover:bg-red-600 transition-all shadow-md"
            title="Remove"
          >
            <X size={13} />
          </button>
        )}
        {toggleMyList && !onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMyList(movie);
            }}
            className={`p-1.5 rounded backdrop-blur-sm transition-all shadow-md ${
              isSaved
                ? "bg-pink-600/90 text-white"
                : "bg-black/60 text-white/60 hover:text-white hover:bg-white/20"
            }`}
            title={isSaved ? "Remove from My List" : "Add to My List"}
          >
            <Bookmark size={13} fill={isSaved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── TRENDING CARD (numbered) ─────────────────────────────────────────────────
export const TrendingMovieCard = ({ movie, index }) => {
  const title = movie.title || movie.name;
  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : "/No-Poster.png";
  const type = movie.media_type || (movie.title ? "movie" : "tv");
  const slug = createSlug(title);
  const toPath = `/movie/${movie.id}/${slug}?type=${type}`;

  // ADDED snap-start to the outermost wrapper
  return (
    <div className="relative flex-shrink-0 w-full group py-2 snap-start p-4">
      <div className="absolute -left-2 md:-left-3 bottom-1 md:bottom-0 z-10 select-none pointer-events-none">
        <span
          className="text-[5.5rem] md:text-[7rem] font-black leading-none tracking-tighter"
          style={{
            WebkitTextStroke: "2px #444",
            WebkitTextFillColor: "#080808",
            textShadow: "3px 0 8px rgba(0,0,0,0.9)",
          }}
        >
          {index + 1}
        </span>
      </div>

      <Link href={toPath} className="block w-full relative pl-9 md:pl-14 z-20">
        {/* REMOVED snap-center from this inner div */}
        <div className="relative rounded-lg overflow-hidden shadow-md transition-all duration-200 group-hover:scale-[1.04] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-pink-900/15 border border-white/[0.06] bg-[#111]">
          <img
            src={posterSrc}
            alt={title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        <div className="mt-1.5 pl-1">
          <h2 className="text-[11px] md:text-[12px] font-semibold text-gray-400 truncate group-hover:text-white transition-colors">
            {title}
          </h2>
        </div>
      </Link>
    </div>
  );
};


