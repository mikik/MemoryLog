import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useAuthStore from '../stores/authStore';
import pb from '../services/pocketbase';
import MemoryCard from '../components/MemoryCard';

export default function FeedScreen({ navigation }) {
  const { currentLogbook } = useAuthStore();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reload when screen comes into focus (e.g. after creating a memory)
  useFocusEffect(
    useCallback(() => {
      if (currentLogbook) {
        loadMemories();
      }
    }, [currentLogbook])
  );

  const loadMemories = async (pageNum = 1, append = false) => {
    if (!currentLogbook) return;

    try {
      const result = await pb.getMemories(currentLogbook.id, pageNum, 30);
      
      if (append) {
        setMemories(prev => [...prev, ...result.items]);
      } else {
        setMemories(result.items);
      }
      
      setHasMore(result.items.length === 30);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading memories:', error);
      Alert.alert('Error', 'Failed to load memories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMemories(1, false);
  }, [currentLogbook]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setLoading(true);
      loadMemories(page + 1, true);
    }
  };

  const handleCreatePress = () => {
    if (!currentLogbook) {
      Alert.alert(
        'No LogBook',
        'Please create or join a LogBook first',
        [{ text: 'OK', onPress: () => navigation.navigate('LogBooks') }]
      );
      return;
    }
    navigation.navigate('CreateMemory');
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No memories yet</Text>
      <Text style={styles.emptyText}>
        Tap the + button to create your first memory
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  if (!currentLogbook) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No LogBook Selected</Text>
          <Text style={styles.emptyText}>
            Create or join a LogBook to start sharing memories
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('LogBooks')}
          >
            <Text style={styles.primaryButtonText}>Go to LogBooks</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>MemoryLog</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentLogbook.title}
        </Text>
      </View>

      <FlatList
        data={memories}
        renderItem={({ item }) => (
          <MemoryCard memory={item} onRefresh={onRefresh} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          memories.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={!loading && renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    writingDirection: 'auto',
  },
  list: {
    padding: 0,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
