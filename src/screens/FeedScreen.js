import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useAuthStore from '../stores/authStore';
import pb from '../services/pocketbase';
import imageService from '../services/imageService';
import MemoryCard from '../components/MemoryCard';
import { getTextAlign } from '../utils/textDirection';

export default function FeedScreen({ navigation }) {
  const { currentLogbook, logbooks, feedMode, setFeedMode, setCurrentLogbook } = useAuthStore();

  // Single-logbook mode state
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // All-logbooks mode state
  const [allLogbooksSections, setAllLogbooksSections] = useState([]);

  // Create Memory modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (feedMode === 'single' && currentLogbook) {
        loadMemories();
      } else if (feedMode === 'all' && logbooks.length > 0) {
        loadAllLogbooks();
      } else {
        setLoading(false);
      }
    }, [feedMode, currentLogbook, logbooks])
  );

  // --- Single logbook mode ---

  const loadMemories = async (pageNum = 1, append = false, logbookId = null) => {
    const targetId = logbookId || currentLogbook?.id;
    if (!targetId) return;

    try {
      const result = await pb.getMemories(targetId, pageNum, 30);

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

  // --- All logbooks mode ---

  const loadAllLogbooks = async () => {
    setLoading(true);
    try {
      const logbookIds = logbooks.map(lb => lb.id);
      const results = await pb.getMemoriesForAllLogbooks(logbookIds, 5);

      const currentId = currentLogbook?.id;
      const sorted = [...results].sort((a, b) => {
        if (a.logbookId === currentId) return -1;
        if (b.logbookId === currentId) return 1;
        return 0;
      });

      const sections = [];
      for (const result of sorted) {
        const logbook = logbooks.find(lb => lb.id === result.logbookId);
        if (logbook && result.items.length > 0) {
          sections.push({
            title: logbook.title,
            logbook,
            totalItems: result.totalItems,
            data: result.items,
          });
        }
      }

      setAllLogbooksSections(sections);
    } catch (error) {
      console.error('Error loading all logbooks:', error);
      Alert.alert('Error', 'Failed to load memories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefreshAll = useCallback(() => {
    setRefreshing(true);
    loadAllLogbooks();
  }, [logbooks]);

  const handleSeeAll = (logbook) => {
    setCurrentLogbook(logbook);
    setFeedMode('single');
    setLoading(true);
    setPage(1);
    setHasMore(true);
    setMemories([]);
    loadMemories(1, false, logbook.id);
  };

  // --- Create Memory ---

  const handleCreatePress = () => {
    if (!currentLogbook) {
      Alert.alert(
        'No LogBook',
        'Please create or join a LogBook first',
        [{ text: 'OK', onPress: () => navigation.navigate('LogBooks') }]
      );
      return;
    }
    setShowCreateModal(true);
  };

  const resetCreateForm = () => {
    setSelectedImages([]);
    setTitle('');
    setDescription('');
    setCreateLoading(false);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const pickImages = async () => {
    const remaining = 10 - selectedImages.length;
    if (remaining <= 0) {
      Alert.alert('Limit Reached', 'You can select up to 10 photos per memory.');
      return;
    }
    try {
      const images = await imageService.pickImages(remaining);
      if (images.length > 0) {
        setSelectedImages(prev => [...prev, ...images].slice(0, 10));
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  const handlePost = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('Error', 'Please select at least one photo');
      return;
    }

    if (!currentLogbook) {
      Alert.alert('Error', 'No LogBook selected');
      return;
    }

    setCreateLoading(true);

    try {
      // Compress images
      const compressed = await imageService.compressImages(selectedImages);

      // Extract metadata from first image
      const metadata = compressed[0] || {};

      // Create memory
      await pb.createMemory(
        currentLogbook.id,
        {
          title: title.trim(),
          description: description.trim(),
          eventDate: metadata.eventDate || new Date().toISOString(),
          locationLat: metadata.locationLat,
          locationLng: metadata.locationLng,
          locationName: metadata.locationName,
        },
        compressed
      );

      // Close modal and reset form
      setShowCreateModal(false);
      resetCreateForm();

      // Refresh feed
      if (feedMode === 'single') {
        loadMemories(1, false);
      } else {
        loadAllLogbooks();
      }

      Alert.alert('Success', 'Memory created!');
    } catch (error) {
      console.error('Error creating memory:', error);
      Alert.alert('Error', 'Failed to create memory. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  // --- Shared ---

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No memories yet</Text>
      <Text style={styles.emptyText}>
        Tap the + button to create your first memory
      </Text>
    </View>
  );

  const renderAllLogbooksEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No memories yet</Text>
      <Text style={styles.emptyText}>
        Create a memory in any of your LogBooks to see it here
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

  // --- Empty state guards ---

  if (feedMode === 'single' && !currentLogbook) {
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

  if (feedMode === 'all' && logbooks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No LogBooks</Text>
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

  // --- Render ---

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>MemoryLog</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        {feedMode === 'all' ? (
          <View style={styles.headerLogbookBadge}>
            <Ionicons name="library" size={14} color="#007AFF" />
            <Text style={styles.headerLogbookBadgeText} numberOfLines={1}>All LogBooks</Text>
          </View>
        ) : (
          <View style={styles.headerLogbookBadge}>
            <Ionicons name="book" size={14} color="#007AFF" />
            <Text style={styles.headerLogbookBadgeText} numberOfLines={1}>
              {currentLogbook?.title}
            </Text>
          </View>
        )}
      </View>

      {feedMode === 'single' ? (
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
      ) : (
        <SectionList
          sections={allLogbooksSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemoryCard memory={item} onRefresh={onRefreshAll} />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={12} color="#007AFF" />
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
            </View>
          )}
          renderSectionFooter={({ section }) =>
            section.totalItems > 5 ? (
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => handleSeeAll(section.logbook)}
              >
                <Text style={styles.seeAllText}>
                  See All {section.title} ({section.totalItems})
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading && renderAllLogbooksEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefreshAll} />
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={
            allLogbooksSections.length === 0 ? styles.emptyList : styles.list
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Create Memory Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={closeCreateModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.createModalContent}>
              {/* Logbook Badge */}
              {currentLogbook && (
                <View style={styles.createLogbookBadge}>
                  <Ionicons name="book" size={14} color="#007AFF" />
                  <Text style={styles.createLogbookBadgeText} numberOfLines={1}>
                    {currentLogbook.title}
                  </Text>
                </View>
              )}

              {/* Header */}
              <View style={styles.createHeader}>
                <TouchableOpacity onPress={closeCreateModal}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.createHeaderTitle}>New Memory</Text>
                <TouchableOpacity onPress={handlePost} disabled={createLoading}>
                  {createLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Text style={styles.createPostButton}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Scrollable Form */}
              <ScrollView style={styles.createForm} keyboardShouldPersistTaps="handled">
                {/* Title */}
                <Text style={styles.createFieldLabel}>Title</Text>
                <TextInput
                  style={[styles.createTitleInput, { textAlign: getTextAlign(title) }]}
                  placeholder="Title (optional)"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />

                {/* Description */}
                <Text style={styles.createFieldLabel}>Description</Text>
                <TextInput
                  style={[styles.createDescriptionInput, { textAlign: getTextAlign(description) }]}
                  placeholder="What's this memory about?"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={280}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.charCount}>
                  {description.length}/280 characters
                </Text>

                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imagePreview}
                  >
                    {selectedImages.map((image, index) => (
                      <View key={index} style={styles.imagePreviewItem}>
                        <Image
                          source={{ uri: image.uri }}
                          style={styles.previewImage}
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={22} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Image Selection */}
                <TouchableOpacity style={styles.imageSelector} onPress={pickImages}>
                  <Ionicons name="images" size={20} color="#007AFF" />
                  <Text style={styles.imageSelectorText}>
                    {selectedImages.length === 0
                      ? 'Select Photos (up to 10)'
                      : `Add more photos (${selectedImages.length}/10)`}
                  </Text>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#666" />
                  <Text style={styles.infoText}>
                    Date and location will be automatically extracted from your photos
                  </Text>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingTop: 4,
    paddingBottom: 6,
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
  headerLogbookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    gap: 6,
  },
  headerLogbookBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 6,
    paddingVertical: 2,
    paddingHorizontal: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 4,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    lineHeight: 13,
    includeFontPadding: false,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
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

  // --- Create Memory Modal styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  createLogbookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    gap: 6,
    marginTop: 16,
    marginBottom: 4,
  },
  createLogbookBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  createHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  createHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  createPostButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  createForm: {
    padding: 16,
  },
  imageSelector: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    marginBottom: 12,
    gap: 8,
  },
  imageSelectorText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  imagePreview: {
    marginBottom: 12,
  },
  imagePreviewItem: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 11,
  },
  createFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  createTitleInput: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  createDescriptionInput: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    minHeight: 80,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginBottom: 10,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    lineHeight: 18,
  },
});
