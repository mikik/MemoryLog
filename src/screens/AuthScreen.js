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
  const [fieldErrors, setFieldErrors] = useState({});

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
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (!isLogin && password.length < 8) {
      errors.password = 'At least 8 characters';
    }
    if (!isLogin && !name.trim()) {
      errors.name = 'Name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const result = isLogin
        ? await login(email, password)
        : await signup(email, password, name);

      if (!result.success) {
        const errMsg = result.error || '';
        // Try to map server errors to specific fields
        if (errMsg.toLowerCase().includes('email')) {
          setFieldErrors({ email: errMsg });
        } else if (errMsg.toLowerCase().includes('password')) {
          setFieldErrors({ password: errMsg });
        } else {
          Alert.alert('Error', errMsg || 'Something went wrong. Check your connection.');
        }
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
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, fieldErrors.name && styles.fieldLabelError]}>Name</Text>
            <TextInput
              style={[styles.input, fieldErrors.name && styles.inputError]}
              placeholder="Your Name"
              value={name}
              onChangeText={(v) => { setName(v); setFieldErrors((e) => ({ ...e, name: undefined })); }}
              autoCapitalize="words"
            />
            {fieldErrors.name && <Text style={styles.fieldErrorText}>{fieldErrors.name}</Text>}
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, fieldErrors.email && styles.fieldLabelError]}>Email</Text>
          <TextInput
            style={[styles.input, fieldErrors.email && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={(v) => { setEmail(v); setFieldErrors((e) => ({ ...e, email: undefined })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {fieldErrors.email && <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, fieldErrors.password && styles.fieldLabelError]}>Password</Text>
          <TextInput
            style={[styles.input, fieldErrors.password && styles.inputError]}
            placeholder="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); setFieldErrors((e) => ({ ...e, password: undefined })); }}
            secureTextEntry
            autoCapitalize="none"
          />
          {fieldErrors.password ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
          ) : (
            !isLogin && (
              <Text style={[styles.fieldHint, password.length > 0 && password.length < 8 && styles.fieldHintError]}>
                At least 8 characters
              </Text>
            )
          )}
        </View>

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
          onPress={() => { setIsLogin(!isLogin); setFieldErrors({}); }}
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
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  fieldLabelError: {
    color: '#ff3b30',
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
  },
  fieldHintError: {
    color: '#ff3b30',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputError: {
    borderColor: '#ff3b30',
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
