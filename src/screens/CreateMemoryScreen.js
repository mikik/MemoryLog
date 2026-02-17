import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../stores/authStore';
import imageService from '../services/imageService';
import pb from '../services/pocketbase';

export default function CreateMemoryScreen({ navigation }) {
  const { currentLogbook } = useAuthStore();
  const [selectedImages, setSelectedImages] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    try {
      const images = await imageService.pickImages(10);
      if (images.length > 0) {
        setSelectedImages(images);
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

    setLoading(true);

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
        },
        compressed
      );

      Alert.alert('Success', 'Memory created!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating memory:', error);
      Alert.alert('Error', 'Failed to create memory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={styles.inner}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Memory</Text>
        <TouchableOpacity onPress={handlePost} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.postButton}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Selection */}
        <TouchableOpacity style={styles.imageSelector} onPress={pickImages}>
          <Ionicons name="images" size={40} color="#007AFF" />
          <Text style={styles.imageSelectorText}>
            {selectedImages.length === 0
              ? 'Select Photos (up to 10)'
              : `${selectedImages.length} photo${
                  selectedImages.length > 1 ? 's' : ''
                } selected`}
          </Text>
        </TouchableOpacity>

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
                  <Ionicons name="close-circle" size={24} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Title */}
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="Title (optional)"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="What's this memory about?"
          value={description}
          onChangeText={setDescription}
          maxLength={280}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.charCount}>
          {description.length}/280 characters
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Date and location will be automatically extracted from your photos
          </Text>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageSelector: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  imageSelectorText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 12,
    fontWeight: '500',
  },
  imagePreview: {
    marginBottom: 16,
  },
  imagePreviewItem: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  titleInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
});
