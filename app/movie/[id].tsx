import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';

import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { movieApi } from '../services/movieApi';
import { Cast, Credits, MovieDetails, Video } from '../types/movie';

const { width, height } = Dimensions.get('window');

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { themeState } = useTheme();
  const { theme } = themeState;
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<Video | null>(null);

  useEffect(() => {
    if (id) {
      loadMovieData();
      checkWatchlistStatus();
    }
  }, [id]);

  const loadMovieData = async () => {
    try {
      setLoading(true);
      const movieId = parseInt(id!);
      
      const [movieData, creditsData, videosData] = await Promise.all([
        movieApi.getMovieDetails(movieId),
        movieApi.getMovieCredits(movieId),
        movieApi.getMovieVideos(movieId),
      ]);

      setMovie(movieData);
      setCredits(creditsData);
      
      // Filter for YouTube videos and prioritize trailers
      const youtubeVideos = videosData.results.filter(video => video.site === 'YouTube');
      const trailers = youtubeVideos.filter(video => 
        video.type === 'Trailer' || video.type === 'Teaser'
      );
      
      if (trailers.length > 0) {
        setSelectedTrailer(trailers[0]);
      } else if (youtubeVideos.length > 0) {
        setSelectedTrailer(youtubeVideos[0]);
      }
      
      setVideos(youtubeVideos);
    } catch (error) {
      console.error('Error loading movie data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load movie details',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlistStatus = async () => {
    try {
      const watchlist = await AsyncStorage.getItem('watchlist');
      if (watchlist) {
        const watchlistArray = JSON.parse(watchlist);
        setIsInWatchlist(watchlistArray.some((item: any) => item.id === parseInt(id!)));
      }
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const toggleWatchlist = async () => {
    try {
      const watchlist = await AsyncStorage.getItem('watchlist');
      let watchlistArray = watchlist ? JSON.parse(watchlist) : [];

      if (isInWatchlist) {
        watchlistArray = watchlistArray.filter((item: any) => item.id !== movie!.id);
        Toast.show({
          type: 'success',
          text1: 'Removed from Watchlist',
          text2: `${movie!.title} has been removed from your watchlist`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      } else {
        watchlistArray.push(movie);
        Toast.show({
          type: 'success',
          text1: 'Added to Watchlist',
          text2: `${movie!.title} has been added to your watchlist`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }

      await AsyncStorage.setItem('watchlist', JSON.stringify(watchlistArray));
      setIsInWatchlist(!isInWatchlist);
    } catch (error) {
      console.error('Error updating watchlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update watchlist',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderCastItem = ({ item }: { item: Cast }) => (
    <TouchableOpacity 
      style={styles.castItem}
      onPress={() => router.push(`/cast/${item.id}` as any)}
    >
      <Image
        source={{
          uri: movieApi.getProfileUrl(item.profile_path, 'w185'),
        }}
        style={styles.castImage}
        contentFit="cover"
        placeholder={require('../../assets/images/icon.png')}
      />
      <Text style={[styles.castName, { color: theme.text }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.castCharacter, { color: theme.textTertiary }]} numberOfLines={2}>
        {item.character}
      </Text>
    </TouchableOpacity>
  );

  const playTrailer = () => {
    if (selectedTrailer) {
      setTrailerModalVisible(true);
    } else {
      Toast.show({
        type: 'info',
        text1: 'No Trailer',
        text2: 'No trailer available for this movie',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  const handleShare = async () => {
    try {
      if (!movie) return;
      
      const movieUrl = `https://www.themoviedb.org/movie/${movie.id}`;
      const releaseYear = movie.release_date 
        ? new Date(movie.release_date).getFullYear().toString() 
        : '';
      
      const message = `Check out ${movie.title} ${releaseYear ? `(${releaseYear})` : ''} on MovieFlix!\n${movieUrl}`;
      
      const result = await Share.share({
        message,
        title: movie.title,
      });
      
      if (result.action === Share.sharedAction) {
        Toast.show({
          type: 'success',
          text1: 'Shared Successfully',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Error sharing movie:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to share movie',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading movie details..." />;
  }

  if (!movie) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle" size={64} color={theme.primary} />
        <Text style={[styles.errorText, { color: theme.text }]}>Movie not found</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: movie.title,
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
          headerRight: () => (
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Ionicons name="share-social-outline" size={24} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleWatchlist} style={styles.headerButton}>
                <Ionicons
                  name={isInWatchlist ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={theme.primary}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerContainer}>
          <Image
            source={{
              uri: movieApi.getBackdropUrl(movie.backdrop_path, 'w1280'),
            }}
            style={styles.backdrop}
            contentFit="cover"
          />
          <LinearGradient
            colors={themeState.isDark ? ['transparent', 'rgba(0,0,0,0.8)', '#000'] as const : theme.gradient as any}
            style={styles.gradient}
          />
          
          {/* Play Trailer Button */}
          {selectedTrailer && (
            <TouchableOpacity
              style={styles.playTrailerButton}
              onPress={playTrailer}
            >
              <Ionicons name="play-circle" size={60} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Movie Info */}
        <View style={styles.contentContainer}>
          <View style={styles.movieHeader}>
            <Image
              source={{
                uri: movieApi.getPosterUrl(movie.poster_path, 'w342'),
              }}
              style={styles.poster}
              contentFit="cover"
            />
            
            <View style={styles.movieInfo}>
              <Text style={[styles.title, { color: theme.text }]}>{movie.title}</Text>
              {movie.tagline && <Text style={[styles.tagline, { color: theme.textTertiary }]}>{movie.tagline}</Text>}
              
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={[styles.rating, { color: theme.text }]}>{movie.vote_average.toFixed(1)}</Text>
                <Text style={[styles.voteCount, { color: theme.textTertiary }]}>({movie.vote_count})</Text>
              </View>
              
              <View style={styles.metaInfo}>
                <Text style={[styles.metaText, { color: theme.textTertiary }]}>{formatDate(movie.release_date)}</Text>
                <Text style={[styles.metaText, { color: theme.textTertiary }]}>•</Text>
                <Text style={[styles.metaText, { color: theme.textTertiary }]}>{formatRuntime(movie.runtime)}</Text>
              </View>
              
              <View style={styles.genresContainer}>
                {movie.genres.map((genre) => (
                  <View key={genre.id} style={[styles.genreTag, { backgroundColor: theme.primary }]}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
              
            </View>
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
            <Text style={[styles.overview, { color: theme.textSecondary }]}>{movie.overview}</Text>
          </View>

          {/* Cast */}
          {credits && credits.cast.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Cast</Text>
              <FlatList
                data={credits.cast.slice(0, 10)}
                renderItem={renderCastItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castList}
              />
            </View>
          )}

          {/* Production Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Production</Text>
            {movie.production_companies.length > 0 && (
              <View style={styles.productionRow}>
                <Text style={[styles.productionLabel, { color: theme.textTertiary }]}>Companies:</Text>
                <Text style={[styles.productionValue, { color: theme.text }]}>
                  {movie.production_companies.map(c => c.name).join(', ')}
                </Text>
              </View>
            )}
            <View style={styles.productionRow}>
              <Text style={[styles.productionLabel, { color: theme.textTertiary }]}>Budget:</Text>
              <Text style={[styles.productionValue, { color: theme.text }]}>
                {movie.budget > 0 ? `$${movie.budget.toLocaleString()}` : 'Unknown'}
              </Text>
            </View>
            <View style={styles.productionRow}>
              <Text style={[styles.productionLabel, { color: theme.textTertiary }]}>Revenue:</Text>
              <Text style={[styles.productionValue, { color: theme.text }]}>
                {movie.revenue > 0 ? `$${movie.revenue.toLocaleString()}` : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Trailer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={trailerModalVisible}
        onRequestClose={() => setTrailerModalVisible(false)}
      >
        <View style={styles.trailerModalContainer}>
          <View style={styles.trailerModalContent}>
            <TouchableOpacity 
              style={styles.trailerCloseButton}
              onPress={() => setTrailerModalVisible(false)}
            >
              <Ionicons name="close-circle" size={36} color="#fff" />
            </TouchableOpacity>
            
            {selectedTrailer && (
              <WebView
                style={styles.trailerVideo}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                source={{ uri: `https://www.youtube.com/embed/${selectedTrailer.key}?rel=0&autoplay=1` }}
                allowsFullscreenVideo={true}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'relative',
    height: height * 0.3,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -60,
  },
  movieHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  voteCount: {
    fontSize: 14,
    marginLeft: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    marginRight: 8,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  genreText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overview: {
    fontSize: 16,
    lineHeight: 24,
  },
  castList: {
    paddingRight: 16,
  },
  castItem: {
    width: 100,
    marginRight: 12,
  },
  castImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  castName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  castCharacter: {
    fontSize: 12,
    textAlign: 'center',
  },
  productionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  productionLabel: {
    fontSize: 14,
    width: 80,
  },
  productionValue: {
    fontSize: 14,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBackButton: {
    padding: 8,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  playTrailerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  watchTrailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  watchTrailerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  trailerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailerModalContent: {
    width: '100%',
    height: width * 0.75, // 16:9 aspect ratio
    position: 'relative',
  },
  trailerVideo: {
    flex: 1,
  },
  trailerCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 18,
  },
}); 