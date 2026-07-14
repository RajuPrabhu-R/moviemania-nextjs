"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import InfiniteScrollTrigger from "./InfiniteScrollTrigger.jsx";
import { HeroBanner, MovieRow, SearchDropdown, MobileMenu, NoResultsFound, TopNavBar } from "./AppComponents.jsx";
import { MovieCard } from "./MovieCards.jsx";
import { API_BASE_URL, API_KEY } from "../api/tmdb";
import { useGlobalContext } from "@/context/GlobalProvider";

const HomeView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlViewId = searchParams.get("view");
  const { category: routeCategory } = useParams();

  // Ensure these have safe defaults (empty arrays/objects)
  const { 
    history = [], 
    removeFromHistory = () => {}, 
    isBlurEnabled = false, 
    setIsBlurEnabled = () => {}, 
    isInMyList = () => false, 
    toggleMyList = () => {},
    trending = [], // Assuming these moved to context too
    tv = [],
    romance = [],
    animeMovies = [],
    topRated = [],
    actionMovies = [],
    matureAnime = [],
    curatedNew = [],
    isInitialLoading = false,
    liveSearchResults = [],
    setLiveSearchResults = () => {},
    closeLiveSearch = () => {},
    specialViewResults = [],
    specialViewQuery = "",
    specialViewType = "",
    specialViewPage = 1,
    specialViewTotalPages = 1,
    isSpecialViewLoading = false,
    handleSpecialViewSearch = () => {},
    isMenuOpen = false,
    setIsMenuOpen = () => {},
    handleLiveSearch = () => {}
  } = useGlobalContext() || {};


  const [watchHistory, setWatchHistory] = useState(history);
  const [selectedRowResults, setSelectedRowResults] = useState([]);
  const [rowLoadMoreData, setRowLoadMoreData] = useState({ id: urlViewId || null, page: 1, total_pages: 1 });
  const [isRowLoading, setIsRowLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(specialViewQuery || "");
  const [searchCategory, setSearchCategory] = useState(routeCategory || "all");

  const isSpecialView = specialViewType === "search" || !!urlViewId;

  const rowEndpoints = {
    trending: "/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=",
    tv: "/discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_count.desc&page=",
    romance: "romance",
    animeMovies: "/discover/movie?with_genres=16&with_original_language=ja&page=",
    topRated: "/discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=1000&page=",
    matureAnime: "/discover/tv?with_genres=16&sort_by=popularity.desc&certification_country=US&certification=TV-MA&page=",
    actionMovies: "/discover/tv?with_genres=16,10759&with_original_language=ja&page=",
    curated: "curated",
  };

  const fetchCategoryData = useCallback(async (viewId, page) => {
    let results = [];
    let totalPages = 1;

    try {
      if (viewId === "curated") {
        results = curatedNew;
        totalPages = 1;
      } else if (viewId === "romance") {
        const [tvRes, movieRes] = await Promise.all([
          fetch(`${API_BASE_URL}/discover/tv?with_genres=16,10749&with_original_language=ja&page=${page}&api_key=${API_KEY}&include_adult=true`),
          fetch(`${API_BASE_URL}/discover/movie?with_genres=16,10749&with_original_language=ja&page=${page}&api_key=${API_KEY}&include_adult=true`),
        ]);
        const tvData = await tvRes.json();
        const movieData = await movieRes.json();
        results = [...(tvData.results || []), ...(movieData.results || [])].sort((a, b) => b.popularity - a.popularity);
        totalPages = Math.max(tvData.total_pages || 1, movieData.total_pages || 1);
      } else if (rowEndpoints[viewId]) {
        const res = await fetch(`${API_BASE_URL}${rowEndpoints[viewId]}${page}&api_key=${API_KEY}&include_adult=true`);
        const data = await res.json();
        results = data.results || [];
        totalPages = data.total_pages || 1;
      }
    } catch (err) {
      console.error(err);
    }
    return { results, totalPages };
  }, [curatedNew]);

  useEffect(() => {
    if (urlViewId) {
      const initLoad = async () => {
        window.scrollTo(0, 0);
        setIsRowLoading(true);
        const { results, totalPages } = await fetchCategoryData(urlViewId, 1);
        setSelectedRowResults(results);
        setRowLoadMoreData({ id: urlViewId, page: 1, total_pages: Math.min(totalPages, 500) });
        setIsRowLoading(false);
      };
      initLoad();
    } else {
      setSelectedRowResults([]);
      setRowLoadMoreData({ id: null, page: 1, total_pages: 1 });
    }
  }, [urlViewId, fetchCategoryData]);

  const handleLoadMoreRow = async () => {
    if (isRowLoading || rowLoadMoreData.page >= rowLoadMoreData.total_pages) return;
    setIsRowLoading(true);
    const nextPage = rowLoadMoreData.page + 1;
    const { results } = await fetchCategoryData(urlViewId, nextPage);
    setSelectedRowResults((prev) => [...prev, ...results]);
    setRowLoadMoreData((prev) => ({ ...prev, page: nextPage }));
    setIsRowLoading(false);
  };

  const handleBack = () => {
    window.scrollTo(0, 0);
    setLiveSearchResults([]);
    router.push("/"); // Next.js routing
  };

  const handleHomeClick = () => {
    setIsMenuOpen(false);
    setLiveSearchResults([]);
    setSearchTerm("");
    router.push("/"); // Next.js routing
    window.scrollTo(0, 0);
  };

  const handleNavigationSearch = (term) => {
    if (term.trim()) {
      closeLiveSearch();
      router.push(`/search?s=${encodeURIComponent(term.trim())}&type=${searchCategory}`); // Next.js routing
      document.activeElement?.blur();
    }
  };

  const currentResults = specialViewType === "search" ? specialViewResults : selectedRowResults;
  const currentIsLoading = isSpecialViewLoading || isRowLoading;
  const hasMore = specialViewType === "search"
    ? specialViewPage < specialViewTotalPages
    : rowLoadMoreData.page < rowLoadMoreData.total_pages;

  const getPageTitle = () => {
    if (specialViewType === "search") return `Results for "${specialViewQuery}"`;
    if (urlViewId === "matureAnime") return "18+ Mature Content";
    if (urlViewId === "curated") return "Hand-Picked For You";
    return urlViewId;
  };

  return (
    <div className="bg-[#000000] min-h-screen text-white">
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

      <div>
        {!isSpecialView && <HeroBanner heroMovies={trending} isLoading={isInitialLoading} />}

        <div className="relative z-10 mb-20">
          {isSpecialView ? (
            <div className="pt-10 px-4 max-w-6xl mx-auto min-h-screen">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={handleBack} className="w-20 h-10 rounded-lg bg-[#141414] border border-white/5 flex items-center justify-center text-white hover:bg-[#1f1f1f] transition-colors">
                  <ChevronLeft size={20} /> Back
                </button>
                <h2 className="text-xl md:text-2xl font-medium capitalize tracking-tight">{getPageTitle()}</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-8 scroll-smooth">
                {currentResults.map((movie, idx) => (
                  <MovieCard
                    key={`${movie.id}-${idx}-special`}
                    movie={movie}
                    index={idx}
                    isSpecialView={true}
                    isBlurEnabled={isBlurEnabled}
                    isCurated={urlViewId === 'curated'}
                    isInMyList={isInMyList}
                    toggleMyList={toggleMyList}
                  />
                ))}
                {!currentIsLoading && currentResults.length === 0 && <NoResultsFound query={searchTerm} />}
              </div>
              <InfiniteScrollTrigger
                onTrigger={specialViewType === 'search' ? handleSpecialViewSearch : handleLoadMoreRow}
                hasMore={hasMore}
                isLoading={currentIsLoading}
              />
            </div>
          ) : (
            <div className="pb-5 space-y-8 pt-4">
              {watchHistory.length > 0 && <MovieRow title="Your Recent History" movies={watchHistory} onRemoveItem={handleRemoveFromHistory} isLoading={false} isBlurEnabled={isBlurEnabled} />}

              <MovieRow title="Hand-Picked for You" movies={curatedNew} isLoading={isInitialLoading} isBlurEnabled={isBlurEnabled} isInMyList={isInMyList} toggleMyList={toggleMyList}/>
              <MovieRow title="Trending Anime" movies={trending} isLoading={isInitialLoading} isBlurEnabled={isBlurEnabled} isInMyList={isInMyList} toggleMyList={toggleMyList}/>
              <MovieRow title="Top Rated Anime" movies={topRated} isLoading={isInitialLoading} isBlurEnabled={isBlurEnabled} isInMyList={isInMyList} toggleMyList={toggleMyList}/>
              <MovieRow title="Popular Anime Series" movies={tv} isLoading={isInitialLoading} isBlurEnabled={isBlurEnabled} isInMyList={isInMyList} toggleMyList={toggleMyList}/>
              <MovieRow title="Romance Anime" movies={romance} isLoading={isInitialLoading} isBlurEnabled={isBlurEnabled} isInMyList={isInMyList} toggleMyList={toggleMyList}/>
              <MovieRow title="Anime Movies" movies={animeMovies} isLoading={isInitialLoading} isBlurEnabled={isBlurEnabled} isInMyList={isInMyList} toggleMyList={toggleMyList}/>
              <MovieRow title="Action Anime" movies={actionMovies} isLoading={isInitialLoading} isBlurEnabled={isBlurEnabled} isInMyList={isInMyList} toggleMyList={toggleMyList}/>
              <MovieRow title="18+ Mature Anime" movies={matureAnime} isLoading={isInitialLoading} isBlurEnabled={isBlurEnabled} isInMyList={isInMyList} toggleMyList={toggleMyList}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeView;


