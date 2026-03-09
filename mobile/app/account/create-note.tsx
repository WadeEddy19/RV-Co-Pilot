import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '@/lib/api';

export default function NoteEditorScreen() {
  const params = useLocalSearchParams();
  const mode = String(params.mode || 'create');
  const noteId = params.id ? Number(params.id) : null;

  const [title] = useState(String(params.title || 'Untitled Note'));
  const [noteText, setNoteText] = useState(String(params.note || ''));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      const path = mode === 'edit' && noteId
        ? `/api/notes/${noteId}`
        : '/api/notes';

      const method = mode === 'edit' && noteId ? 'PUT' : 'POST';

      const res = await apiFetch(path, {
        method,
        body: JSON.stringify({
          title,
          note: noteText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save note');
      }

      window.alert('Note saved successfully.');
      router.back();
    } catch (err: any) {
      console.error('Save note failed:', err);
      window.alert(err?.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Write your note here..."
          placeholderTextColor="#9ca3af"
          value={noteText}
          onChangeText={setNoteText}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handleSave} style={styles.saveBtn} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Note'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060cb1' },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  iconText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  textArea: {
    minHeight: 420,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    fontSize: 15,
    color: '#111827',
  },
  footer: { padding: 16 },
  saveBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#060cb1',
    fontSize: 15,
    fontWeight: '800',
  },
});