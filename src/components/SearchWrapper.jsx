"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Search as SearchIcon } from "lucide-react";
import { MovieCard } from "./MovieCards.jsx";
import { TopNavBar, MobileMenu, SearchDropdown, NoResultsFound } from "./AppComponents.jsx";
import InfiniteScrollTrigger from "./InfiniteScrollTrigger.jsx";
import { API_BASE_URL, API_KEY } from "../api/tmdb";
import { useGlobalContext } from "@/context/GlobalProvider";

// 1. Rename your original component to SearchContent
const SearchContent = ({
  isMenuOpen,
  setIsMenuOpen,
  handleLiveSearch,
  liveSearchResults,
  setLiveSearchResults,
  closeLiveSearch
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("s") || "";
  const type = searchParams.get("type") || "multi";

  const { isBlurEnabled, setIsBlurEnabled, isInMyList, toggleMyList } = useGlobalContext();

  const [searchTerm, setSearchTerm] = useState(query || "");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setSearchTerm(query || "");
  }, [query]);

  const handleNavigationSearch = (term) => {
    if (term.trim() && term.trim() !== query) {
      closeLiveSearch();
      router.push(`/search?s=${encodeURIComponent(term.trim())}&type=${type}`);
      document.activeElement?.blur();
    }
  };

  useEffect(() => {
    setResults([]);
    setPage(1);
    setTotalPages(1);
  }, [query, type]);

  useEffect(() => {
    if (!query.trim()) return;

    let cancelled = false;

    const fetchSearchResults = async () => {
      if (page === 1) setIsLoading(true);
      else setIsFetchingMore(true);

      try {
        const endpoint = type === "all" || type === "multi" ? "multi" : type;
        const res = await fetch(
          `${API_BASE_URL}/search/${endpoint}?query=${encodeURIComponent(
            query
          )}&api_key=${API_KEY}&include_adult=true&language=en-US&page=${page}`
        );
        const data = await res.json();

        if (!cancelled) {
          const filteredResults = (data.results || []).filter(
            (item) =>
              (item.media_type === "movie" || item.media_type === "tv") &&
              item.poster_path
          );

          if (page === 1) {
            setResults(filteredResults);
          } else {
            setResults((prev) => [...prev, ...filteredResults]);
          }

          setTotalPages(data.total_pages || 1);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsFetchingMore(false);
        }
      }
    };

    fetchSearchResults();

    return () => { cancelled = true; };
  }, [query, type, page]);

  const handleLoadMore = () => {
    if (!isLoading && !isFetchingMore && page < totalPages) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleHomeClick = () => {
    setIsMenuOpen(false);
    setLiveSearchResults([]);
    setSearchTerm("");
    router.push("/");
    window.scrollTo(0, 0);
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white animate-fade-in">
      <TopNavBar
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm} 
        handleLiveSearch={handleLiveSearch} 
        handleNavigationSearch={handleNavigationSearch}
        isBlurEnabled={isBlurEnabled} 
        setIsBlurEnabled={setIsBlurEnabled}
      />

      {liveSearchResults.length > 0 && (
        <div className="fixed top-16 left-0 w-full z-[60] px-4 sm:px-16 md:px-24 flex justify-center pointer-events-none">
          <div className="w-full max-w-2xl pointer-events-auto">
            <SearchDropdown
              results={liveSearchResults}
              onSelect={() => setLiveSearchResults([])}
              onClear={() => setLiveSearchResults([])}
            />
          </div>
        </div>
      )}

      <MobileMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} onHomeClick={handleHomeClick} />

      <div className="pt-8 px-4 md:px-8 max-w-[1400px] mx-auto pb-24">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <SearchIcon size={22} className="text-pink-500" />
              Search Results
            </h1>
            {query && (
              <p className="text-[13px] text-gray-500 mt-0.5">
                Showing results for <span className="text-pink-400 font-semibold">"{query}"</span>
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={40} className="animate-spin text-pink-600 mb-4" />
            <p className="text-gray-500 text-sm font-medium">Searching database...</p>
          </div>
        ) : !query ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-600">
            <SearchIcon size={48} className="mb-4 opacity-30" />
            <p className="text-base font-medium text-gray-500">Type something to start searching.</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 animate-fade-in-up">
              {results.map((movie, idx) => (
                <MovieCard
                  key={`search-${movie.id}-${idx}`}
                  movie={movie}
                  index={idx}
                  isSpecialView={true}
                  isBlurEnabled={isBlurEnabled}
                  isInMyList={isInMyList}
                  toggleMyList={toggleMyList}
                />
              ))}
            </div>

            <InfiniteScrollTrigger
              onTrigger={handleLoadMore}
              hasMore={page < totalPages}
              isLoading={isFetchingMore}
            />
          </>
        ) : (
          <NoResultsFound query={query} />
        )}
      </div>
    </div>
  );
};

// 2. Export a new Wrapper that securely wraps your component in <Suspense>
export default function SearchWrapper(props) {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white">
          <Loader2 size={40} className="animate-spin text-pink-600 mb-4" />
          <p>Loading Search...</p>
        </div>
      }
    >
      <SearchContent {...props} />
    </Suspense>
  );
}
