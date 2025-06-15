import axios from 'axios';
import { Credits, Genre, MovieDetails, MovieResponse, PersonDetails, PersonMovieCredits, VideosResponse } from '../types/movie';

// Using a demo API key - in production, this should be in environment variables
const API_KEY = '4f5f43495afcc67e9553f6c684a82f84';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const movieApi = {
  // Get popular movies
  getPopularMovies: async (page: number = 1): Promise<MovieResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw error;
    }
  },

  // Get now playing movies
  getNowPlayingMovies: async (page: number = 1): Promise<MovieResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      throw error;
    }
  },

  // Get top rated movies
  getTopRatedMovies: async (page: number = 1): Promise<MovieResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      throw error;
    }
  },

  // Get upcoming movies
  getUpcomingMovies: async (page: number = 1): Promise<MovieResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      throw error;
    }
  },

  // Get movie details
  getMovieDetails: async (movieId: number): Promise<MovieDetails> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  },

  // Get movie credits
  getMovieCredits: async (movieId: number): Promise<Credits> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching movie credits:', error);
      throw error;
    }
  },

  // Get movie videos
  getMovieVideos: async (movieId: number): Promise<VideosResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching movie videos:', error);
      throw error;
    }
  },

  // Search movies
  searchMovies: async (query: string, page: number = 1): Promise<MovieResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  // Get genres
  getGenres: async (): Promise<{ genres: Genre[] }> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },

  // Get movies by genre
  getMoviesByGenre: async (genreId: number, page: number = 1): Promise<MovieResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      throw error;
    }
  },

  // Get person details
  getPersonDetails: async (personId: number): Promise<PersonDetails> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/person/${personId}?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching person details:', error);
      throw error;
    }
  },

  // Get person movie credits
  getPersonMovieCredits: async (personId: number): Promise<PersonMovieCredits> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/person/${personId}/movie_credits?api_key=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching person movie credits:', error);
      throw error;
    }
  },

  // Helper functions for image URLs
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