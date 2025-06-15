import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Alert } from 'react-native';
import { AuthContextType, AuthState, LoginCredentials, RegisterCredentials, User } from '../types/auth';

// Mock API simulation with AsyncStorage
const AUTH_STORAGE_KEY = 'auth_user';
const USERS_STORAGE_KEY = 'registered_users';

// Auth reducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  console.log('Auth Reducer - Action:', action.type, 'Current State:', {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    userEmail: state.user?.email || 'No user'
  });

  switch (action.type) {
    case 'SET_LOADING':
      console.log('Auth Reducer - Setting loading to:', action.payload);
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      console.log('Auth Reducer - Login success for user:', action.payload.email);
      const newState = {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
      };
      console.log('Auth Reducer - New state after login:', {
        isAuthenticated: newState.isAuthenticated,
        isLoading: newState.isLoading,
        userEmail: newState.user?.email
      });
      return newState;
    case 'LOGOUT':
      console.log('Auth Reducer - Logging out');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
      };
    case 'UPDATE_USER':
      console.log('Auth Reducer - Updating user');
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth session on app start
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Create demo user if no users exist
      await createDemoUserIfNeeded();
      // Then check for existing session
      await checkAuthSession();
    } catch (error) {
      console.error('Error initializing app:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createDemoUserIfNeeded = async () => {
    try {
      const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = usersData ? JSON.parse(usersData) : [];
      
      // Check if demo user already exists
      const demoUser = users.find((u: User) => u.email === 'demo@movieflix.com');
      
      if (!demoUser) {
        console.log('Creating demo user...');
        const newDemoUser: User = {
          id: 'demo-user-' + Date.now().toString(),
          email: 'demo@movieflix.com',
          name: 'Demo User',
          createdAt: new Date().toISOString(),
          preferences: {
            notifications: true,
            darkMode: true,
            language: 'en',
          },
        };

        // Add demo user to users list
        users.push(newDemoUser);
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        
        // Store demo password
        await AsyncStorage.setItem(`password_${newDemoUser.id}`, 'demo123');
        
        console.log('Demo user created:', newDemoUser.email);
      } else {
        console.log('Demo user already exists');
      }
    } catch (error) {
      console.error('Error creating demo user:', error);
    }
  };

  const checkAuthSession = async () => {
    try {
      console.log('Checking auth session...');
      const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        console.log('Found existing user session:', user.email);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        console.log('No existing session found');
      }
    } catch (error) {
      console.error('Error checking auth session:', error);
    } finally {
      console.log('Auth session check complete');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('Starting login process for:', credentials.email);
      dispatch({ type: 'SET_LOADING', payload: true });

      // Get registered users
      const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = usersData ? JSON.parse(usersData) : [];
      console.log('Found users:', users.length);

      // Find user by email
      const user = users.find((u: User) => u.email.toLowerCase() === credentials.email.toLowerCase());

      if (!user) {
        console.log('User not found');
        throw new Error('User not found. Please register first.');
      }

      console.log('User found:', user.email);

      // In a real app, you'd verify the password hash
      // For demo purposes, we'll just check if password matches stored password
      const storedPassword = await AsyncStorage.getItem(`password_${user.id}`);
      console.log('Stored password exists:', !!storedPassword);
      
      if (storedPassword !== credentials.password) {
        console.log('Password mismatch');
        throw new Error('Invalid password');
      }

      console.log('Password matches, logging in user');

      // Store auth session
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      console.log('Auth session stored, dispatching LOGIN_SUCCESS');
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      console.log('LOGIN_SUCCESS dispatched');

    } catch (error) {
      console.log('Login error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Validate inputs
      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Get existing users
      const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = usersData ? JSON.parse(usersData) : [];

      // Check if email already exists
      const existingUser = users.find((u: User) => u.email.toLowerCase() === credentials.email.toLowerCase());
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email: credentials.email.toLowerCase(),
        name: credentials.name,
        createdAt: new Date().toISOString(),
        preferences: {
          notifications: true,
          darkMode: true,
          language: 'en',
        },
      };

      // Store user data
      users.push(newUser);
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      
      // Store password separately (in real app, this would be hashed)
      await AsyncStorage.setItem(`password_${newUser.id}`, credentials.password);

      // Store auth session
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      dispatch({ type: 'LOGIN_SUCCESS', payload: newUser });

    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('Auth session removed from storage');
      dispatch({ type: 'LOGOUT' });
      console.log('LOGOUT action dispatched');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!authState.user) return;

      const updatedUser = { ...authState.user, ...userData };
      
      // Update in storage
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      
      // Update in users list
      const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = usersData ? JSON.parse(usersData) : [];
      const userIndex = users.findIndex((u: User) => u.id === authState.user!.id);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }

      dispatch({ type: 'UPDATE_USER', payload: userData });
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const value: AuthContextType = {
    authState,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 