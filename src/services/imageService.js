import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

class ImageService {
  // Request permissions
  async requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  // Pick multiple images from gallery
  async pickImages(maxImages = 10) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Permission to access media library was denied');
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: maxImages,
        quality: 1, // We'll compress later
        exif: true, // Include EXIF data for date/location
      });

      if (result.canceled) {
        return [];
      }

      return result.assets;
    } catch (error) {
      console.error('Error picking images:', error);
      throw error;
    }
  }

  // Compress image to ~1-2MB
  async compressImage(uri, targetSizeKB = 1500) {
    try {
      // First, resize to reasonable dimensions
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 2048, // Max width - maintains aspect ratio
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipResult;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }

  // Create thumbnail for feed
  async createThumbnail(uri) {
    try {
      const thumbnail = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 800, // Smaller for feed
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return thumbnail;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw error;
    }
  }

  // Parse EXIF date string (format: "2024:01:15 14:30:00") to ISO string
  parseExifDate(dateStr) {
    if (!dateStr) return null;
    try {
      // EXIF dates use "YYYY:MM:DD HH:MM:SS" — replace first two colons with dashes
      const normalized = dateStr.replace(/^(\d{4}):(\d{2}):/, '$1-$2-');
      const date = new Date(normalized);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  }

  // Extract EXIF data for date and location
  extractMetadata(asset) {
    const metadata = {
      eventDate: null,
      locationLat: null,
      locationLng: null,
    };

    // Date from EXIF or fallback to creation time
    metadata.eventDate =
      this.parseExifDate(asset.exif?.DateTimeOriginal) ||
      this.parseExifDate(asset.exif?.DateTime) ||
      new Date().toISOString();

    // GPS location from EXIF
    if (asset.exif?.GPSLatitude && asset.exif?.GPSLongitude) {
      metadata.locationLat = this.parseGPSCoordinate(
        asset.exif.GPSLatitude,
        asset.exif.GPSLatitudeRef
      );
      metadata.locationLng = this.parseGPSCoordinate(
        asset.exif.GPSLongitude,
        asset.exif.GPSLongitudeRef
      );
    }

    return metadata;
  }

  // Parse GPS coordinate from EXIF format
  parseGPSCoordinate(coordinate, ref) {
    if (!coordinate) return null;
    
    // EXIF GPS is in [degrees, minutes, seconds] format
    if (Array.isArray(coordinate)) {
      const [degrees, minutes, seconds] = coordinate;
      let decimal = degrees + minutes / 60 + seconds / 3600;
      
      // Apply hemisphere (S/W are negative)
      if (ref === 'S' || ref === 'W') {
        decimal = -decimal;
      }
      
      return decimal;
    }
    
    return coordinate; // Already decimal
  }

  // Batch compress images
  async compressImages(assets) {
    const compressed = [];
    
    for (const asset of assets) {
      const compressedImage = await this.compressImage(asset.uri);
      const metadata = this.extractMetadata(asset);
      
      compressed.push({
        uri: compressedImage.uri,
        width: compressedImage.width,
        height: compressedImage.height,
        ...metadata,
      });
    }
    
    return compressed;
  }
}

export default new ImageService();
