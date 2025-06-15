import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import LoadingSpinner from '../components/LoadingSpinner';
import MovieCard from '../components/MovieCard';
import { useTheme } from '../contexts/ThemeContext';
import { movieApi } from '../services/movieApi';
import { Movie } from '../types/movie';

const { width } = Dimensions.get('window');

// Map endpoint to display name
const categoryTitles: Record<string, string> = {
  'popular': 'Popular Movies',
  'now_playing': 'Now Playing',
  'top_rated': 'Top Rated Movies',
  'upcoming': 'Upcoming Movies',
};

export default function CategoryScreen() {
  const { endpoint, title } = useLocalSearchParams<{ endpoint: string; title?: string }>();
  const router = useRouter();
  const { themeState } = useTheme();
  const { theme } = themeState;
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (endpoint) {
      loadMovies(1);
    }
  }, [endpoint]);

  const loadMovies = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let response;
      switch (endpoint) {
        case 'popular':
          response = await movieApi.getPopularMovies(pageNum);
          break;
        case 'now_playing':
          response = await movieApi.getNowPlayingMovies(pageNum);
          break;
        case 'top_rated':
          response = await movieApi.getTopRatedMovies(pageNum);
          break;
        case 'upcoming':
          response = await movieApi.getUpcomingMovies(pageNum);
          break;
        default:
          response = await movieApi.getPopularMovies(pageNum);
          break;
      }

      if (pageNum === 1) {
        setMovies(response.results);
      } else {
        setMovies(prev => [...prev, ...response.results]);
      }

      setPage(pageNum);
      setHasMore(pageNum < response.total_pages);
      setError(null);
    } catch (err) {
      console.error('Error loading movies:', err);
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadMovies(page + 1);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  };

  const renderMovieItem = ({ item, index }: { item: Movie; index: number }) => (
    <View style={[
      styles.gridItem, 
      index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight
    ]}>
      <MovieCard movie={item} />
    </View>
  );

  const getCategoryTitle = () => {
    if (title) return title;
    return endpoint ? categoryTitles[endpoint] || 'Movies' : 'Movies';
  };

  if (loading) {
    return <LoadingSpinner text="Loading movies..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: getCategoryTitle(),
          headerStyle: {
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.headerBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.primary} />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={() => loadMovies(1)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={movies}
            renderItem={renderMovieItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.grid}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    padding: 8,
  },
  gridItem: {
    flex: 1,
    margin: 4,
  },
  gridItemLeft: {
    paddingRight: 4,
  },
  gridItemRight: {
    paddingLeft: 4,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBackButton: {
    padding: 8,
  },
}); 