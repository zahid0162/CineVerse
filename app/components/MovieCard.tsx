import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { movieApi } from '../services/movieApi';
import { tvApi } from '../services/tvApi';
import { Movie } from '../types/movie';

// Enhanced movie type that can also contain TV show properties
interface ContentItem extends Movie {
  media_type?: 'movie' | 'tv';
  name?: string;
  first_air_date?: string;
}

interface MovieCardProps {
  movie: ContentItem;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 16px padding on each side + 16px gap

export default function MovieCard({ movie, onPress }: MovieCardProps) {
  const router = useRouter();
  const { themeState } = useTheme();
  const { theme } = themeState;
  const [isLongPressed, setIsLongPressed] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  
  // Determine if this is a TV show
  const isTV = movie.media_type === 'tv';
  
  // Get the title (either movie title or TV show name)
  const title = isTV ? movie.name || movie.title : movie.title;
  
  // Get release date (either movie release date or TV show first air date)
  const releaseDate = isTV ? movie.first_air_date || movie.release_date : movie.release_date;

  useEffect(() => {
    checkWatchlistStatus();
  }, [movie.id]);

  const checkWatchlistStatus = async () => {
    try {
      // Check appropriate watchlist based on content type
      const watchlistKey = isTV ? 'tvWatchlist' : 'watchlist';
      const watchlist = await AsyncStorage.getItem(watchlistKey);
      
      if (watchlist) {
        const watchlistArray = JSON.parse(watchlist);
        setIsInWatchlist(watchlistArray.some((item: any) => item.id === movie.id));
      }
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const toggleWatchlist = async () => {
    try {
      // Use appropriate watchlist based on content type
      const watchlistKey = isTV ? 'tvWatchlist' : 'watchlist';
      const watchlist = await AsyncStorage.getItem(watchlistKey);
      let watchlistArray = watchlist ? JSON.parse(watchlist) : [];

      if (isInWatchlist) {
        watchlistArray = watchlistArray.filter((item: any) => item.id !== movie.id);
        Toast.show({
          type: 'success',
          text1: 'Removed from Watchlist',
          text2: `${title} has been removed from your watchlist`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      } else {
        // Add media_type marker for when we read from the watchlist
        const itemToAdd = isTV 
          ? { ...movie, media_type: 'tv' }
          : { ...movie, media_type: 'movie' };
        
        watchlistArray.push(itemToAdd);
        Toast.show({
          type: 'success',
          text1: 'Added to Watchlist',
          text2: `${title} has been added to your watchlist`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }

      await AsyncStorage.setItem(watchlistKey, JSON.stringify(watchlistArray));
      setIsInWatchlist(!isInWatchlist);
      setIsLongPressed(false);
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

  const handlePress = () => {
    if (!isLongPressed) {
      if (onPress) {
        onPress();
      } else {
        // Navigate to the appropriate detail page
        if (isTV) {
          router.push(`/tv/${movie.id}` as any);
        } else {
          router.push(`/movie/${movie.id}`);
        }
      }
    }
  };

  const handleLongPress = () => {
    setIsLongPressed(true);
  };

  const closeModal = () => {
    setIsLongPressed(false);
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const formatYear = (dateString: string) => {
    return new Date(dateString).getFullYear().toString();
  };

  const handleShare = async () => {
    try {
      // Generate appropriate share URL based on content type
      const contentType = isTV ? 'tv' : 'movie';
      const contentUrl = `https://www.themoviedb.org/${contentType}/${movie.id}`;
      const releaseYear = releaseDate ? formatYear(releaseDate) : '';
      const message = `Check out ${title} ${releaseYear ? `(${releaseYear})` : ''} on MovieFlix!\n${contentUrl}`;
      
      const result = await Share.share({
        message,
        title: title,
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
      
      closeModal();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to share content',
        position: 'top',
        topOffset: 60,
      });
      console.error('Error sharing:', error);
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.container} 
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: isTV 
                ? tvApi.getPosterUrl(movie.poster_path, 'w342')
                : movieApi.getPosterUrl(movie.poster_path, 'w342'),
            }}
            style={styles.poster}
            contentFit="cover"
            placeholder={require('../../assets/images/icon.png')}
            transition={200}
          />
          
          <View style={styles.posterOverlay}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{formatRating(movie.vote_average)}</Text>
            </View>
            {isTV && (
              <View style={styles.tvBadge}>
                <Text style={styles.tvBadgeText}>TV</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.year}>
            {releaseDate ? formatYear(releaseDate) : 'TBA'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Long Press Menu Modal */}
      <Modal
        visible={isLongPressed}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={toggleWatchlist}
                >
                  <Ionicons 
                    name={isInWatchlist ? "bookmark" : "bookmark-outline"} 
                    size={24} 
                    color={theme.primary || '#0099ff'} 
                  />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>
                    {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    closeModal();
                    if (isTV) {
                      router.push(`/tv/${movie.id}` as any);
                    } else {
                      router.push(`/movie/${movie.id}`);
                    }
                  }}
                >
                  <Ionicons name="information-circle-outline" size={24} color={theme.primary || '#0099ff'} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>View Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.menuItem, { borderBottomWidth: 0 }]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-social-outline" size={24} color={theme.primary || '#0099ff'} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: 20,
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  poster: {
    width: '100%',
    aspectRatio: 2/3,
  },
  posterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  tvBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tvBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  year: {
    fontSize: 12,
    color: '#aaa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
});