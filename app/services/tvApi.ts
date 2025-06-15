import axios from 'axios';
import { Credits, VideosResponse } from '../types/movie';
import { TVShowDetails, TVShowResponse } from '../types/tv';

// Using the same API key as movieApi
const API_KEY = '4f5f43495afcc67e9553f6c684a82f84';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const tvApi = {
  // Get popular TV shows
  getPopularTVShows: async (page: number = 1): Promise<TVShowResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching popular TV shows:', error);
      throw error;
    }
  },

  // Get top rated TV shows
  getTopRatedTVShows: async (page: number = 1): Promise<TVShowResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching top rated TV shows:', error);
      throw error;
    }
  },

  // Get on the air TV shows
  getOnTheAirTVShows: async (page: number = 1): Promise<TVShowResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching on the air TV shows:', error);
      throw error;
    }
  },

  // Get airing today TV shows
  getAiringTodayTVShows: async (page: number = 1): Promise<TVShowResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tv/airing_today?api_key=${API_KEY}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching airing today TV shows:', error);
      throw error;
    }
  },

  // Get TV show details
  getTVShowDetails: async (tvId: number): Promise<TVShowDetails> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tv/${tvId}?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching TV show details:', error);
      throw error;
    }
  },

  // Get TV show credits
  getTVShowCredits: async (tvId: number): Promise<Credits> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tv/${tvId}/credits?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching TV show credits:', error);
      throw error;
    }
  },

  // Get TV show videos
  getTVShowVideos: async (tvId: number): Promise<VideosResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tv/${tvId}/videos?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching TV show videos:', error);
      throw error;
    }
  },

  // Search TV shows
  searchTVShows: async (query: string, page: number = 1): Promise<TVShowResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching TV shows:', error);
      throw error;
    }
  },

  // Get genres for TV shows
  getTVGenres: async (): Promise<{ genres: { id: number; name: string }[] }> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/genre/tv/list?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching TV genres:', error);
      throw error;
    }
  },

  // Get TV shows by genre
  getTVShowsByGenre: async (genreId: number, page: number = 1): Promise<TVShowResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching TV shows by genre:', error);
      throw error;
    }
  },

  // Helper functions for image URLs (reusing same functions as movieApi)
  getPosterUrl: (path: string | null, size: string = 'w500'): string => {
    if (!path) return '';
    return `${IMAGE_BASE_URL}/${size}${path}`;
  },

  getBackdropUrl: (path: string | null, size: string = 'w1280'): string => {
    if (!path) return '';
    return `${IMAGE_BASE_URL}/${size}${path}`;
  },

  getProfileUrl: (path: string | null, size: string = 'w185'): string => {
    if (!path) return '';
    return `${IMAGE_BASE_URL}/${size}${path}`;
  },
}; 