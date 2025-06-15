import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import LoadingSpinner from '../components/LoadingSpinner';
import MovieCard from '../components/MovieCard';
import { useTheme } from '../contexts/ThemeContext';
import { movieApi } from '../services/movieApi';
import { tvApi } from '../services/tvApi';
import { Movie, Video } from '../types/movie';
import { TVShow } from '../types/tv';

const { width, height } = Dimensions.get('window');

interface ContentSection {
  title: string;
  endpoint: string;
  data: Movie[] | TVShow[];
  type: 'movie' | 'tv';
}

export default function HomeScreen() {
  const router = useRouter();
  const { themeState } = useTheme();
  const { theme } = themeState;
  const [sections, setSections] = useState<ContentSection[]>([
    { title: 'Popular Movies', endpoint: 'popular', data: [], type: 'movie' },
    { title: 'Popular TV Shows', endpoint: 'popular', data: [], type: 'tv' },
    { title: 'Now Playing', endpoint: 'now_playing', data: [], type: 'movie' },
    { title: 'On The Air', endpoint: 'on_the_air', data: [], type: 'tv' },
    { title: 'Top Rated Movies', endpoint: 'top_rated', data: [], type: 'movie' },
    { title: 'Top Rated TV Shows', endpoint: 'top_rated', data: [], type: 'tv' },
    { title: 'Upcoming Movies', endpoint: 'upcoming', data: [], type: 'movie' },
  ]);
  const [featuredContent, setFeaturedContent] = useState<Movie | TVShow | null>(null);
  const [featuredContentType, setFeaturedContentType] = useState<'movie' | 'tv'>('movie');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);
  const [featuredTrailer, setFeaturedTrailer] = useState<Video | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load movie data
      const [popularMovies, nowPlayingMovies, topRatedMovies, upcomingMovies] = await Promise.all([
        movieApi.getPopularMovies(1),
        movieApi.getNowPlayingMovies(1),
        movieApi.getTopRatedMovies(1),
        movieApi.getUpcomingMovies(1),
      ]);

      // Load TV show data
      const [popularTV, onTheAirTV, topRatedTV] = await Promise.all([
        tvApi.getPopularTVShows(1),
        tvApi.getOnTheAirTVShows(1),
        tvApi.getTopRatedTVShows(1),
      ]);

      // Randomly choose featured content from either popular movies or popular TV shows
      const useMovieAsFeatured = Math.random() > 0.5;
      
      if (useMovieAsFeatured && popularMovies.results.length > 0) {
        const featured = popularMovies.results[0];
        setFeaturedContent(featured);
        setFeaturedContentType('movie');
        
        // Get trailer for featured movie
        try {
          const videosData = await movieApi.getMovieVideos(featured.id);
          const trailers = videosData.results.filter(
            video => video.site === 'YouTube' && 
            (video.type === 'Trailer' || video.type === 'Teaser')
          );
          
          if (trailers.length > 0) {
            setFeaturedTrailer(trailers[0]);
          }
        } catch (error) {
          console.error('Error loading featured movie trailer:', error);
        }
      } else if (popularTV.results.length > 0) {
        const featured = popularTV.results[0];
        setFeaturedContent(featured);
        setFeaturedContentType('tv');
        
        // Get trailer for featured TV show
        try {
          const videosData = await tvApi.getTVShowVideos(featured.id);
          const trailers = videosData.results.filter(
            video => video.site === 'YouTube' && 
            (video.type === 'Trailer' || video.type === 'Teaser')
          );
          
          if (trailers.length > 0) {
            setFeaturedTrailer(trailers[0]);
          }
        } catch (error) {
          console.error('Error loading featured TV show trailer:', error);
        }
      }

      // Set sections
      setSections([
        {
          title: 'Popular Movies',
          endpoint: 'popular',
          data: popularMovies.results.slice(useMovieAsFeatured ? 1 : 0, useMovieAsFeatured ? 11 : 10),
          type: 'movie'
        },
        {
          title: 'Popular TV Shows',
          endpoint: 'popular',
          data: popularTV.results.slice(!useMovieAsFeatured ? 1 : 0, !useMovieAsFeatured ? 11 : 10),
          type: 'tv'
        },
        {
          title: 'Now Playing',
          endpoint: 'now_playing',
          data: nowPlayingMovies.results.slice(0, 10),
          type: 'movie'
        },
        {
          title: 'On The Air',
          endpoint: 'on_the_air',
          data: onTheAirTV.results.slice(0, 10),
          type: 'tv'
        },
        {
          title: 'Top Rated Movies',
          endpoint: 'top_rated',
          data: topRatedMovies.results.slice(0, 10),
          type: 'movie'
        },
        {
          title: 'Top Rated TV Shows',
          endpoint: 'top_rated',
          data: topRatedTV.results.slice(0, 10),
          type: 'tv'
        },
        {
          title: 'Upcoming Movies',
          endpoint: 'upcoming',
          data: upcomingMovies.results.slice(0, 10),
          type: 'movie'
        },
      ]);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const renderContentItem = ({ item, type }: { item: Movie | TVShow, type: 'movie' | 'tv' }) => {
    if (type === 'movie') {
      return <MovieCard movie={item as Movie} />;
    } else {
      // Use the same MovieCard component but pass TV show data with a type indicator
      const tvShow = item as TVShow;
      return <MovieCard 
        movie={{
          ...tvShow,
          title: tvShow.name,
          release_date: tvShow.first_air_date,
          media_type: 'tv'
        } as any} 
      />;
    }
  };

  const handleSeeAll = (endpoint: string, title: string, type: 'movie' | 'tv') => {
    router.push({
      pathname: "/category/[endpoint]",
      params: { endpoint, title, type }
    });
  };
  
  const renderSection = ({ item: section }: { item: ContentSection }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
        <TouchableOpacity onPress={() => handleSeeAll(section.endpoint, section.title, section.type)}>
          <Text style={[styles.seeAllText, { color: theme.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={section.data as any}
        renderItem={({ item }) => renderContentItem({ item, type: section.type })}
        keyExtractor={(item) => `${section.title}-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moviesList}
      />
    </View>
  );

  const playTrailer = () => {
    if (featuredTrailer) {
      setTrailerModalVisible(true);
    }
  };

  const getFeaturedTitle = () => {
    if (!featuredContent) return '';
    return featuredContentType === 'movie' 
      ? (featuredContent as Movie).title 
      : (featuredContent as TVShow).name;
  };

  const getFeaturedReleaseYear = () => {
    if (!featuredContent) return '';
    const dateString = featuredContentType === 'movie' 
      ? (featuredContent as Movie).release_date 
      : (featuredContent as TVShow).first_air_date;
    
    return dateString ? new Date(dateString).getFullYear().toString() : '';
  };

  const navigateToFeaturedDetail = () => {
    if (!featuredContent) return;
    if (featuredContentType === 'movie') {
      router.push(`/movie/${featuredContent.id}`);
    } else {
      router.push(`/tv/${featuredContent.id}` as any);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading content..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      {/* Featured Content */}
      {featuredContent && (
        <TouchableOpacity
          style={styles.featuredContainer}
          onPress={navigateToFeaturedDetail}
          activeOpacity={0.9}
        >
          <Image
            source={{
              uri: featuredContentType === 'movie' 
                ? movieApi.getBackdropUrl(featuredContent.backdrop_path, 'w1280')
                : tvApi.getBackdropUrl(featuredContent.backdrop_path, 'w1280'),
            }}
            style={styles.featuredImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={themeState.isDark ? ['transparent', 'rgba(0,0,0,0.7)', '#000'] as const : theme.gradient as any}
            style={styles.featuredGradient}
          />
          <View style={styles.featuredContent}>
            <View style={[styles.featuredBadge, { backgroundColor: theme.overlay }]}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.featuredRating}>
                {featuredContent.vote_average.toFixed(1)}
              </Text>
            </View>
            <View style={styles.featuredTitleContainer}>
              <Text style={styles.featuredTitle}>{getFeaturedTitle()}</Text>
              <Text style={styles.featuredYear}>{getFeaturedReleaseYear()}</Text>
            </View>
            <View style={styles.featuredButtons}>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.primary }]}
                onPress={navigateToFeaturedDetail}
              >
                <Ionicons name="play" size={16} color="#fff" />
                <Text style={styles.playButtonText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.featuredButton, { backgroundColor: theme.overlay }]}
                onPress={playTrailer}
                disabled={!featuredTrailer}
              >
                <Ionicons name="play-circle-outline" size={16} color="#fff" />
                <Text style={styles.featuredButtonText}>Trailer</Text>
              </TouchableOpacity>
              <View style={[styles.typeBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.typeBadgeText}>
                  {featuredContentType === 'movie' ? 'MOVIE' : 'TV'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Content Sections */}
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.title}
        scrollEnabled={false}
      />

      {/* Trailer Modal */}
      <Modal
        visible={trailerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTrailerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                {featuredTrailer?.name || 'Trailer'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setTrailerModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: `https://www.youtube.com/embed/${featuredTrailer?.key}` }}
              style={styles.webView}
              allowsFullscreenVideo
              javaScriptEnabled
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  featuredContainer: {
    height: height * 0.6,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredRating: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  featuredTitleContainer: {
    marginBottom: 12,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  featuredYear: {
    fontSize: 16,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  featuredButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  featuredButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  moviesList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    height: '50%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#111',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  webView: {
    flex: 1,
  },
}); 