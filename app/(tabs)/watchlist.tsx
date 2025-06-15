import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import MovieCard from '../components/MovieCard';
import { useTheme } from '../contexts/ThemeContext';
import { Movie } from '../types/movie';

const { width } = Dimensions.get('window');

// Create a type that can be either a movie or TV show with media_type marker
interface WatchlistItem extends Movie {
  media_type?: 'movie' | 'tv';
  name?: string;
  first_air_date?: string;
}

type WatchlistType = 'all' | 'movies' | 'tv';

export default function WatchlistScreen() {
  const { themeState } = useTheme();
  const { theme } = themeState;
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeWatchlistType, setActiveWatchlistType] = useState<WatchlistType>('all');

  // Load watchlist when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWatchlist();
    }, [])
  );

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      
      // Load both movie and TV watchlists
      const [movieWatchlistData, tvWatchlistData] = await Promise.all([
        AsyncStorage.getItem('watchlist'),
        AsyncStorage.getItem('tvWatchlist')
      ]);
      
      // Process movie watchlist
      const movieItems = movieWatchlistData 
        ? JSON.parse(movieWatchlistData).map((item: any) => ({ ...item, media_type: 'movie' }))
        : [];
      
      // Process TV show watchlist
      const tvItems = tvWatchlistData 
        ? JSON.parse(tvWatchlistData).map((item: any) => ({ ...item, media_type: 'tv' }))
        : [];
      
      // Combine both watchlists
      setWatchlist([...movieItems, ...tvItems]);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWatchlist();
    setRefreshing(false);
  };

  const removeFromWatchlist = async (id: number, mediaType: 'movie' | 'tv') => {
    const itemTitle = mediaType === 'movie' 
      ? watchlist.find(item => item.id === id)?.title 
      : watchlist.find(item => item.id === id)?.name || watchlist.find(item => item.id === id)?.title;
    
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to remove "${itemTitle}" from your watchlist?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get the appropriate watchlist key
              const watchlistKey = mediaType === 'movie' ? 'watchlist' : 'tvWatchlist';
              
              // Get current watchlist
              const currentWatchlistData = await AsyncStorage.getItem(watchlistKey);
              const currentWatchlist = currentWatchlistData ? JSON.parse(currentWatchlistData) : [];
              
              // Update watchlist
              const updatedWatchlist = currentWatchlist.filter((item: any) => item.id !== id);
              await AsyncStorage.setItem(watchlistKey, JSON.stringify(updatedWatchlist));
              
              // Update state
              setWatchlist(prev => prev.filter(item => !(item.id === id && item.media_type === mediaType)));
            } catch (error) {
              console.error('Error removing from watchlist:', error);
              Alert.alert('Error', 'Failed to remove item from watchlist');
            }
          },
        },
      ]
    );
  };

  const clearWatchlist = async () => {
    Alert.alert(
      'Clear Watchlist',
      'Are you sure you want to remove all items from your watchlist?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeWatchlistType === 'all' || activeWatchlistType === 'movies') {
                await AsyncStorage.removeItem('watchlist');
              }
              
              if (activeWatchlistType === 'all' || activeWatchlistType === 'tv') {
                await AsyncStorage.removeItem('tvWatchlist');
              }
              
              if (activeWatchlistType === 'all') {
                setWatchlist([]);
              } else if (activeWatchlistType === 'movies') {
                setWatchlist(prev => prev.filter(item => item.media_type === 'tv'));
              } else if (activeWatchlistType === 'tv') {
                setWatchlist(prev => prev.filter(item => item.media_type === 'movie'));
              }
            } catch (error) {
              console.error('Error clearing watchlist:', error);
              Alert.alert('Error', 'Failed to clear watchlist');
            }
          },
        },
      ]
    );
  };

  const filteredWatchlist = watchlist.filter(item => {
    if (activeWatchlistType === 'all') return true;
    if (activeWatchlistType === 'movies') return item.media_type === 'movie';
    if (activeWatchlistType === 'tv') return item.media_type === 'tv';
    return true;
  });

  const renderWatchlistItem = ({ item }: { item: WatchlistItem }) => (
    <View style={styles.movieItem}>
      <MovieCard movie={item} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromWatchlist(item.id, item.media_type || 'movie')}
      >
        <Ionicons name="close-circle" size={24} color="#e50914" />
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => {
    const itemCount = filteredWatchlist.length;
    const movieCount = watchlist.filter(item => item.media_type === 'movie').length;
    const tvCount = watchlist.filter(item => item.media_type === 'tv').length;

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Watchlist</Text>
          {itemCount > 0 && (
            <TouchableOpacity onPress={clearWatchlist} style={[styles.clearButton, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
              <Text style={[styles.clearButtonText, { color: theme.primary }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <SegmentedControl
          values={[`All (${movieCount + tvCount})`, `Movies (${movieCount})`, `TV Shows (${tvCount})`]}
          selectedIndex={activeWatchlistType === 'all' ? 0 : activeWatchlistType === 'movies' ? 1 : 2}
          onChange={(event: { nativeEvent: { selectedSegmentIndex: number } }) => {
            const index = event.nativeEvent.selectedSegmentIndex;
            setActiveWatchlistType(index === 0 ? 'all' : index === 1 ? 'movies' : 'tv');
          }}
          style={styles.segmentedControl}
          tintColor={theme.primary}
          fontStyle={{color: theme.text}}
          activeFontStyle={{color: '#fff'}}
        />
        
        {itemCount > 0 && (
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            {itemCount} {activeWatchlistType === 'all' ? 'item' : activeWatchlistType === 'movies' ? 'movie' : 'TV show'}
            {itemCount !== 1 ? 's' : ''} saved
          </Text>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={80} color={theme.border} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {activeWatchlistType === 'all' 
          ? 'Your watchlist is empty' 
          : activeWatchlistType === 'movies' 
            ? 'No movies in your watchlist'
            : 'No TV shows in your watchlist'
        }
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
        {activeWatchlistType === 'all' 
          ? 'Items you bookmark will appear here'
          : activeWatchlistType === 'movies'
            ? 'Movies you bookmark will appear here' 
            : 'TV shows you bookmark will appear here'
        }
      </Text>
      <Text style={[styles.emptyHint, { color: theme.textTertiary }]}>
        Tap the bookmark icon on any {activeWatchlistType === 'all' ? 'item' : activeWatchlistType === 'movies' ? 'movie' : 'TV show'} to add it to your watchlist
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="bookmark" size={64} color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading your watchlist...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {filteredWatchlist.length > 0 ? (
        <FlatList
          data={filteredWatchlist}
          renderItem={renderWatchlistItem}
          keyExtractor={(item) => `${item.media_type || 'movie'}-${item.id}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      ) : (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {renderHeader()}
          {renderEmptyState()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
  },
  header: {
    padding: 16,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  segmentedControl: {
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  movieItem: {
    position: 'relative',
    marginBottom: 4,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 24,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
}); 