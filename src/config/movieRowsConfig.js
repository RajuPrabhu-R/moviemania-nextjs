export const MOVIE_ROWS = [
  {
    id: "trending",
    title: "Trending Movies",
    endpoint: "/discover/movie?sort_by=popularity.desc&page=",
  },
  {
    id: "topRated",
    title: "Top Rated Movies",
    endpoint: "/movie/top_rated?page=",
  },
  {
    id: "tv",
    title: "TV Shows",
    endpoint: "/tv/popular?page=",
  },
  {
    id: "netflix",
    title: "Netflix Originals",
    endpoint: "/discover/tv?with_networks=213&page=",
  },
  {
    id: "prime",
    title: "Amazon Prime",
    endpoint: "/discover/tv?with_networks=1024&page=",
  },
  {
    id: "disney",
    title: "Disney+",
    endpoint: "/discover/tv?with_networks=2739&page=",
  },
  {
    id: "romance",
    title: "Romance Movies",
    endpoint: "/discover/movie?with_genres=10749&page=",
  },
  {
    id: "actionMovies",
    title: "Action Movies",
    endpoint: "/discover/movie?with_genres=28&page=",
  },
  {
    id: "documentaries",
    title: "Popular Documentaries",
    endpoint: "/discover/movie?with_genres=99&page=",
  },
  {
    id: "horrorMovies",
    title: "Top-Rated Horror Movies",
    endpoint: "/discover/movie?with_genres=27&sort_by=vote_average.desc&vote_count.gte=500&page=",
  },
  {
    id: "popularTVAnime",
    title: "Action/Adventure TV Anime (TMDB)",
    endpoint: "/discover/tv?with_genres=16,10759&sort_by=popularity.desc&page=",
  },
  {
    id: "actionAdventureAnime",
    title: "Adventure Anime Movies (TMDB)",
    endpoint: "/discover/movie?with_genres=16,28,12&sort_by=popularity.desc&page=",
  },
  {
    id: "animeMovies",
    title: "Anime Movies (TMDB)",
    endpoint: "/discover/movie?with_genres=16&with_original_language=ja&page=",
  },
];