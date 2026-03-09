import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { apiFetch } from '@/lib/api';


export default function EditProfileScreen() {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleChangeDisplayName = async () => {
  const value = window.prompt('Enter your new display name');
  const newName = (value || '').trim();

  if (!newName) return;

  try {
    const res = await apiFetch('/api/profile/name', {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to update display name');
    }

    window.alert('Display name updated successfully.');
    router.back();
  } catch (err: any) {
    console.error('Display name update failed:', err);
    window.alert(err?.message || 'Something went wrong while updating the display name.');
  }
};

  const handleChangeAvatar = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Please allow photo library access to choose an avatar.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const fileUri = asset.uri;
      const mimeType = asset.mimeType || 'image/jpeg';
      const fileSize = asset.fileSize || 0;

      setUploading(true);

      //signed Cloudflare R2 upload URL
      const presignRes = await apiFetch('/api/r2/avatar-upload-url', {
        method: 'POST',
        body: JSON.stringify({
          content_type: mimeType,
          file_size_bytes: fileSize,
        }),
      }); 

      const presignData = await presignRes.json();

      if (!presignRes.ok) {
        throw new Error(presignData.error || 'Failed to get upload URL');
      }

      const { upload_url, public_url } = presignData;

      //fetch the local file and upload it directly to R2
      const fileResponse = await fetch(fileUri);
      const fileBlob = await fileResponse.blob();

      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: fileBlob,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to Cloudflare R2 failed');
      }

      //save the avatar URL in your backend/database
      const saveRes = await apiFetch('/api/profile/avatar', {
        method: 'POST',
        body: JSON.stringify({
          avatar_url: public_url,
        }),
    });

      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveData.error || 'Failed to save avatar');
      }

      setAvatarUrl(public_url);
      window.alert('Avatar updated successfully.');
      router.back();
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      Alert.alert('Upload failed', err?.message || 'Something went wrong while uploading the avatar.');
    } finally {
      setUploading(false);
    }
  };

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

      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Ionicons name="person" size={54} color="#9ca3af" />
          )}
        </View>

        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator />
            <Text style={styles.uploadingText}>Uploading avatar...</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.groups}>
        <Group>
          <NavRow label="Change display name" onPress={handleChangeDisplayName} />
          <NavRow label="Change avatar" onPress={handleChangeAvatar} />
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
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  avatarSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  avatarCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  uploadingRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  groups: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  group: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef2f7',
  },
  rowPressed: { backgroundColor: '#f6f7fb' },
  rowText: { color: '#111827', fontSize: 14, fontWeight: '700' },
});