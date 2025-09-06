import axios from "axios";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL =
  import.meta.env.VITE_TMDB_BASE_URL || "https://api.themoviedb.org/3";

// Create axios instance
const tmdbAxios = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

// Get detailed information about a specific movie or TV show
export async function getMediaDetails(mediaType, id) {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}`);
    return response.data;
  } catch (err) {
    throw err;
  }
}

// Get cast and crew information
export async function getMediaCredits(mediaType, id) {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}/credits`);
    return response.data;
  } catch (err) {
    throw err;
  }
}

// Get videos (trailers, teasers, etc.)
export async function getMediaVideos(mediaType, id) {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}/videos`);
    return response.data;
  } catch (err) {
    throw err;
  }
}

// Get similar movies or TV shows
export async function getSimilarMedia(mediaType, id) {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}/similar`);
    return response.data;
  } catch (err) {
    throw err;
  }
}

// Get recommendations based on a specific movie or TV show
export async function getRecommendations(mediaType, id) {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}/recommendations`);
    return response.data;
  } catch (err) {
    throw err;
  }
}

// Search for movies or TV shows
export async function searchMedia(mediaType, query, page = 1) {
  try {
    const response = await tmdbAxios.get(`/search/${mediaType}`, {
      params: { query, page },
    });
    return response.data;
  } catch (err) {
    throw err;
  }
}

// Get trending movies or TV shows
export async function getTrending(mediaType, timeWindow = "week") {
  try {
    const response = await tmdbAxios.get(
      `/trending/${mediaType}/${timeWindow}`
    );
    return response.data;
  } catch (err) {
    throw err;
  }
}

// Get popular movies or TV shows
export async function getPopular(mediaType, page = 1) {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/popular`, {
      params: { page },
    });
    return response.data;
  } catch (err) {
    throw err;
  }
}

// Get top rated movies or TV shows
export async function getTopRated(mediaType, page = 1) {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/top_rated`, {
      params: { page },
    });
    return response.data;
  } catch (err) {
    throw err;
  }
}

// Get Image URL
export function getImageUrl(path, size = "original") {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// Search multi (movies, TV shows, people)
export async function searchMulti(query, page = 1) {
  try {
    const response = await tmdbAxios.get(`/search/multi`, {
      params: { query, page },
    });
    return response.data;
  } catch (err) {
    throw err;
  }
}
