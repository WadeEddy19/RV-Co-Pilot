import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { apiFetch } from '@/lib/api';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

type Note = {
  id: number;
  title: string;
  note: string;
  created_at: string;
  updated_at?: string | null;
};

type ProfileResponse = {
  notes?: Note[];
};

export default function NotesScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const onCreateNote = () => {
    if (Platform.OS === 'web') {
      const title = window.prompt('Enter a title for your note');
      const trimmedTitle = (title || '').trim();
      if (!trimmedTitle) return;

      router.push({
        pathname: '/account/create-note',
        params: {
          title: trimmedTitle,
          mode: 'create',
        },
      });
      return;
    }

    Alert.alert(
      'Create Note',
      'Add title prompt for mobile next.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteNote = (noteId: number, noteTitle: string) => {
    const runDelete = async () => {
      try {
        const res = await apiFetch(`/api/notes/${noteId}`, {
          method: 'DELETE',
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to delete note');
        }

        setNotes((prev) => prev.filter((note) => note.id !== noteId));
      } catch (err: any) {
        console.error('Delete note failed:', err);

        if (Platform.OS === 'web') {
          window.alert(err?.message || 'Failed to delete note');
        } else {
          Alert.alert('Delete failed', err?.message || 'Failed to delete note');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Delete "${noteTitle}"? This cannot be undone.`);
      if (confirmed) {
        runDelete();
      }
    } else {
      Alert.alert(
        'Delete Note',
        `Delete "${noteTitle}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: runDelete },
        ]
      );
    }
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch('/api/profile');
      const data: ProfileResponse = await res.json();

      if (!res.ok) {
        throw new Error((data as any)?.error || 'Failed to load notes');
      }

      setNotes(data.notes || []);
    } catch (err: any) {
      console.error('Load notes failed:', err);
      setError(err?.message || 'Failed to load notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Notes</Text>
          <View style={styles.iconBtn} />
        </View>
      </View>

      <View style={styles.groups}>
        <View style={styles.group}>
          {loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color="#060cb1" />
              <Text style={styles.emptySub}>Loading notes...</Text>
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <Ionicons name="alert-circle-outline" size={22} color="#ef4444" />
              <Text style={styles.emptyTitle}>Could not load notes</Text>
              <Text style={styles.emptySub}>{error}</Text>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={22} color="#6b7280" />
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Text style={styles.emptySub}>Notes you create will show up here.</Text>

              <Pressable
                onPress={onCreateNote}
                style={({ pressed }) => [
                  styles.createBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.createBtnText}>Create Note</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.notesWrap}>
              <View style={styles.notesHeader}>
                <Text style={styles.notesCount}>
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                </Text>

                <Pressable
                  onPress={onCreateNote}
                  style={({ pressed }) => [
                    styles.createBtn,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.createBtnText}>Create Note</Text>
                </Pressable>
              </View>

              {notes.map((item) => (
                <View key={item.id} style={styles.noteCard}>
                  <View style={styles.noteCardTop}>
                    <Text style={styles.noteTitle} numberOfLines={1}>
                      {item.title}
                    </Text>

                    <View style={styles.noteActions}>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/account/create-note',
                            params: {
                              id: String(item.id),
                              title: item.title,
                              note: item.note,
                              mode: 'edit',
                            },
                          })
                        }
                        style={({ pressed }) => [
                          styles.actionBtn,
                          pressed && styles.actionBtnPressed,
                        ]}
                      >
                        <Ionicons name="create-outline" size={18} color="#6b7280" />
                      </Pressable>

                      <Pressable
                        onPress={() => handleDeleteNote(item.id, item.title)}
                        style={({ pressed }) => [
                          styles.actionBtn,
                          pressed && styles.actionBtnPressed,
                        ]}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>

                  <Text style={styles.notePreview} numberOfLines={2}>
                    {item.note || 'No content yet'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060cb1' },
  content: { paddingBottom: 26 },

  header: {
    backgroundColor: '#060cb1',
    paddingTop: Platform.OS === 'ios' ? 18 : 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  groups: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  group: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    padding: 18,
  },

  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },

  notesWrap: { gap: 12 },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notesCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  noteCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noteCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginRight: 8,
  },
  notePreview: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },

  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    backgroundColor: '#e5e7eb',
  },

  createBtn: {
    marginTop: 14,
    backgroundColor: '#060cb1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});