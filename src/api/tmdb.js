export const API_BASE_URL = "https://api.themoviedb.org/3";
// export const API_BASE_URL = "/tmdb-proxy";

export const API_KEY = "110e5c4f620f3ed443952ecfc0996c50";

// console.log("API_KEY:", API_KEY);

export const fetchMovies = async (endpoint) => {
  const separator = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(
    `${API_BASE_URL}${endpoint}${separator}api_key=${API_KEY}&include_adult=true`
  );
  const data = await res.json();
  return data.results || [];
};

export const MY_PREFERENCE_LIST = [
  { id: 95479, type: "tv" },
  { id: 85937, type: "tv" },
  { id: 46260, type: "tv" },
  { id: 31910, type: "tv" },
  { id: 80885, type: "tv" },
  { id: 240, type: "tv" },
  { id: 1429, type: "tv" },
  { id: 204832, type: "tv" },
  { id: 17463, type: "tv" },
  { id: 372058, type: "movie" },
  { id: 205321, type: "tv" },
  { id: 85731, type: "tv" },
  { id: 74717, type: "tv" },
  { id: 62114, type: "tv" },
];
