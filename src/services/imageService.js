import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

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

  // Get device's current location as fallback when EXIF GPS is missing
  async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.log('Could not get device location:', error.message);
      return null;
    }
  }

  // Reverse geocode lat/lng to a human-readable place name
  async reverseGeocode(lat, lng) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (results && results.length > 0) {
        const place = results[0];
        const parts = [place.city, place.region, place.country].filter(Boolean);
        return parts.join(', ') || null;
      }
      return null;
    } catch (error) {
      console.log('Reverse geocoding failed:', error.message);
      return null;
    }
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

    // Find the first image that has GPS data
    const imageWithGPS = compressed.find(img => img.locationLat != null);

    let finalLat = imageWithGPS?.locationLat ?? null;
    let finalLng = imageWithGPS?.locationLng ?? null;

    // If no image has GPS, fall back to device location
    if (finalLat == null) {
      const deviceLocation = await this.getCurrentLocation();
      if (deviceLocation) {
        finalLat = deviceLocation.latitude;
        finalLng = deviceLocation.longitude;
      }
    }

    // Reverse geocode and attach location to first image's metadata
    if (compressed.length > 0 && finalLat != null) {
      compressed[0].locationLat = finalLat;
      compressed[0].locationLng = finalLng;
      compressed[0].locationName = await this.reverseGeocode(finalLat, finalLng);
    }

    return compressed;
  }
}

export default new ImageService();
