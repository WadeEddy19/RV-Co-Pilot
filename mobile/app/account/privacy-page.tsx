import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          <Text style={styles.headerTitle}>Privacy</Text>

          <View style={styles.iconBtn} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={30} color="#060cb1" />
          </View>

          <Text style={styles.title}>Privacy Disclaimer</Text>

          <Text style={styles.description}>
            This application is designed to help users discover camping destinations,
            view location details, and save personal information such as notes, saved
            trips, and profile preferences. Information entered into the application
            may be stored to improve the user experience and provide access to saved
            features across sessions.
          </Text>

          <Text style={styles.description}>
            While reasonable efforts are made to protect user information, this
            application does not guarantee absolute security of data. Users should
            avoid storing highly sensitive personal, financial, or confidential
            information in notes or profile fields. By using this application, users
            acknowledge that they are responsible for the information they choose to
            store and share within the platform.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060cb1',
  },
  content: {
    paddingBottom: 26,
  },
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
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
});