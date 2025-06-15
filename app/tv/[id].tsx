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
import { tvApi } from '../services/tvApi';
import { Cast, Credits, Video } from '../types/movie';
import { Season, TVShowDetails } from '../types/tv';

const { width, height } = Dimensions.get('window');

export default function TVShowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { themeState } = useTheme();
  const { theme } = themeState;
  const [tvShow, setTVShow] = useState<TVShowDetails | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<Video | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  useEffect(() => {
    if (id) {
      loadTVShowData();
      checkWatchlistStatus();
    }
  }, [id]);

  const loadTVShowData = async () => {
    try {
      setLoading(true);
      const tvId = parseInt(id!);
      
      const [tvShowData, creditsData, videosData] = await Promise.all([
        tvApi.getTVShowDetails(tvId),
        tvApi.getTVShowCredits(tvId),
        tvApi.getTVShowVideos(tvId),
      ]);

      setTVShow(tvShowData);
      setCredits(creditsData);
      
      // Set default selected season if there are seasons
      if (tvShowData.seasons && tvShowData.seasons.length > 0) {
        setSelectedSeason(tvShowData.seasons[0]);
      }
      
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
      console.error('Error loading TV show data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load TV show details',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlistStatus = async () => {
    try {
      const tvWatchlist = await AsyncStorage.getItem('tvWatchlist');
      if (tvWatchlist) {
        const watchlistArray = JSON.parse(tvWatchlist);
        setIsInWatchlist(watchlistArray.some((item: any) => item.id === parseInt(id!)));
      }
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const toggleWatchlist = async () => {
    try {
      const tvWatchlist = await AsyncStorage.getItem('tvWatchlist');
      let watchlistArray = tvWatchlist ? JSON.parse(tvWatchlist) : [];

      if (isInWatchlist) {
        watchlistArray = watchlistArray.filter((item: any) => item.id !== tvShow!.id);
        Toast.show({
          type: 'success',
          text1: 'Removed from Watchlist',
          text2: `${tvShow!.name} has been removed from your watchlist`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      } else {
        watchlistArray.push({
          ...tvShow,
          media_type: 'tv' // Add media type to distinguish from movies
        });
        Toast.show({
          type: 'success',
          text1: 'Added to Watchlist',
          text2: `${tvShow!.name} has been added to your watchlist`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }

      await AsyncStorage.setItem('tvWatchlist', JSON.stringify(watchlistArray));
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
          uri: tvApi.getProfileUrl(item.profile_path, 'w185'),
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

  const renderSeasonItem = ({ item }: { item: Season }) => (
    <TouchableOpacity 
      style={[
        styles.seasonItem, 
        selectedSeason?.id === item.id && { 
          borderColor: theme.primary,
          backgroundColor: `${theme.primary}30`
        }
      ]}
      onPress={() => setSelectedSeason(item)}
    >
      <Image
        source={{
          uri: tvApi.getPosterUrl(item.poster_path, 'w185'),
        }}
        style={styles.seasonImage}
        contentFit="cover"
        placeholder={require('../../assets/images/icon.png')}
      />
      <Text style={[styles.seasonName, { color: theme.text }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.episodeCount, { color: theme.textTertiary }]}>
        {item.episode_count} episodes
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
        text2: 'No trailer available for this TV show',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  const handleShare = async () => {
    try {
      if (!tvShow) return;
      
      const tvShowUrl = `https://www.themoviedb.org/tv/${tvShow.id}`;
      const releaseYear = tvShow.first_air_date 
        ? new Date(tvShow.first_air_date).getFullYear().toString() 
        : '';
      
      const message = `Check out ${tvShow.name} ${releaseYear ? `(${releaseYear})` : ''} on MovieFlix!\n${tvShowUrl}`;
      
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading TV Show..." />;
  }

  if (!tvShow) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          Failed to load TV show details
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: tvShow.name,
          headerTransparent: true,
          headerTintColor: 'white',
          headerLeft: (props) => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerContainer}>
          <Image
            source={{
              uri: tvApi.getBackdropUrl(tvShow.backdrop_path, 'original'),
            }}
            style={styles.backdropImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', theme.background]}
            style={styles.gradient}
          />
          <View style={styles.headerContent}>
            <View style={styles.posterContainer}>
              <Image
                source={{
                  uri: tvApi.getPosterUrl(tvShow.poster_path, 'w500'),
                }}
                style={styles.posterImage}
                contentFit="cover"
              />
            </View>
            <View style={styles.infoContainer}>
              <Text style={[styles.title, { color: theme.text }]}>
                {tvShow.name}
              </Text>
              {tvShow.first_air_date && (
                <Text style={[styles.releaseDate, { color: theme.textSecondary }]}>
                  {new Date(tvShow.first_air_date).getFullYear()}
                  {tvShow.status && ` • ${tvShow.status}`}
                </Text>
              )}
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Text style={[styles.rating, { color: theme.text }]}>
                  {tvShow.vote_average.toFixed(1)}/10
                </Text>
              </View>
              <View style={styles.genresContainer}>
                {tvShow.genres.map((genre) => (
                  <View key={genre.id} style={[styles.genreItem, { backgroundColor: theme.card }]}>
                    <Text style={[styles.genreText, { color: theme.text }]}>
                      {genre.name}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={playTrailer}>
                  <Ionicons name="play-circle" size={24} color={theme.primary} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Trailer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={toggleWatchlist}>
                  <Ionicons
                    name={isInWatchlist ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={theme.primary}
                  />
                  <Text style={[styles.actionText, { color: theme.text }]}>Watchlist</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={24} color={theme.primary} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {tvShow.tagline && (
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            "{tvShow.tagline}"
          </Text>
        )}

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
          <Text style={[styles.overview, { color: theme.textSecondary }]}>
            {tvShow.overview || 'No overview available.'}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>First Air Date</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {tvShow.first_air_date ? formatDate(tvShow.first_air_date) : 'Unknown'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Status</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {tvShow.status || 'Unknown'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Seasons</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {tvShow.number_of_seasons || 'Unknown'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Episodes</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {tvShow.number_of_episodes || 'Unknown'}
            </Text>
          </View>
          {tvShow.episode_run_time && tvShow.episode_run_time.length > 0 && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Episode Runtime</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {tvShow.episode_run_time[0]} min
              </Text>
            </View>
          )}
          {tvShow.networks && tvShow.networks.length > 0 && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Network</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {tvShow.networks.map(network => network.name).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {tvShow.seasons && tvShow.seasons.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Seasons</Text>
            <FlatList
              data={tvShow.seasons}
              renderItem={renderSeasonItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seasonsContainer}
            />
            {selectedSeason && (
              <View style={styles.seasonDetails}>
                <Text style={[styles.seasonTitle, { color: theme.text }]}>
                  {selectedSeason.name}
                </Text>
                <Text style={[styles.seasonDate, { color: theme.textSecondary }]}>
                  {selectedSeason.air_date ? formatDate(selectedSeason.air_date) : 'No air date available'} • {selectedSeason.episode_count} episodes
                </Text>
                <Text style={[styles.seasonOverview, { color: theme.textSecondary }]}>
                  {selectedSeason.overview || 'No overview available for this season.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {credits && credits.cast && credits.cast.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cast</Text>
            <FlatList
              data={credits.cast.slice(0, 10)}
              renderItem={renderCastItem}
              keyExtractor={(item) => item.credit_id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castContainer}
            />
          </View>
        )}

        {tvShow.created_by && tvShow.created_by.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Created By</Text>
            <Text style={[styles.creatorsText, { color: theme.text }]}>
              {tvShow.created_by.map(creator => creator.name).join(', ')}
            </Text>
          </View>
        )}
      </ScrollView>
      
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
                {selectedTrailer?.name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setTrailerModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: `https://www.youtube.com/embed/${selectedTrailer?.key}` }}
              style={styles.webView}
              allowsFullscreenVideo
              javaScriptEnabled
            />
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
    height: height * 0.7,
    position: 'relative',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  headerContent: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    padding: 16,
  },
  posterContainer: {
    width: width * 0.3,
    height: width * 0.45,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  releaseDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    marginLeft: 4,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  genreItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 12,
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overview: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  detailItem: {
    width: '50%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  castContainer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  castItem: {
    width: 100,
    marginRight: 12,
  },
  castImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  castName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 2,
  },
  castCharacter: {
    fontSize: 11,
  },
  seasonsContainer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  seasonItem: {
    width: 120,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    padding: 4,
  },
  seasonImage: {
    width: 112,
    height: 168,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  seasonName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 2,
  },
  episodeCount: {
    fontSize: 11,
  },
  seasonDetails: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
  },
  seasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  seasonDate: {
    fontSize: 13,
    marginBottom: 8,
  },
  seasonOverview: {
    fontSize: 14,
    lineHeight: 20,
  },
  creatorsText: {
    fontSize: 15,
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
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
}); 