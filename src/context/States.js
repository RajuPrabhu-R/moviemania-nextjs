
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

