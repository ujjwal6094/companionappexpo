import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LocationInfoScreen = ({ navigation }: any) => {
  const privacyPolicyUrl = 'https://mctindia.co.in/mobileapps-privacy';

  const handleOpenPrivacy = () => {
    Linking.openURL(privacyPolicyUrl).catch((err) =>
      console.warn('Could not open privacy policy URL', err)
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📍</Text>
        </View>

        <Text style={styles.title}>Location Permission Notice</Text>
        <Text style={styles.subtitle}>Prominent Disclosure & Data Safety</Text>

        {/* Required Google Play Background Location Prominent Disclosure Statement */}
        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            <Text style={styles.boldText}>T-Matrix Track</Text> collects location data to
            enable real-time trip route tracking, distance calculation, and field work order
            status synchronization{' '}
            <Text style={styles.accentText}>
              even when the app is closed or not in use
            </Text>
            .
          </Text>
        </View>

        {/* Section: Why is this needed */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Why is this needed?</Text>
          <Text style={styles.bodyText}>
            • <Text style={styles.boldText}>Continuous Route Tracking:</Text> Records accurate trip
            milestones and waypoints while technicians are driving, even when the screen is turned
            off or another app (such as navigation) is active.
          </Text>
          <Text style={styles.bodyText}>
            • <Text style={styles.boldText}>Automated Work Order Logging:</Text> Verifies arrival
            at work sites and synchronizes dispatch records with your enterprise server.
          </Text>
        </View>

        {/* Section: Data Privacy & Protection */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Data Privacy & Protection</Text>
          <Text style={styles.bodyText}>
            Your location data is encrypted in transit and transmitted exclusively to your
            organization's Maximo backend.
          </Text>
          <Text style={styles.bodyText}>
            • <Text style={styles.boldText}>Never sold</Text> to any data brokers.{'\n'}
            • <Text style={styles.boldText}>Never shared</Text> with third parties.{'\n'}
            • <Text style={styles.boldText}>Never used</Text> for advertising or marketing.
          </Text>
        </View>

        {/* Section: Battery Impact */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Battery Usage Notice</Text>
          <Text style={styles.bodyText}>
            T-Matrix Track utilizes smart distance filtering and adaptive GPS sampling to minimize
            battery drain. Continued use of GPS running in the background can decrease battery life.
          </Text>
        </View>

        {/* Privacy Policy Link */}
        <TouchableOpacity
          onPress={handleOpenPrivacy}
          style={styles.privacyLinkContainer}
          activeOpacity={0.7}
        >
          <Text style={styles.privacyLinkText}>Read our full Privacy Policy →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 20,
  },
  highlightBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
    marginBottom: 16,
  },
  highlightText: {
    color: '#F1F5F9',
    fontSize: 15,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accentText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeading: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bodyText: {
    color: '#CBD5E1',
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 6,
  },
  privacyLinkContainer: {
    backgroundColor: '#0F2B48',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0284C7',
    marginTop: 8,
  },
  privacyLinkText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});
