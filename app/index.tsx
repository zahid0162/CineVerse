import { Redirect, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';

export default function Index() {
  const { authState } = useAuth();
  const router = useRouter();

  console.log('Index - Auth State:', {
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    userEmail: authState.user?.email || 'No user'
  });

  // Use useEffect to handle navigation when auth state changes
  useEffect(() => {
    if (!authState.isLoading) {
      if (authState.isAuthenticated) {
        console.log('Index - useEffect: Navigating to home (authenticated)');
        router.replace('/(tabs)/home');
      } else {
        console.log('Index - useEffect: Navigating to login (not authenticated)');
        router.replace('/(auth)/login');
      }
    }
  }, [authState.isAuthenticated, authState.isLoading, router]);

  if (authState.isLoading) {
    console.log('Index - Showing loading spinner');
    return <LoadingSpinner text="Loading MovieFlix..." />;
  }

  // Fallback redirects (should not be reached due to useEffect)
  if (authState.isAuthenticated) {
    console.log('Index - Fallback: Redirecting to home (authenticated)');
    return <Redirect href="/(tabs)/home" />;
  } else {
    console.log('Index - Fallback: Redirecting to login (not authenticated)');
    return <Redirect href="/(auth)/login" />;
  }
}
