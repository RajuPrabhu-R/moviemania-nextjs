"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Play,
  Loader2,
  ChevronUp,
  TvMinimal,
  X,
  Eye,
  EyeOff,
  Home,
  History,
  Flame,
  Tv,
  Clapperboard,
  Trash2,
  Heart,
  Menu,
  Bookmark,
} from "lucide-react";
import { MovieCardSkeleton } from "../hooks/MovieCardSkeleton.jsx";
import { createSlug } from "../utils/helpers";
import { HistoryRowCard, MovieCard, TrendingMovieCard } from "./MovieCards.jsx";
import { HeroBanner } from "./HeroBanner.jsx";
import { API_BASE_URL, API_KEY } from "../api/tmdb";

// ─── TOP NAV ─────────────────────────────────────────────────────────────────
export const TopNavBar = ({
  isMenuOpen,
  setIsMenuOpen,
  searchTerm,
  setSearchTerm,
  handleLiveSearch,
  handleNavigationSearch,
  isBlurEnabled,
  setIsBlurEnabled,
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);

  // Auto-focus input when it expands
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  return (
    <nav className="w-full bg-black/10 backdrop-blur-md px-4 py-3 flex items-center gap-3 z-50 sticky top-0 transition-all duration-300">
      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6 text-[13px] font-semibold text-gray-500 flex-shrink-0">
        <Link
          href="/"
          className="hover:text-white transition-colors flex items-center gap-1.5 hover:text-pink-400"
        >
          <Home size={15} /> Home
        </Link>
        <Link
          href="/history"
          className="hover:text-white transition-colors flex items-center gap-1.5 hover:text-pink-400"
        >
          <History size={15} /> History
        </Link>
        <Link
          href="/?view=trending"
          className="hover:text-white transition-colors flex items-center gap-1.5 hover:text-pink-400"
        >
          <Flame size={15} /> Trending
        </Link>
        <Link
          href="/?view=tv"
          className="hover:text-white transition-colors flex items-center gap-1.5 hover:text-pink-400"
        >
          <Tv size={15} /> Series
        </Link>
        <Link
          href="/?view=animeMovies"
          className="hover:text-white transition-colors flex items-center gap-1.5 hover:text-pink-400"
        >
          <Clapperboard size={15} /> Movies
        </Link>
        <Link href="/my-list" className="hover:text-white transition-colors flex items-center gap-1.5 hover:text-pink-400">
          <Bookmark size={15} /> My List
        </Link>
      </div>

      {/* Expandable Search bar */}
      <div className="flex-1 flex items-center justify-start ml-2 md:ml-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchTerm.trim()) handleNavigationSearch(searchTerm);
          }}
          className={`relative flex items-center transition-all duration-500 ease-in-out origin-left ${
            isSearchExpanded ? "w-full max-w-md" : "w-9 h-9"
          }`}
        >
          {/* Search button trigger / icon */}
          <button
            type="button"
            onClick={() => setIsSearchExpanded(true)}
            className={`absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 z-10 ${
              isSearchExpanded
                ? "w-9 h-9 text-white pointer-events-none"
                : "w-9 h-9 text-gray-400 hover:text-white bg-white/[0.06] border border-white/[0.08] rounded-full hover:bg-white/10 shadow-sm"
            }`}
            aria-label="Search"
          >
            <Search size={isSearchExpanded ? 14 : 16} strokeWidth={isSearchExpanded ? 2 : 2.5} />
          </button>

          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search anime, movies, series…"
            className={`w-full h-9 bg-white/[0.06] text-white text-[13px] rounded-full outline-none border transition-all duration-500 ease-in-out placeholder-gray-600 font-medium ${
              isSearchExpanded
                ? "pl-9 pr-8 border-white/[0.08] focus:border-pink-600/50 focus:bg-white/[0.08] opacity-100"
                : "pl-9 pr-0 border-transparent opacity-0 cursor-pointer pointer-events-none"
            }`}
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              if (!value.trim()) handleLiveSearch("");
              else handleLiveSearch(value);
            }}
            onBlur={() => {
              // Collapse if clicked outside and empty
              if (!searchTerm.trim()) setIsSearchExpanded(false);
            }}
          />

          {/* Close/Clear Button */}
          <div
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${
              isSearchExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            {isSearchExpanded && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur so click registers properly
                onClick={() => {
                  if (searchTerm) {
                    // Clear text but keep expanded
                    setSearchTerm("");
                    handleLiveSearch("");
                    searchInputRef.current?.focus();
                  } else {
                    // Collapse if already empty
                    setIsSearchExpanded(false);
                  }
                }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Controls Container */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
        {/* Blur toggle */}
        <button
          onClick={() => setIsBlurEnabled(!isBlurEnabled)}
          className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
            isBlurEnabled
              ? "bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/10"
              : "bg-pink-600 border-pink-500 text-white/90 hover:bg-pink-500"
          }`}
          title={isBlurEnabled ? "Sensitive content blurred" : "Blur disabled"}
        >
          {isBlurEnabled ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Open menu"
        >
          <Menu size={17} strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
};

// ─── LOADERS ─────────────────────────────────────────────────────────────────
export const RowLoader = () => (
  <div className="col-span-full py-16 flex flex-col items-center justify-center text-white/40">
    <Loader2 size={28} className="animate-spin text-pink-600 mb-3" />
    <span className="text-sm font-medium">Loading…</span>
  </div>
);

export const NoResultsFound = ({ query }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/90 mx-4">
    <Search size={44} className="mb-4 text-pink-600 opacity-70" />
    <h3 className="text-xl font-black mb-2 tracking-tight">No results for "{query}"</h3>
    <p className="text-sm text-center max-w-xs text-gray-500">
      Try a different spelling or a related title.
    </p>
  </div>
);

// ─── PRELOADER ────────────────────────────────────────────────────────────────
export const Preloader = ({ isLoaded }) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setHidden(true), 700);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[9000] bg-[#080808] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${
        isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Wordmark */}
      <div className="flex items-baseline gap-0.5 select-none">
        <span
          className="text-5xl md:text-6xl font-black text-white tracking-tight"
          style={{ fontFamily: "'Cooljazz', sans-serif" }}
        >
          Movie
        </span>
        <span
          className="text-5xl md:text-6xl font-black text-pink-500 tracking-tight"
          style={{ fontFamily: "'Cooljazz', sans-serif" }}
        >
          Mania
        </span>
      </div>

      {/* Spinner */}
      <div
        className={`mt-8 w-10 h-10 rounded-full border-[3px] border-white/10 border-t-pink-500 animate-spin transition-opacity duration-300 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
};

// ─── SCROLL TO TOP BUTTON ─────────────────────────────────────────────────────
export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.pageYOffset > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-18 right-5 z-[80] p-3 rounded-xl bg-pink-600 text-white shadow-lg shadow-pink-900/40 transition-all duration-300 hover:bg-pink-500 hover:scale-105 active:scale-95 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  );
};

// ─── MOVIE ROW ────────────────────────────────────────────────────────────────
export const MovieRow = ({ title, movies, isLoading, onRemoveItem, isBlurEnabled, isInMyList, toggleMyList }) => {
  const isHistoryRow = title === "Your Recent History";
  const isCuratedRow = title === "Hand-Picked for You";
  const isTrendingRow = title.includes("Trending");
  const isAdultRow = title.includes("18+");
  const shouldShowContent = !isLoading && movies && movies.length > 0;

  if (!shouldShowContent && !isLoading) return null;

  let cardWidthClass = "w-[120px] md:w-[130px]";
  if (isTrendingRow) cardWidthClass = "w-[160px] md:w-[170px]";
  if (isHistoryRow) cardWidthClass = "w-[210px] md:w-[300px]";

  const viewKey = isCuratedRow
    ? "curated"
    : isTrendingRow
    ? "trending"
    : title.includes("Top Rated")
    ? "topRated"
    : title.includes("Series")
    ? "tv"
    : title.includes("Romance")
    ? "romance"
    : title.includes("Movies")
    ? "animeMovies"
    : title.includes("Action")
    ? "actionMovies"
    : title.includes("18+")
    ? "matureAnime"
    : null;

  return (
    <section
      className={`mb-10 md:mb-8 relative mt-3 md:mt-6 z-10 ${
        isAdultRow
          ? "border-l-2 border-red-500 bg-gradient-to-r from-red-500/5 to-transparent py-3 rounded-r-lg"
          : ""
      }`}
    >
      {/* Row header */}
      <div className="px-3 md:px-5 mb-3 md:mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAdultRow && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          )}
          {isCuratedRow && <Star size={14} className="text-pink-400" fill="currentColor" />}
          <h2
            className={`font-medium md:text-sm tracking-tight transition-colors ${
              isAdultRow ? "text-red-400 uppercase tracking-widest text-sm" : "text-white"
            }`}
          >
            {title}
          </h2>
        </div>

        {viewKey && !isHistoryRow && (
          <Link
            href={`/?view=${viewKey}`}
            className="text-[11px] font-semibold text-gray-500 hover:text-white transition-colors flex items-center gap-1  hover:bg-white/[0.09] px-2.5 py-1 rounded-lg border border-white/[0.06]"
          >
            See all <ChevronRight size={13} />
          </Link>
        )}
      </div>

      {/* Scrollable row */}
      <div className="flex gap-2.5 overflow-x-auto scroll-smooth mb-10 pb-3 pl-4 md:pl-5 pr-2">
        {shouldShowContent &&
          movies.map((movie, index) => (
            <div key={`${movie.id}-${index}`} className={`${cardWidthClass} flex-shrink-0`}>
              {isTrendingRow ? (
                <TrendingMovieCard movie={movie} index={index} />
              ) : isHistoryRow ? (
                <HistoryRowCard movie={movie} onRemove={onRemoveItem} />
              ) : (
                <MovieCard
                  movie={movie}
                  index={index}
                  isSpecialView={false}
                  isBlurEnabled={isBlurEnabled}
                  isCurated={isCuratedRow}
                  isInMyList={isInMyList} toggleMyList={toggleMyList}
                />
              )}
            </div>
          ))}

        {isLoading &&
          Array(8)
            .fill(0)
            .map((_, index) => (
              <div key={`skel-${index}`} className={`${cardWidthClass} flex-shrink-0`}>
                <MovieCardSkeleton />
              </div>
            ))}
      </div>
    </section>
  );
};

// ─── MOBILE MENU ─────────────────────────────────────────────────────────────
export const MenuLink = ({ to, label, onClick, small, icon }) => (
  <Link
    href={to}
    onClick={onClick}
    className={`group flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.07] ${
      small
        ? "text-[13px] font-medium text-gray-500 hover:text-white"
        : "text-base font-bold text-gray-300 hover:text-white"
    }`}
  >
    <span className={`${small ? "text-gray-600" : "text-gray-400"} group-hover:text-pink-400 transition-colors`}>
      {icon}
    </span>
    <span className="flex-1">{label}</span>
    <ChevronRight
      size={14}
      className="opacity-0 group-hover:opacity-100 text-gray-600 transition-all -translate-x-1 group-hover:translate-x-0"
    />
  </Link>
);

export const MobileMenu = ({ isOpen, setIsOpen, onHomeClick }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-[100] transition-all duration-300 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Bottom Sheet Drawer */}
      <div
        className={`absolute bottom-0 left-0 w-full bg-[#0d0d0d] border-t border-white/[0.07] rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Top Drag Handle Indicator */}
          <div className="w-full flex justify-center pt-4 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Menu Title Header */}
          <div className="text-center pb-4 pt-2">
            <span className="text-lg font-bold text-white tracking-wide">
              Menu
            </span>
          </div>

          {/* Nav Links Container */}
          <nav className="space-y-1 overflow-y-auto px-4 pb-8 w-full">
            <div
              className={`flex flex-col gap-1 transition-all duration-500 delay-[50ms] transform ${
                isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              <MenuLink to="/" label="Home" icon={<Home size={20} />} onClick={onHomeClick} />
              <MenuLink
                to="/history"
                label="Watch History"
                icon={<History size={20} />}
                onClick={() => setIsOpen(false)}
              />

              <div className="pt-4 pb-2 border-t border-white/[0.05] mt-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-700 font-bold ml-3 mb-3">
                  Browse
                </p>
                <div className="space-y-1">
                  <MenuLink to="/?view=curated" label="Hand-Picked" icon={<Star size={18} />} onClick={() => setIsOpen(false)} />
                  <MenuLink to="/?view=trending" label="Trending" icon={<Flame size={18} />} onClick={() => setIsOpen(false)} />
                  <MenuLink to="/?view=tv" label="Series" icon={<Tv size={18} />} onClick={() => setIsOpen(false)} />
                  <MenuLink to="/?view=romance" label="Romance" icon={<Heart size={18} />} onClick={() => setIsOpen(false)} />
                  <MenuLink to="/?view=animeMovies" label="Movies" icon={<Clapperboard size={18} />} onClick={() => setIsOpen(false)} />
                  <MenuLink to="/?view=matureAnime" label="Mature (18+)" icon={<EyeOff size={18} />} onClick={() => setIsOpen(false)} />
                  <MenuLink to="/my-list" label="My List" icon={<Bookmark size={18} />} onClick={() => setIsOpen(false)} />
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

// ─── SEARCH DROPDOWN ─────────────────────────────────────────────────────────
export const SearchDropdown = ({ results, onSelect, onClear }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!results.length) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClear();
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [results.length, onClear]);

  if (!results.length) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 w-[300px] mt-1.5 p-1.5 bg-[#111] rounded-xl shadow-2xl border border-white/[0.07] animate-fade-in z-[60]"
    >
      <div className="flex flex-col max-h-[55vh] overflow-y-auto">
        {results.map((movie) => {
          const type = movie.media_type || (movie.title ? "movie" : "tv");
          const title = movie.title || movie.name;
          const slug = createSlug(title);
          const year = (movie.release_date || movie.first_air_date || "").split("-")[0];

          return (
            <Link
              key={`${movie.id}-dropdown`}
              href={`/movie/${movie.id}/${slug}?type=${type}`}
              onClick={onSelect}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.07] transition-colors"
            >
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                    : "/No-Poster.png"
                }
                className="w-10 h-14 object-cover rounded-lg flex-shrink-0 bg-white/5"
                alt=""
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-[13px] truncate">{title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                  <span>{year || "N/A"}</span>
                  {movie.vote_average > 0 && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Star size={9} fill="currentColor" />
                      {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                  <span className="capitalize text-gray-600">{type}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// ─── WATCH HISTORY PAGE ───────────────────────────────────────────────────────
export const WatchHistoryView = ({ history, clearHistory, removeFromHistory, isBlurEnabled }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#080808] animate-fade-in">
      <div className="sticky top-0 z-50 bg-[#080808]/90 backdrop-blur-lg border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-[13px] font-medium"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <span className="text-sm font-black text-white">
          Watch<span className="text-pink-500">History</span>
        </span>
        <button
          onClick={clearHistory}
          disabled={!history.length}
          className="flex items-center gap-1.5 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:pointer-events-none text-[13px] font-semibold transition-colors"
        >
          <Trash2 size={14} />
          Clear all
        </button>
      </div>

      <div className="px-4 md:px-8 max-w-6xl mx-auto pt-8 pb-20">
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">Watch History</h1>
        <p className="text-sm text-gray-600 mb-8">
          {history.length} {history.length === 1 ? "title" : "titles"} saved
        </p>

        {!history.length ? (
          <div className="text-center py-28 text-gray-600 flex flex-col items-center">
            <TvMinimal size={52} className="mb-5 opacity-25" />
            <p className="text-base font-medium">Nothing here yet.</p>
            <p className="text-sm mt-1 text-gray-700">Start watching and your history will appear here.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Browse content
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {history.map((item, idx) => (
              <HistoryRowCard
                key={`${item.id}-${item.mediaType}-${idx}`}
                movie={item}
                onRemove={removeFromHistory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const MyListView = ({ myList, toggleMyList, isInMyList }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#080808] animate-fade-in">
      <div className="sticky top-0 z-50 bg-[#080808]/90 backdrop-blur-lg border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-[13px] font-medium"
        >
          <ChevronLeft size={18} /> Back
        </button>
        <span className="text-sm font-black text-white">
          My<span className="text-pink-500">List</span>
        </span>
        <div className="w-16" />
      </div>

      <div className="px-4 md:px-8 max-w-6xl mx-auto pt-8 pb-20">
        <div className="flex items-center gap-3 mb-1">
          <Bookmark className="text-pink-500" size={24} fill="currentColor" />
          <h1 className="text-2xl font-black text-white tracking-tight">My List</h1>
        </div>
        <p className="text-sm text-gray-600 mb-8">
          {myList.length} {myList.length === 1 ? "title" : "titles"} saved
        </p>

        {!myList.length ? (
          <div className="text-center py-28 text-gray-600 flex flex-col items-center">
            <Bookmark size={52} className="mb-5 opacity-25" />
            <p className="text-base font-medium">Your list is empty.</p>
            <p className="text-sm mt-1 text-gray-700">Save shows and movies to watch later.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Explore content
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {myList.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="relative group">
                <MovieCard
                  movie={item}
                  index={idx}
                  isSpecialView={true}
                  isBlurEnabled={false}
                  isInMyList={isInMyList}  
                  toggleMyList={toggleMyList}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleMyList(item);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 hover:bg-red-500/80 hover:text-white text-gray-300 z-20"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Re-exports for backward compatibility
export { HistoryRowCard, MovieCard, TrendingMovieCard } from "./MovieCards.jsx";

export { HeroBanner } from "./HeroBanner.jsx";


