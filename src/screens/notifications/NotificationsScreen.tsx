import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useGetNotificationsQuery, usePostNotificationsReadAllMutation } from '../../api/generated/investorApi';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const { data, refetch } = useGetNotificationsQuery({});
  const [markAllRead] = usePostNotificationsReadAllMutation();

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap();
      refetch();
    } catch {
      // Ignore
    }
  };

  const notifications = (data as any)?.notifications || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleMarkAll}>
            <Text style={styles.markText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.title || 'Notification'}</Text>
            <Text style={styles.itemBody}>{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No notifications yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  markText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  item: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: spacing.radiusMd, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemBody: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});



