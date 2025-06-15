import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import { Movie } from '../types/movie';

interface ProfileStats {
  totalMovies: number;
  genres: { [key: string]: number };
  totalRuntime: number;
}

export default function ProfileScreen() {
  const { authState, logout, updateUser } = useAuth();
  const { themeState, setTheme } = useTheme();
  const { theme } = themeState;
  const [watchlistStats, setWatchlistStats] = useState<ProfileStats>({
    totalMovies: 0,
    genres: {},
    totalRuntime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load watchlist for stats
      const watchlistData = await AsyncStorage.getItem('watchlist');
      if (watchlistData) {
        try {
          const watchlist: Movie[] = JSON.parse(watchlistData);
          // Ensure watchlist is an array and filter out any invalid entries
          if (Array.isArray(watchlist)) {
            const validMovies = watchlist.filter(movie => 
              movie && 
              typeof movie === 'object' && 
              movie.id && 
              movie.title
            );
            calculateStats(validMovies);
          } else {
            console.warn('Watchlist data is not an array, resetting...');
            await AsyncStorage.removeItem('watchlist');
            setWatchlistStats({ totalMovies: 0, genres: {}, totalRuntime: 0 });
          }
        } catch (parseError) {
          console.error('Error parsing watchlist data:', parseError);
          // Reset corrupted watchlist data
          await AsyncStorage.removeItem('watchlist');
          setWatchlistStats({ totalMovies: 0, genres: {}, totalRuntime: 0 });
        }
      } else {
        setWatchlistStats({ totalMovies: 0, genres: {}, totalRuntime: 0 });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setWatchlistStats({ totalMovies: 0, genres: {}, totalRuntime: 0 });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (watchlist: Movie[]) => {
    const genres: { [key: string]: number } = {};
    let totalRuntime = 0;

    watchlist.forEach(movie => {
      // Count genres - handle both genre_ids (from search/discovery) and genres (from details)
      if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
        movie.genre_ids.forEach(genreId => {
          const genreName = getGenreName(genreId);
          genres[genreName] = (genres[genreName] || 0) + 1;
        });
      } else if ((movie as any).genres && Array.isArray((movie as any).genres)) {
        // Handle movies from movie details API that have genres array with {id, name}
        (movie as any).genres.forEach((genre: any) => {
          if (genre && genre.name) {
            genres[genre.name] = (genres[genre.name] || 0) + 1;
          }
        });
      }

      // Estimate runtime (since we don't have it in basic movie data)
      totalRuntime += 120; // Average movie runtime
    });

    setWatchlistStats({
      totalMovies: watchlist.length,
      genres,
      totalRuntime,
    });
  };

  const getGenreName = (genreId: number): string => {
    const genreMap: { [key: number]: string } = {
      28: 'Action',
      12: 'Adventure',
      16: 'Animation',
      35: 'Comedy',
      80: 'Crime',
      99: 'Documentary',
      18: 'Drama',
      10751: 'Family',
      14: 'Fantasy',
      36: 'History',
      27: 'Horror',
      10402: 'Music',
      9648: 'Mystery',
      10749: 'Romance',
      878: 'Science Fiction',
      10770: 'TV Movie',
      53: 'Thriller',
      10752: 'War',
      37: 'Western',
    };
    return genreMap[genreId] || 'Unknown';
  };

  const toggleNotifications = async (value: boolean) => {
    try {
      if (authState.user) {
        const updatedUser = {
          ...authState.user,
          preferences: {
            ...authState.user.preferences,
            notifications: value,
          },
        };
        await updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove your watchlist, preferences, and all app data. This action cannot be undone.',
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
              await AsyncStorage.clear();
              setWatchlistStats({ totalMovies: 0, genres: {}, totalRuntime: 0 });
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com/themoviedb/API');
  };

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getTopGenre = (): string => {
    const genres = Object.entries(watchlistStats.genres);
    if (genres.length === 0) return 'No data';
    
    const topGenre = genres.reduce((a, b) => a[1] > b[1] ? a : b);
    return `${topGenre[0]} (${topGenre[1]} movies)`;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatJoinDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const renderStatsCard = () => (
    <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.statsTitle, { color: theme.text }]}>Watchlist Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Ionicons name="film" size={24} color={theme.primary} />
          <Text style={[styles.statNumber, { color: theme.text }]}>{watchlistStats.totalMovies}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Movies Saved</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={24} color={theme.primary} />
          <Text style={[styles.statNumber, { color: theme.text }]}>{formatRuntime(watchlistStats.totalRuntime)}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Est. Runtime</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={24} color={theme.primary} />
          <Text style={[styles.statNumber, { color: theme.text }]}>{getTopGenre()}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Favorite Genre</Text>
        </View>
      </View>
    </View>
  );

  const renderSettingsSection = () => (
    <View style={[styles.section, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
      
      <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card }]}>
        <View style={styles.settingLeft}>
          <Ionicons name="notifications" size={24} color={theme.text} />
          <Text style={[styles.settingText, { color: theme.text }]}>Notifications</Text>
        </View>
        <Switch
          value={authState.user?.preferences.notifications ?? true}
          onValueChange={toggleNotifications}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={theme.background}
        />
      </TouchableOpacity>

      <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
        <View style={styles.settingLeft}>
          <Ionicons name="color-palette" size={24} color={theme.text} />
          <Text style={[styles.settingText, { color: theme.text }]}>Theme</Text>
        </View>
      </View>

      <View style={styles.themeOptions}>
        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: theme.surface },
            themeState.mode === 'light' && { borderColor: theme.primary, borderWidth: 2 }
          ]}
          onPress={() => setTheme('light')}
        >
          <Ionicons name="sunny" size={20} color={theme.text} />
          <Text style={[styles.themeOptionText, { color: theme.text }]}>Light</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: theme.surface },
            themeState.mode === 'dark' && { borderColor: theme.primary, borderWidth: 2 }
          ]}
          onPress={() => setTheme('dark')}
        >
          <Ionicons name="moon" size={20} color={theme.text} />
          <Text style={[styles.themeOptionText, { color: theme.text }]}>Dark</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: theme.surface },
            themeState.mode === 'auto' && { borderColor: theme.primary, borderWidth: 2 }
          ]}
          onPress={() => setTheme('auto')}
        >
          <Ionicons name="phone-portrait" size={20} color={theme.text} />
          <Text style={[styles.themeOptionText, { color: theme.text }]}>Auto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAccountSection = () => (
    <View style={[styles.section, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
      
      <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card }]}>
        <View style={styles.settingLeft}>
          <Ionicons name="mail" size={24} color={theme.text} />
          <Text style={[styles.settingText, { color: theme.text }]}>Email</Text>
        </View>
        <Text style={[styles.versionText, { color: theme.textMuted }]}>{authState.user?.email}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card }]}>
        <View style={styles.settingLeft}>
          <Ionicons name="calendar" size={24} color={theme.text} />
          <Text style={[styles.settingText, { color: theme.text }]}>Member Since</Text>
        </View>
        <Text style={[styles.versionText, { color: theme.textMuted }]}>
          {authState.user?.createdAt ? formatJoinDate(authState.user.createdAt) : 'Unknown'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card }]} onPress={handleLogout}>
        <View style={styles.settingLeft}>
          <Ionicons name="log-out" size={24} color={theme.primary} />
          <Text style={[styles.settingText, { color: theme.primary }]}>Sign Out</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderAboutSection = () => (
    <View style={[styles.section, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
      
      <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card }]} onPress={openGitHub}>
        <View style={styles.settingLeft}>
          <Ionicons name="information-circle" size={24} color={theme.text} />
          <Text style={[styles.settingText, { color: theme.text }]}>About TMDB API</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card }]}>
        <View style={styles.settingLeft}>
          <Ionicons name="code" size={24} color={theme.text} />
          <Text style={[styles.settingText, { color: theme.text }]}>Version</Text>
        </View>
        <Text style={[styles.versionText, { color: theme.textMuted }]}>1.0.0</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDangerSection = () => (
    <View style={[styles.section, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Danger Zone</Text>
      
      <TouchableOpacity style={[styles.dangerItem, { backgroundColor: theme.card }]} onPress={clearAllData}>
        <View style={styles.settingLeft}>
          <Ionicons name="trash" size={24} color={theme.primary} />
          <Text style={[styles.settingText, { color: theme.primary }]}>Clear All Data</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="person" size={64} color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {authState.user?.name ? getInitials(authState.user.name) : 'U'}
          </Text>
        </View>
        <Text style={[styles.username, { color: theme.text }]}>{authState.user?.name || 'User'}</Text>
        <Text style={[styles.userSubtitle, { color: theme.textMuted }]}>Welcome to MovieFlix</Text>
      </View>

      {renderStatsCard()}
      {renderSettingsSection()}
      {renderAccountSection()}
      {renderAboutSection()}
      {renderDangerSection()}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Powered by The Movie Database (TMDB)
        </Text>
      </View>
    </ScrollView>
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
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    overflow: 'scroll',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  versionText: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  themeOption: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
}); 