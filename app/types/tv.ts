export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  original_name: string;
  genre_ids: number[];
}

export interface TVShowDetails extends TVShow {
  episode_run_time: number[];
  genres: Genre[];
  production_companies: ProductionCompany[];
  production_countries: Country[];
  spoken_languages: Language[];
  status: string;
  tagline: string;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Season[];
  homepage: string;
  in_production: boolean;
  networks: Network[];
  created_by: Creator[];
  type: string;
  last_air_date: string;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
}

export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Creator {
  id: number;
  name: string;
  profile_path: string | null;
  credit_id: string;
}

export interface TVShowResponse {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
}

// Re-export common types from movie.ts
import { Country, Credits, Genre, Language, ProductionCompany, Video, VideosResponse } from './movie';
export { Country, Credits, Genre, Language, ProductionCompany, Video, VideosResponse };

export interface PersonTVShowCredit {
  id: number;
  name: string;
  original_name: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  character?: string; // For cast credits
  job?: string; // For crew credits
  department?: string; // For crew credits
  credit_id: string;
  episode_count?: number;
}

export interface PersonTVShowCredits {
  cast: PersonTVShowCredit[];
  crew: PersonTVShowCredit[];
} 