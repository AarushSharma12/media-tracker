// Add these functions to your existing tmdbApi.js file

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
export const getMediaDetails = async (mediaType, id) => {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching media details:", error);
    throw error;
  }
};

// Get cast and crew information
export const getMediaCredits = async (mediaType, id) => {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}/credits`);
    return response.data;
  } catch (error) {
    console.error("Error fetching media credits:", error);
    throw error;
  }
};

// Get videos (trailers, teasers, etc.)
export const getMediaVideos = async (mediaType, id) => {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}/videos`);
    return response.data;
  } catch (error) {
    console.error("Error fetching media videos:", error);
    throw error;
  }
};

// Get similar movies or TV shows
export const getSimilarMedia = async (mediaType, id) => {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}/similar`);
    return response.data;
  } catch (error) {
    console.error("Error fetching similar media:", error);
    throw error;
  }
};

// Get recommendations based on a specific movie or TV show
export const getRecommendations = async (mediaType, id) => {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/${id}/recommendations`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    throw error;
  }
};

// Search for movies or TV shows
export const searchMedia = async (mediaType, query, page = 1) => {
  try {
    const response = await tmdbAxios.get(`/search/${mediaType}`, {
      params: {
        query,
        page,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching media:", error);
    throw error;
  }
};

// Get trending movies or TV shows
export const getTrending = async (mediaType, timeWindow = "week") => {
  try {
    const response = await tmdbAxios.get(
      `/trending/${mediaType}/${timeWindow}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching trending media:", error);
    throw error;
  }
};

// Get popular movies or TV shows
export const getPopular = async (mediaType, page = 1) => {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/popular`, {
      params: { page },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching popular media:", error);
    throw error;
  }
};

// Get top rated movies or TV shows
export const getTopRated = async (mediaType, page = 1) => {
  try {
    const response = await tmdbAxios.get(`/${mediaType}/top_rated`, {
      params: { page },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching top rated media:", error);
    throw error;
  }
};

// Get Image URL
export const getImageUrl = (path, size = "original") => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Search multi (movies, TV shows, people)
export const searchMulti = async (query, page = 1) => {
  try {
    const response = await tmdbAxios.get(`/search/multi`, {
      params: { query, page },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching multi:", error);
    throw error;
  }
};
