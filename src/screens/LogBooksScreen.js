import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
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

export default function LogBooksScreen() {
  const { logbooks, currentLogbook, setCurrentLogbook, createLogBook, joinLogBook } = useAuthStore();
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

  const renderLogBook = ({ item }) => {
    const isActive = item.id === currentLogbook?.id;
    const memberCount = item.members?.length || 0;

    return (
      <TouchableOpacity
        style={[styles.logbookCard, isActive && styles.logbookCardActive]}
        onPress={() => setCurrentLogbook(item)}
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
          <Text style={styles.logbookMeta}>
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {isActive && (
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Create LogBook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowJoinModal(true)}
        >
          <Ionicons name="enter-outline" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Join with Code</Text>
        </TouchableOpacity>
      </View>

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

              <TextInput
                style={styles.input}
                placeholder="Title (e.g., The Smith Family)"
                value={newTitle}
                onChangeText={setNewTitle}
                maxLength={100}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={newDescription}
                onChangeText={setNewDescription}
                maxLength={500}
                multiline
                numberOfLines={3}
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

              <TextInput
                style={styles.input}
                placeholder="Enter invite code"
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                maxLength={8}
                autoCapitalize="characters"
              />

              <Text style={styles.hint}>
                Ask a family member for the 8-character invite code
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
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
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
});
