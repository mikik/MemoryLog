import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import pb from '../services/pocketbase';
import useAuthStore from '../stores/authStore';

const { width } = Dimensions.get('window');
const IMAGE_MARGIN = 12;
const IMAGE_WIDTH = width - IMAGE_MARGIN * 2;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.75;

// Detect if text starts with RTL characters (Hebrew, Arabic)
const isRTL = (text) => /^[\u0590-\u05FF\u0600-\u06FF\uFE70-\uFEFF]/.test(text?.trim());

export default function MemoryCard({ memory, onRefresh }) {
  const { user } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const mediaFiles = memory.media || [];
  const isMultipleImages = mediaFiles.length > 1;
  const isAuthor = memory.author === user?.id || memory.expand?.author?.id === user?.id;

  const handleDelete = () => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await pb.deleteMemory(memory.id);
              if (onRefresh) onRefresh();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete memory');
            }
          },
        },
      ]
    );
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderImage = () => {
    if (mediaFiles.length === 0) return null;

    return (
      <View style={styles.imageContainer}>
        <FlatList
          data={mediaFiles}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item, index) => `${memory.id}-${index}`}
          renderItem={({ item }) => (
            <Image
              source={{ uri: pb.getFileUrl(memory, item) }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
        />

        {isMultipleImages && (
          <View style={styles.dotsContainer}>
            {mediaFiles.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImageIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const author = memory.expand?.author;
  const authorName = author?.name || author?.email?.split('@')[0] || 'Unknown';
  const timestamp = format(new Date(memory.created), 'MMM d, yyyy');

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {authorName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
        </View>

        {isAuthor && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      {memory.title && (
        <Text style={[styles.title, isRTL(memory.title) && styles.rtlText]}>
          {memory.title}
        </Text>
      )}

      {/* Images */}
      {renderImage()}

      {/* Description */}
      {memory.description && (
        <Text style={[styles.description, isRTL(memory.description) && styles.rtlText]}>
          {memory.description}
        </Text>
      )}

      {/* Location */}
      {memory.location_name && (
        <View style={styles.location}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText}>{memory.location_name}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    writingDirection: 'auto',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    writingDirection: 'auto',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 12,
    marginBottom: 8,
    writingDirection: 'auto',
    textAlign: 'auto',
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#f0f0f0',
    position: 'relative',
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    padding: 12,
    writingDirection: 'auto',
    textAlign: 'auto',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
