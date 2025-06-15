import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useCalendar } from '../contexts/CalendarContext';
import { useTheme } from '../contexts/ThemeContext';

interface CalendarButtonProps {
  size?: number;
  style?: any;
}

export default function CalendarButton({ size = 24, style }: CalendarButtonProps) {
  const { showCalendar } = useCalendar();
  const { themeState } = useTheme();
  const { theme } = themeState;

  return (
    <TouchableOpacity
      onPress={showCalendar}
      style={[styles.button, { backgroundColor: theme.background }, style]}
    >
      <MaterialIcons name="event" size={size} color={theme.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 