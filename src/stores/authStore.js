import { create } from 'zustand';
import pb from '../services/pocketbase';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  currentLogbook: null,
  logbooks: [],

  // Initialize - try auto-login
  initialize: async () => {
    try {
      const success = await pb.tryAutoLogin();
      if (success) {
        const user = pb.getCurrentUser();
        const logbooks = await pb.getLogBooks();
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          logbooks,
          currentLogbook: logbooks[0] || null,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Initialize error:', error);
      set({ isLoading: false });
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const authData = await pb.login(email, password);
      const logbooks = await pb.getLogBooks();
      set({
        user: authData.record,
        isAuthenticated: true,
        logbooks,
        currentLogbook: logbooks[0] || null,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Signup
  signup: async (email, password, name) => {
    try {
      const authData = await pb.signup(email, password, name);
      set({
        user: authData.record,
        isAuthenticated: true,
        logbooks: [],
        currentLogbook: null,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: async () => {
    await pb.logout();
    set({
      user: null,
      isAuthenticated: false,
      currentLogbook: null,
      logbooks: [],
    });
  },

  // LogBooks
  refreshLogBooks: async () => {
    try {
      const logbooks = await pb.getLogBooks();
      set({ logbooks });
      
      // If current logbook was deleted, switch to first available
      const currentStillExists = logbooks.some(
        (lb) => lb.id === useAuthStore.getState().currentLogbook?.id
      );
      if (!currentStillExists && logbooks.length > 0) {
        set({ currentLogbook: logbooks[0] });
      }
    } catch (error) {
      console.error('Error refreshing logbooks:', error);
    }
  },

  setCurrentLogbook: (logbook) => {
    set({ currentLogbook: logbook });
  },

  createLogBook: async (title, description) => {
    try {
      const logbook = await pb.createLogBook(title, description);
      const logbooks = await pb.getLogBooks();
      set({ logbooks, currentLogbook: logbook });
      return { success: true, logbook };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  joinLogBook: async (inviteCode) => {
    try {
      const logbook = await pb.joinLogBookWithCode(inviteCode);
      const logbooks = await pb.getLogBooks();
      set({ logbooks, currentLogbook: logbook });
      return { success: true, logbook };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));

export default useAuthStore;
