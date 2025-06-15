import { Ionicons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import LoadingSpinner from '../components/LoadingSpinner';
import MovieCard from '../components/MovieCard';
import { useTheme } from '../contexts/ThemeContext';
import { movieApi } from '../services/movieApi';
import { tvApi } from '../services/tvApi';
import { Genre, Movie } from '../types/movie';
import { TVShow } from '../types/tv';

const { width } = Dimensions.get('window');

// Create a union type for search results that properly handles both content types
interface MovieWithType extends Movie {
  media_type: 'movie';
}

interface TVShowWithType extends TVShow {
  media_type: 'tv';
  title: string; // For MovieCard compatibility
  release_date: string; // For MovieCard compatibility
}

type ContentItem = MovieWithType | TVShowWithType;
type SearchType = 'movies' | 'tv' | 'all';

export default function SearchScreen() {
  const { themeState } = useTheme();
  const { theme } = themeState;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTVGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [genresLoading, setGenresLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchType, setSearchType] = useState<SearchType>('all');

  useEffect(() => {
    loadGenres();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      search();
    } else {
      setSearchResults([]);
      setPage(1);
      setHasMore(true);
    }
  }, [searchQuery, searchType]);

  useEffect(() => {
    if (selectedGenre) {
      loadContentByGenre();
    }
  }, [selectedGenre, searchType]);

  const loadGenres = async () => {
    try {
      setGenresLoading(true);
      // Load both movie and TV genres
      const [movieGenresResponse, tvGenresResponse] = await Promise.all([
        movieApi.getGenres(),
        tvApi.getTVGenres()
      ]);
      
      setMovieGenres(movieGenresResponse.genres);
      setTVGenres(tvGenresResponse.genres);
    } catch (error) {
      console.error('Error loading genres:', error);
    } finally {
      setGenresLoading(false);
    }
  };

  const search = async (newSearch = true) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const currentPage = newSearch ? 1 : page;
      
      let results: ContentItem[] = [];
      
      // Search based on the selected type
      if (searchType === 'movies' || searchType === 'all') {
        const movieResponse = await movieApi.searchMovies(searchQuery, currentPage);
        const moviesWithType = movieResponse.results.map(movie => ({
          ...movie,
          media_type: 'movie' as const
        }));
        results = [...results, ...moviesWithType];
      }
      
      if (searchType === 'tv' || searchType === 'all') {
        const tvResponse = await tvApi.searchTVShows(searchQuery, currentPage);
        const tvShowsWithType = tvResponse.results.map(show => ({
          ...show,
          media_type: 'tv' as const,
          title: show.name,
          release_date: show.first_air_date
        }));
        results = [...results, ...tvShowsWithType];
      }
      
      // If it's a new search, replace results. Otherwise, append
      if (newSearch) {
        setSearchResults(results);
        setSelectedGenre(null);
      } else {
        setSearchResults(prev => [...prev, ...results]);
      }
      
      // For simplicity, just increment page and assume there's more if we got results
      setPage(currentPage + 1);
      setHasMore(results.length > 0);
    } catch (error) {
      console.error('Error searching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContentByGenre = async (newSearch = true) => {
    if (!selectedGenre) return;

    try {
      setLoading(true);
      const currentPage = newSearch ? 1 : page;
      
      let results: ContentItem[] = [];
      
      // Get content by genre based on the selected type
      if (searchType === 'movies' || searchType === 'all') {
        const movieResponse = await movieApi.getMoviesByGenre(selectedGenre, currentPage);
        const moviesWithType = movieResponse.results.map(movie => ({
          ...movie,
          media_type: 'movie' as const
        }));
        results = [...results, ...moviesWithType];
      }
      
      if (searchType === 'tv' || searchType === 'all') {
        const tvResponse = await tvApi.getTVShowsByGenre(selectedGenre, currentPage);
        const tvShowsWithType = tvResponse.results.map(show => ({
          ...show,
          media_type: 'tv' as const,
          title: show.name,
          release_date: show.first_air_date
        }));
        results = [...results, ...tvShowsWithType];
      }
      
      if (newSearch) {
        setSearchResults(results);
        setSearchQuery('');
      } else {
        setSearchResults(prev => [...prev, ...results]);
      }
      
      setPage(currentPage + 1);
      setHasMore(results.length > 0);
    } catch (error) {
      console.error('Error loading content by genre:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenrePress = (genreId: number) => {
    if (selectedGenre === genreId) {
      setSelectedGenre(null);
      setSearchResults([]);
      setPage(1);
      setHasMore(true);
    } else {
      setSelectedGenre(genreId);
      setPage(1);
      setHasMore(true);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      if (searchQuery.length >= 2) {
        search(false);
      } else if (selectedGenre) {
        loadContentByGenre(false);
      }
    }
  };

  const renderItem = ({ item }: { item: ContentItem }) => (
    <View style={styles.movieItem}>
      <MovieCard movie={item as any} />
    </View>
  );

  // Get the appropriate genres based on the search type
  const getGenres = () => {
    if (searchType === 'movies') return movieGenres;
    if (searchType === 'tv') return tvGenres;
    
    // For 'all', combine genres but avoid duplicates
    const combinedGenres: Genre[] = [...movieGenres];
    tvGenres.forEach(tvGenre => {
      if (!combinedGenres.some(movieGenre => movieGenre.id === tvGenre.id)) {
        combinedGenres.push(tvGenre);
      }
    });
    return combinedGenres;
  };

  const renderGenreChip = ({ item }: { item: Genre }) => (
    <TouchableOpacity
      style={[
        styles.genreChip,
        { backgroundColor: theme.card, borderColor: theme.border },
        selectedGenre === item.id && { backgroundColor: theme.primary, borderColor: theme.primary },
      ]}
      onPress={() => handleGenrePress(item.id)}
    >
      <Text
        style={[
          styles.genreChipText,
          { color: theme.textSecondary },
          selectedGenre === item.id && { color: '#fff' },
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <LoadingSpinner text="Loading more..." size="small" />
      </View>
    );
  };

  const handleSearchTypeChange = (index: number) => {
    const types: SearchType[] = ['all', 'movies', 'tv'];
    setSearchType(types[index]);
    setSelectedGenre(null);
    setPage(1);
    
    // If there's an active search query, trigger a new search
    if (searchQuery.length >= 2) {
      setSearchResults([]); // Clear results before new search
    } else {
      setSearchResults([]);
    }
  };

  const getPlaceholderText = () => {
    if (searchType === 'movies') return "Search movies...";
    if (searchType === 'tv') return "Search TV shows...";
    return "Search movies & TV shows...";
  };

  const getEmptyStateText = () => {
    if (searchType === 'movies') return "No movies found";
    if (searchType === 'tv') return "No TV shows found";
    return "No content found";
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Type Selector */}
      <SegmentedControl
        values={["All", "Movies", "TV Shows"]}
        selectedIndex={searchType === 'all' ? 0 : searchType === 'movies' ? 1 : 2}
        onChange={(event: { nativeEvent: { selectedSegmentIndex: number } }) => {
          handleSearchTypeChange(event.nativeEvent.selectedSegmentIndex);
        }}
        style={styles.segmentedControl}
        tintColor={theme.primary}
        fontStyle={{color: theme.text}}
        activeFontStyle={{color: '#fff'}}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={getPlaceholderText()}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Genres */}
      {!genresLoading && (
        <View style={styles.genresSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Browse by Genre</Text>
          <FlatList
            data={getGenres()}
            renderItem={renderGenreChip}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genresList}
          />
        </View>
      )}

      {/* Results */}
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.resultsContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          {searchQuery.length > 0 && !loading ? (
            <>
              <Ionicons name="search" size={64} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.text }]}>{getEmptyStateText()}</Text>
              <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
                Try searching with different keywords
              </Text>
            </>
          ) : selectedGenre && !loading ? (
            <>
              <Ionicons name="film" size={64} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.text }]}>{getEmptyStateText()}</Text>
              <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
                Try selecting a different genre
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="search" size={64} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchType === 'movies' ? 'Discover Movies' : 
                 searchType === 'tv' ? 'Discover TV Shows' : 
                 'Discover Movies & TV Shows'}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
                Search or browse by genre
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  segmentedControl: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  genresSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  genresList: {
    paddingHorizontal: 16,
  },
  genreChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  genreChipText: {
    fontSize: 14,
  },
  resultsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-evenly',
  },
  movieItem: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
}); 