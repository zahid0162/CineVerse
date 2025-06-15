import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const checkUsers = async () => {
    try {
      const usersData = await AsyncStorage.getItem('registered_users');
      const users = usersData ? JSON.parse(usersData) : [];
      console.log('All registered users:', users);
      Alert.alert('Debug', `Found ${users.length} users: ${users.map((u: any) => u.email).join(', ')}`);
    } catch (error) {
      console.error('Error checking users:', error);
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      console.log('Login Screen - Starting login attempt');
      await login({ email, password });
      console.log('Login Screen - Login successful, should navigate now');
      // Force navigation after successful login
      router.replace('/(tabs)/home');
    } catch (error) {
      console.log('Login Screen - Login failed:', error);
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#000', '#1a1a1a', '#000']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="film" size={64} color="#e50914" />
            <Text style={styles.title}>MovieFlix</Text>
            <Text style={styles.subtitle}>Welcome Back</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

          
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <Text style={styles.featuresTitle}>What you'll get:</Text>
            <View style={styles.featureItem}>
              <Ionicons name="bookmark" size={16} color="#e50914" />
              <Text style={styles.featureText}>Personal Watchlist</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="star" size={16} color="#e50914" />
              <Text style={styles.featureText}>Movie Ratings & Reviews</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="settings" size={16} color="#e50914" />
              <Text style={styles.featureText}>Personalized Settings</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 16,
    paddingRight: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  loginButton: {
    backgroundColor: '#e50914',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e50914',
  },
  demoButtonText: {
    color: '#e50914',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
    marginTop: 8,
  },
  debugButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    color: '#ccc',
    fontSize: 14,
  },
  linkText: {
    color: '#e50914',
    fontSize: 14,
    fontWeight: '600',
  },
  features: {
    alignItems: 'center',
  },
  featuresTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
  },
}); 