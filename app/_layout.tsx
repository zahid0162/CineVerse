import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { BaseToast, ErrorToast, InfoToast, ToastProps } from 'react-native-toast-message';
import MovieCalendar from './components/MovieCalendar';
import { AuthProvider } from './contexts/AuthContext';
import { CalendarProvider } from './contexts/CalendarContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Define custom toast config with higher z-index
const toastConfig = {
  success: (props: ToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#22c55e',
        backgroundColor: '#1c1c1c',
        zIndex: 9999,
        elevation: 9999,
        width: '90%',
        position: 'absolute',
        top: 0,
        alignSelf: 'center',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}
      text2Style={{ fontSize: 14, color: '#ccc' }}
    />
  ),
  error: (props: ToastProps) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        backgroundColor: '#1c1c1c',
        zIndex: 9999,
        elevation: 9999,
        width: '90%',
        position: 'absolute',
        top: 0,
        alignSelf: 'center',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}
      text2Style={{ fontSize: 14, color: '#ccc' }}
    />
  ),
  info: (props: ToastProps) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#3b82f6',
        backgroundColor: '#1c1c1c',
        zIndex: 9999,
        elevation: 9999,
        width: '90%',
        position: 'absolute',
        top: 0,
        alignSelf: 'center',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}
      text2Style={{ fontSize: 14, color: '#ccc' }}
    />
  ),
};

function AppStack() {
  const { themeState } = useTheme();
  const { theme } = themeState;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="movie/[id]"
        options={{
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="cast/[id]"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="category/[endpoint]"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <CalendarProvider>
            <AppStack />
            <MovieCalendar />
            <Toast config={toastConfig} />
          </CalendarProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

