import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Share,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../stores/authStore';

export default function LogBooksScreen({ navigation }) {
  const { logbooks, currentLogbook, setCurrentLogbook, createLogBook, joinLogBook } = useAuthStore();
  const lastTapRef = useRef(null);

  const handleLogbookPress = (item) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap — select and navigate to Feed
      lastTapRef.current = null;
      setCurrentLogbook(item);
      navigation.navigate('Feed');
    } else {
      // First tap — just select
      lastTapRef.current = now;
      setCurrentLogbook(item);
    }
  };

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreateLogBook = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const result = await createLogBook(newTitle.trim(), newDescription.trim());
    
    if (result.success) {
      Alert.alert('Success', 'LogBook created!');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleJoinLogBook = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    const result = await joinLogBook(inviteCode.trim().toUpperCase());
    
    if (result.success) {
      Alert.alert('Success', 'Joined LogBook!');
      setShowJoinModal(false);
      setInviteCode('');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleShareInvite = async (logbook) => {
    try {
      await Share.share({
        message: `Join my LogBook "${logbook.title}" on MemoryLog! Use invite code: ${logbook.invite_code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getMemberNames = (logbook) => {
    const members = logbook.expand?.members;
    if (!members || members.length === 0) {
      const count = logbook.members?.length || 0;
      return `${count} member${count !== 1 ? 's' : ''}`;
    }

    const adminIds = new Set((logbook.expand?.admins || []).map(a => a.id));
    const getName = (m) => m.name || m.email?.split('@')[0] || 'Unknown';

    const admins = members.filter(m => adminIds.has(m.id));
    const others = members.filter(m => !adminIds.has(m.id));
    const sorted = [...admins, ...others];

    return sorted.map(m => {
      const name = getName(m);
      return adminIds.has(m.id) ? `${name} (owner)` : name;
    }).join(', ');
  };

  const renderLogBook = ({ item }) => {
    const isActive = item.id === currentLogbook?.id;

    return (
      <TouchableOpacity
        style={[styles.logbookCard, isActive && styles.logbookCardActive]}
        onPress={() => handleLogbookPress(item)}
      >
        <View style={styles.logbookIcon}>
          <Ionicons
            name="book"
            size={24}
            color={isActive ? '#007AFF' : '#666'}
          />
        </View>

        <View style={styles.logbookInfo}>
          <Text style={[styles.logbookTitle, isActive && styles.logbookTitleActive]}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.logbookDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.logbookMeta} numberOfLines={2}>
            {getMemberNames(item)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => handleShareInvite(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-outline" size={20} color="#666" />
        </TouchableOpacity>

        {isActive && (
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" style={{ marginLeft: 8 }} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>MemoryLog</Text>
        <Text style={styles.headerSubtitle}>My LogBooks</Text>
      </View>

      <FlatList
        data={logbooks}
        renderItem={renderLogBook}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No LogBooks Yet</Text>
            <Text style={styles.emptyText}>
              Create a new LogBook or join one with an invite code
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowActionSheet(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Action Sheet */}
      <Modal
        visible={showActionSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowActionSheet(false)}>
          <View style={styles.actionSheetOverlay}>
            <View style={styles.actionSheetContent}>
              <TouchableOpacity
                style={styles.actionSheetOption}
                onPress={() => {
                  setShowActionSheet(false);
                  setShowCreateModal(true);
                }}
              >
                <Ionicons name="book" size={24} color="#007AFF" />
                <View style={styles.actionSheetText}>
                  <Text style={styles.actionSheetTitle}>Create New LogBook</Text>
                  <Text style={styles.actionSheetSubtitle}>Start a new family memory book</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <View style={styles.actionSheetDivider} />

              <TouchableOpacity
                style={styles.actionSheetOption}
                onPress={() => {
                  setShowActionSheet(false);
                  setShowJoinModal(true);
                }}
              >
                <Ionicons name="link" size={24} color="#34C759" />
                <View style={styles.actionSheetText}>
                  <Text style={styles.actionSheetTitle}>Join with Code</Text>
                  <Text style={styles.actionSheetSubtitle}>Join an existing logbook</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSheetCancel}
                onPress={() => setShowActionSheet(false)}
              >
                <Text style={styles.actionSheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Create LogBook Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New LogBook</Text>

              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Title (e.g., The Smith Family)"
                value={newTitle}
                onChangeText={setNewTitle}
                maxLength={100}
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Description (optional)"
                value={newDescription}
                onChangeText={setNewDescription}
                maxLength={500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleCreateLogBook}
                >
                  <Text style={styles.modalButtonTextPrimary}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Join LogBook Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowJoinModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Join LogBook</Text>

              <Text style={styles.fieldLabel}>Invite Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter invite code"
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                maxLength={8}
                autoCapitalize="characters"
              />

              <Text style={styles.hint}>
                Enter 8 character code shared with you
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowJoinModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleJoinLogBook}
                >
                  <Text style={styles.modalButtonTextPrimary}>Join</Text>
                </TouchableOpacity>
              </View>
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
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  logbookCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  logbookCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  logbookIcon: {
    marginRight: 16,
  },
  logbookInfo: {
    flex: 1,
  },
  logbookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  logbookTitleActive: {
    color: '#007AFF',
  },
  logbookDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  logbookMeta: {
    fontSize: 12,
    color: '#999',
  },
  shareButton: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonSecondary: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  actionSheetText: {
    flex: 1,
    marginLeft: 16,
  },
  actionSheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  actionSheetSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  actionSheetCancel: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
  },
});
