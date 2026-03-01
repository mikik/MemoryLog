import PocketBase from 'pocketbase';
import * as SecureStore from 'expo-secure-store';

const PB_URL = 'https://memorylog.eastus.cloudapp.azure.com';

class PocketBaseService {
  constructor() {
    this.client = new PocketBase(PB_URL);
    this.client.autoCancellation(false);
  }

  // Authentication
  async login(email, password) {
    try {
      const authData = await this.client.collection('users').authWithPassword(email, password);
      await this.saveAuthToken(authData.token);
      return authData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(email, password, name) {
    try {
      const user = await this.client.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
      });
      
      // Auto-login after signup
      const authData = await this.login(email, password);
      return authData;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async logout() {
    this.client.authStore.clear();
    await SecureStore.deleteItemAsync('pocketbase_token');
  }

  async tryAutoLogin() {
    try {
      const token = await SecureStore.getItemAsync('pocketbase_token');
      if (token) {
        this.client.authStore.save(token);
        // Verify token is still valid
        await this.client.collection('users').authRefresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auto-login failed:', error);
      this.client.authStore.clear();
      await SecureStore.deleteItemAsync('pocketbase_token');
      return false;
    }
  }

  async saveAuthToken(token) {
    await SecureStore.setItemAsync('pocketbase_token', token);
  }

  getCurrentUser() {
    return this.client.authStore.model;
  }

  isAuthenticated() {
    return this.client.authStore.isValid;
  }

  // LogBooks
  async getLogBooks() {
    try {
      const userId = this.getCurrentUser().id;
      const records = await this.client.collection('logbooks').getFullList({
        filter: this.client.filter('members.id ?= {:userId}', { userId }),
        sort: '-created',
        expand: 'members,admins',
      });
      return records;
    } catch (error) {
      console.error('Error fetching logbooks:', error);
      throw error;
    }
  }

  async createLogBook(title, description = '') {
    try {
      const userId = this.getCurrentUser().id;
      const inviteCode = this.generateInviteCode();
      
      const logbook = await this.client.collection('logbooks').create({
        title,
        description,
        created_by: userId,
        admins: [userId],
        members: [userId],
        invite_code: inviteCode,
      });
      
      return logbook;
    } catch (error) {
      console.error('Error creating logbook:', error);
      throw error;
    }
  }

  async joinLogBookWithCode(inviteCode) {
    try {
      const userId = this.getCurrentUser().id;
      
      // Find logbook by invite code
      const logbooks = await this.client.collection('logbooks').getFullList({
        filter: this.client.filter('invite_code = {:code}', { code: inviteCode }),
      });
      
      if (logbooks.length === 0) {
        throw new Error('Invalid invite code');
      }
      
      const logbook = logbooks[0];
      
      // Add user to members if not already there
      if (!logbook.members.includes(userId)) {
        const updatedMembers = [...logbook.members, userId];
        await this.client.collection('logbooks').update(logbook.id, {
          members: updatedMembers,
          invite_code: inviteCode, // Include invite_code so PB update rule allows non-members to join
        });
      }
      
      return logbook;
    } catch (error) {
      console.error('Error joining logbook:', error);
      throw error;
    }
  }

  async deleteLogBook(logbookId) {
    try {
      await this.client.collection('logbooks').delete(logbookId);
    } catch (error) {
      console.error('Error deleting logbook:', error);
      throw error;
    }
  }

  // Memories
  async getMemories(logbookId, page = 1, perPage = 30) {
    try {
      const records = await this.client.collection('memories').getList(page, perPage, {
        filter: this.client.filter('logbook = {:id}', { id: logbookId }),
        sort: '-created',
        expand: 'author',
      });
      return records;
    } catch (error) {
      console.error('Error fetching memories:', error);
      throw error;
    }
  }

  async getMemoriesForAllLogbooks(logbookIds, perLogbook = 5) {
    const results = await Promise.allSettled(
      logbookIds.map(id => this.getMemories(id, 1, perLogbook))
    );
    return logbookIds
      .map((id, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          return {
            logbookId: id,
            items: result.value.items,
            totalItems: result.value.totalItems,
          };
        }
        console.warn(`Failed to fetch memories for logbook ${id}:`, result.reason);
        return null;
      })
      .filter(Boolean);
  }

  async createMemory(logbookId, data, images) {
    try {
      const formData = new FormData();
      formData.append('logbook', logbookId);
      formData.append('author', this.getCurrentUser().id);
      formData.append('title', data.title || '');
      formData.append('description', data.description || '');
      formData.append('event_date', data.eventDate || new Date().toISOString());
      
      if (data.locationName) {
        formData.append('location_name', data.locationName);
      }
      if (data.locationLat != null) {
        formData.append('location_lat', data.locationLat);
      }
      if (data.locationLng != null) {
        formData.append('location_lng', data.locationLng);
      }

      // Append images
      images.forEach((image, index) => {
        formData.append('media', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `photo_${index}.jpg`,
        });
      });

      const record = await this.client.collection('memories').create(formData);
      return record;
    } catch (error) {
      console.error('Error creating memory:', error);
      throw error;
    }
  }

  async deleteMemory(memoryId) {
    try {
      await this.client.collection('memories').delete(memoryId);
    } catch (error) {
      console.error('Error deleting memory:', error);
      throw error;
    }
  }

  // Comments
  async getComments(memoryId) {
    try {
      const records = await this.client.collection('comments').getFullList({
        filter: this.client.filter('memory = {:id}', { id: memoryId }),
        sort: 'created',
        expand: 'author',
      });
      return records;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  async createComment(memoryId, text) {
    try {
      const record = await this.client.collection('comments').create({
        memory: memoryId,
        author: this.getCurrentUser().id,
        text,
      });
      return record;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // Utility
  generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0, O, I, 1)
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getFileUrl(record, filename, { thumb } = {}) {
    const url = this.client.files.getUrl(record, filename);
    if (thumb) {
      return `${url}?thumb=${thumb}`;
    }
    return url;
  }
}

export default new PocketBaseService();
