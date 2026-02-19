import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';


const onCreateNote = () => {
  router.push('/account/create-note'); // future screen
};

export default function NotesScreen() {
  // Main screen for viewing user notes.
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
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060cb1' },
  content: { paddingBottom: 26 },
  header: { backgroundColor: '#060cb1', paddingTop: Platform.OS === 'ios' ? 18 : 18, paddingHorizontal: 16, paddingBottom: 12 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },

  groups: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  group: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', padding: 18 },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 18 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  emptySub: { fontSize: 12, fontWeight: '600', color: '#6b7280', textAlign: 'center' },

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
