import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button } from 'react-native';
import { getLocationQueue, clearLocationQueue } from '../storage/storage';
import { LocationPayload } from '../types/location';
import { syncQueue } from '../services/locationQueueService';

export const LogsScreen = () => {
  const [queue, setQueue] = useState<LocationPayload[]>([]);
  const [syncing, setSyncing] = useState(false);

  const fetchQueue = async () => {
    const data = await getLocationQueue();
    setQueue(data.reverse()); // Show newest first
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await syncQueue(console.log);
    await fetchQueue();
    setSyncing(false);
  };

  const handleClear = async () => {
    await clearLocationQueue();
    await fetchQueue();
  };

  const renderItem = ({ item }: { item: LocationPayload }) => (
    <View style={styles.card}>
      <Text style={styles.time}>{item.createdate ? new Date(item.createdate).toLocaleString() : 'Unknown time'}</Text>
      <Text>Lat: {item.latitudey?.toFixed(6) ?? 'N/A'}</Text>
      <Text>Lng: {item.longitudex?.toFixed(6) ?? 'N/A'}</Text>
      <Text>Acc: {item.accuracy != null ? `${item.accuracy}m` : 'N/A'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Queue</Text>
        <Text style={styles.count}>Pending: {queue.length}</Text>
      </View>
      
      <View style={styles.buttons}>
        <Button title="Refresh" onPress={fetchQueue} />
        <Button title="Force Sync" onPress={handleSync} disabled={syncing} />
        <Button title="Clear Queue" onPress={handleClear} color="red" />
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item, index) => item.createdate ?? index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Queue is empty</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 16,
    color: '#666',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  list: {
    padding: 15,
  },
  card: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  time: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
});
