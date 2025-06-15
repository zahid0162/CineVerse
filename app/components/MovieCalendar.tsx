import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useCalendar } from '../contexts/CalendarContext';
import { useTheme } from '../contexts/ThemeContext';
import { movieApi } from '../services/movieApi';
import LoadingSpinner from './LoadingSpinner';

interface MovieEvent {
  id: number;
  title: string;
  releaseDate: string;
  posterPath: string | null;
}

export default function MovieCalendar() {
  const { isCalendarVisible, hideCalendar } = useCalendar();
  const [upcomingMovies, setUpcomingMovies] = useState<MovieEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [filteredMovies, setFilteredMovies] = useState<MovieEvent[]>([]);
  const { themeState } = useTheme();
  const { theme } = themeState;

  // Fetch upcoming movies when calendar becomes visible
  useEffect(() => {
    if (isCalendarVisible) {
      fetchUpcomingMovies();
    }
  }, [isCalendarVisible]);

  // Filter movies when a date is selected
  useEffect(() => {
    if (selectedDate) {
      const moviesOnSelectedDate = upcomingMovies.filter(
        movie => movie.releaseDate === selectedDate
      );
      setFilteredMovies(moviesOnSelectedDate);
    } else {
      setFilteredMovies(upcomingMovies);
    }
  }, [selectedDate, upcomingMovies]);

  const fetchUpcomingMovies = async () => {
    try {
      setLoading(true);
      const response = await movieApi.getUpcomingMovies(1);
      
      // Transform movie data into our MovieEvent format
      const events: MovieEvent[] = response.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        releaseDate: movie.release_date,
        posterPath: movie.poster_path,
      }));
      
      setUpcomingMovies(events);
      setFilteredMovies(events);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching upcoming movies for calendar:', error);
      setLoading(false);
    }
  };

  const handleDayPress = (day: DateData) => {
    if (selectedDate === day.dateString) {
      // If tapping the already selected date, clear selection
      setSelectedDate('');
    } else {
      setSelectedDate(day.dateString);
    }
  };

  // Generate marked dates for the calendar
  const getMarkedDates = () => {
    const markedDates: any = {};
    
    upcomingMovies.forEach(movie => {
      const isSelected = movie.releaseDate === selectedDate;
      
      markedDates[movie.releaseDate] = {
        marked: true,
        dotColor: '#FF6B6B',
        selected: isSelected,
        selectedColor: '#FF6B6B',
      };
    });
    
    // If a date is selected but has no movies, still mark it as selected
    if (selectedDate && !markedDates[selectedDate]) {
      markedDates[selectedDate] = {
        selected: true,
        selectedColor: '#FF6B6B',
      };
    }
    
    return markedDates;
  };

  const renderEventList = () => {
    if (loading) {
      return <LoadingSpinner text="Loading movies..." />;
    }

    if (filteredMovies.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {selectedDate 
              ? `No movies releasing on ${selectedDate}` 
              : 'No upcoming movies found'}
          </Text>
        </View>
      );
    }

    return filteredMovies.map(movie => (
      <View key={movie.id} style={styles.eventItem}>
        <View style={styles.eventRow}>
          {movie.posterPath && (
            <Image 
              source={{ uri: movieApi.getPosterUrl(movie.posterPath, 'w92') }} 
              style={styles.poster} 
            />
          )}
          <View style={styles.eventDetails}>
            <Text style={[styles.eventTitle, { color: theme.text }]}>{movie.title}</Text>
            <Text style={[styles.eventDate, { color: theme.text }]}>Release date: {movie.releaseDate}</Text>
          </View>
        </View>
      </View>
    ));
  };

  return (
    <Modal
      visible={isCalendarVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={hideCalendar}
    >
      <BlurView intensity={90} style={styles.blurContainer}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Upcoming Movies</Text>
            <TouchableOpacity onPress={hideCalendar} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Calendar
            markedDates={getMarkedDates()}
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: theme.surface,
              calendarBackground: theme.surface,
              textSectionTitleColor: theme.textSecondary,
              selectedDayBackgroundColor: '#FF6B6B',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#FF6B6B',
              dayTextColor: theme.text,
              textDisabledColor: theme.textMuted,
              dotColor: '#FF6B6B',
              selectedDotColor: '#ffffff',
              arrowColor: '#FF6B6B',
              monthTextColor: theme.text,
              indicatorColor: '#FF6B6B',
            }}
          />

          <View style={styles.eventsContainer}>
            <Text style={[styles.upcomingTitle, { color: theme.text }]}>
              {selectedDate ? `Movies releasing on ${selectedDate}` : 'All Upcoming Releases'}
            </Text>
            <ScrollView style={styles.eventsList}>
              {renderEventList()}
            </ScrollView>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginHorizontal: 10,
    borderRadius: 20,
    flex: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  eventsContainer: {
    flex: 1,
    padding: 20,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: 'rgba(150,150,150,0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poster: {
    width: 50,
    height: 75,
    borderRadius: 5,
    marginRight: 10,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 