import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../stores/authStore';

const PB_URL = 'https://hippocampal-louie-unevaporated.ngrok-free.dev';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null); // 'checking' | 'online' | 'offline'

  const { login, signup } = useAuthStore();

  const testConnection = async () => {
    setServerStatus('checking');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${PB_URL}/api/health`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        setServerStatus('online');
      } else {
        const text = await response.text();
        setServerStatus('offline');
        Alert.alert('Server Error', `Status ${response.status}: ${text.substring(0, 200)}`);
      }
    } catch (error) {
      setServerStatus('offline');
      Alert.alert('Connection Failed', `Could not reach server:\n${error.message}\n\nURL: ${PB_URL}`);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const result = isLogin
        ? await login(email, password)
        : await signup(email, password, name);

      if (!result.success) {
        Alert.alert('Login Failed', result.error || 'Something went wrong. Check your connection.');
      }
    } catch (error) {
      Alert.alert('Connection Error', `${error.message}\n\nMake sure you have internet access and the server is reachable.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={styles.inner}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Family Memory Log</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Welcome back' : 'Create your account'}
        </Text>

        <TouchableOpacity onPress={testConnection} style={styles.statusBar}>
          {serverStatus === 'checking' ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: serverStatus === 'online' ? '#34C759' : serverStatus === 'offline' ? '#FF3B30' : '#999' }]} />
          )}
          <Text style={styles.statusText}>
            {serverStatus === 'checking' ? 'Testing connection...' : serverStatus === 'online' ? 'Server online' : serverStatus === 'offline' ? 'Server offline — tap to retry' : 'Tap to test server connection'}
          </Text>
        </TouchableOpacity>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Log In' : 'Sign Up'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Log In'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inner: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#555',
  },
});
