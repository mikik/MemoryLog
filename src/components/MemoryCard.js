import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import pb from '../services/pocketbase';
import useAuthStore from '../stores/authStore';

const { width } = Dimensions.get('window');
const IMAGE_MARGIN = 12;
const IMAGE_WIDTH = width - IMAGE_MARGIN * 2;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.75;
const MAX_VISIBLE_COMMENTS = 3;

// Detect if text starts with RTL characters (Hebrew, Arabic)
const isRTL = (text) => /^[\u0590-\u05FF\u0600-\u06FF\uFE70-\uFEFF]/.test(text?.trim());

export default function MemoryCard({ memory, onRefresh }) {
  const { user } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mediaFiles = memory.media || [];
  const isMultipleImages = mediaFiles.length > 1;
  const isAuthor = memory.author === user?.id || memory.expand?.author?.id === user?.id;

  useEffect(() => {
    loadComments();
  }, [memory.id]);

  const loadComments = async () => {
    try {
      const records = await pb.getComments(memory.id);
      setComments(records);
    } catch (error) {
      // Silently fail — comments are non-critical
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      await pb.createComment(memory.id, commentText.trim());
      setCommentText('');
      await loadComments();
      setShowCommentInput(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

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

  const getCommentAuthorName = (comment) => {
    const a = comment.expand?.author;
    return a?.name || a?.email?.split('@')[0] || 'Unknown';
  };

  const visibleComments = showAllComments ? comments : comments.slice(0, MAX_VISIBLE_COMMENTS);

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

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.commentIconButton}
            onPress={() => setShowCommentInput(!showCommentInput)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
            {comments.length > 0 && (
              <Text style={styles.commentCount}>{comments.length}</Text>
            )}
          </TouchableOpacity>

          {isAuthor && (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Title */}
      {memory.title && (
        <Text style={[styles.title, isRTL(memory.title) && styles.rtlText]}>
          {memory.title}
        </Text>
      )}

      {/* Comment input — below title so keyboard doesn't hide it */}
      {showCommentInput && (
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            maxLength={500}
            autoFocus
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
          >
            <Ionicons
              name="send"
              size={20}
              color={commentText.trim() && !submitting ? '#007AFF' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
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

      {/* Comments list — always visible */}
      {comments.length > 0 && (
        <View style={styles.commentsSection}>
          {visibleComments.map((comment) => {
            const name = getCommentAuthorName(comment);
            return (
              <View key={comment.id} style={styles.commentRow}>
                <Text style={styles.commentAuthor}>@{name}</Text>
                <Text style={styles.commentBody}>{comment.text}</Text>
              </View>
            );
          })}

          {!showAllComments && comments.length > MAX_VISIBLE_COMMENTS && (
            <TouchableOpacity onPress={() => setShowAllComments(true)}>
              <Text style={styles.viewAllComments}>
                View all {comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
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
    textAlign: 'right',
    writingDirection: 'rtl',
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
    textAlign: 'right',
    writingDirection: 'rtl',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commentIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  commentsSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  commentRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    lineHeight: 20,
  },
  commentBody: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flexShrink: 1,
  },
  viewAllComments: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    marginBottom: 8,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginRight: 8,
  },
});
