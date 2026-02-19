import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function EditProfileScreen() {
  // Main screen for editing user profiles. 
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.iconBtn} />
        </View>
      </View>

      <View style={styles.groups}>
        <Group>
          <NavRow label="Change display name" onPress={() => {}} />
          <NavRow label="Change avatar" onPress={() => {}} />
        </Group>
      </View>
    </ScrollView>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}
function NavRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </Pressable>
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
  group: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  row: { paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eef2f7' },
  rowPressed: { backgroundColor: '#f6f7fb' },
  rowText: { color: '#111827', fontSize: 14, fontWeight: '700' },
});
