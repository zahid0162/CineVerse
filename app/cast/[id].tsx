import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { movieApi } from '../services/movieApi';
import { PersonDetails, PersonMovieCredit, PersonMovieCredits } from '../types/movie';

const { width, height } = Dimensions.get('window');

export default function CastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { themeState } = useTheme();
  const { theme } = themeState;
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [credits, setCredits] = useState<PersonMovieCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'cast' | 'crew'>('cast');

  useEffect(() => {
    if (id) {
      loadPersonData();
    }
  }, [id]);

  const loadPersonData = async () => {
    try {
      setLoading(true);
      const personId = parseInt(id!);
      
      const [personData, creditsData] = await Promise.all([
        movieApi.getPersonDetails(personId),
        movieApi.getPersonMovieCredits(personId),
      ]);

      setPerson(personData);
      setCredits(creditsData);
    } catch (error) {
      console.error('Error loading person data:', error);
      Alert.alert('Error', 'Failed to load person details');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthday: string | null, deathday: string | null): string => {
    if (!birthday) return 'Unknown';
    
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    
    if (deathday) {
      return `${age} (deceased)`;
    }
    return `${age} years old`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTopMovies = (movieCredits: PersonMovieCredit[]): PersonMovieCredit[] => {
    return movieCredits
      .filter(movie => movie.poster_path && movie.release_date)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);
  };

  const renderMovieItem = ({ item }: { item: PersonMovieCredit }) => (
    <TouchableOpacity
      style={[styles.creditCard, { backgroundColor: theme.card }]}
      onPress={() => router.push(`/movie/${item.id}`)}
    >
      <Image
        source={{
          uri: movieApi.getPosterUrl(item.poster_path, 'w185'),
        }}
        style={styles.creditPoster}
        contentFit="cover"
        placeholder={require('../../assets/images/icon.png')}
      />
      <View style={styles.creditInfo}>
        <Text style={[styles.creditTitle, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.creditYear, { color: theme.textTertiary }]}>
          {item.release_date ? new Date(item.release_date).getFullYear() : 'TBA'}
        </Text>
        {item.character && (
          <Text style={[styles.creditCharacter, { color: theme.primary }]} numberOfLines={1}>
            as {item.character}
          </Text>
        )}
        {item.job && (
          <Text style={[styles.creditJob, { color: theme.primary }]} numberOfLines={1}>
            {item.job}
          </Text>
        )}
        <View style={styles.creditRating}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={[styles.ratingText, { color: theme.text }]}>{item.vote_average.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTabButton = (tab: 'cast' | 'crew', label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tab && { backgroundColor: theme.primary },
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[
        styles.tabText,
        { color: theme.textTertiary },
        selectedTab === tab && { color: '#fff', fontWeight: '600' },
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner text="Loading person details..." />;
  }

  if (!person) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle" size={64} color={theme.primary} />
        <Text style={[styles.errorText, { color: theme.text }]}>Person not found</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentCredits = selectedTab === 'cast' ? credits?.cast || [] : credits?.crew || [];
  const topMovies = getTopMovies(currentCredits);

  return (
    <>
      <Stack.Screen
        options={{
          title: person.name,
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
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerContainer}>
          <Image
            source={{
              uri: movieApi.getProfileUrl(person.profile_path, 'h632'),
            }}
            style={styles.profileImage}
            contentFit="cover"
            placeholder={require('../../assets/images/icon.png')}
          />
          <LinearGradient
            colors={themeState.isDark ? ['transparent', 'rgba(0,0,0,0.8)', '#000'] as const : theme.gradient as any}
            style={styles.gradient}
          />
        </View>

        {/* Person Info */}
        <View style={styles.contentContainer}>
          <View style={styles.personHeader}>
            <Image
              source={{
                uri: movieApi.getProfileUrl(person.profile_path, 'w185'),
              }}
              style={[styles.avatar, { borderColor: theme.text }]}
              contentFit="cover"
              placeholder={require('../../assets/images/icon.png')}
            />
            
            <View style={styles.personInfo}>
              <Text style={[styles.name, { color: theme.text }]}>{person.name}</Text>
              <Text style={[styles.department, { color: theme.primary }]}>{person.known_for_department}</Text>
              
              <View style={styles.personalInfo}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>Age:</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {calculateAge(person.birthday, person.deathday)}
                  </Text>
                </View>
                
                {person.birthday && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>Born:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{formatDate(person.birthday)}</Text>
                  </View>
                )}
                
                {person.place_of_birth && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>Birthplace:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
                      {person.place_of_birth}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Biography */}
          {person.biography && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Biography</Text>
              <Text style={[styles.biography, { color: theme.textSecondary }]}>{person.biography}</Text>
            </View>
          )}

          {/* Also Known As */}
          {person.also_known_as.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Also Known As</Text>
              <View style={styles.aliasContainer}>
                {person.also_known_as.slice(0, 5).map((alias, index) => (
                  <View key={index} style={[styles.aliasTag, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.aliasText, { color: theme.textSecondary }]}>{alias}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Credits Tabs */}
          {credits && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Known For</Text>
              
              <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
                {renderTabButton('cast', 'Acting', credits.cast.length)}
                {renderTabButton('crew', 'Crew', credits.crew.length)}
              </View>

              <FlatList
                data={topMovies}
                renderItem={renderMovieItem}
                keyExtractor={(item) => `${selectedTab}-${item.credit_id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.creditsList}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'relative',
    height: height * 0.4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -80,
  },
  personHeader: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 3,
  },
  personInfo: {
    flex: 1,
    paddingBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  department: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  personalInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  biography: {
    fontSize: 16,
    lineHeight: 24,
  },
  aliasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aliasTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  aliasText: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  creditsList: {
    paddingRight: 16,
  },
  creditCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  creditPoster: {
    width: '100%',
    height: 180,
  },
  creditInfo: {
    padding: 8,
  },
  creditTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  creditYear: {
    fontSize: 12,
    marginBottom: 4,
  },
  creditCharacter: {
    fontSize: 12,
    marginBottom: 4,
  },
  creditJob: {
    fontSize: 12,
    marginBottom: 4,
  },
  creditRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    marginLeft: 2,
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
}); 