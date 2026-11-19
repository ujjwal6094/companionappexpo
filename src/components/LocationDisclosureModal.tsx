import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';

interface LocationDisclosureModalProps {
  visible: boolean;
  onAccept: () => void;
  onDeny: () => void;
  privacyPolicyUrl?: string;
}

export const LocationDisclosureModal: React.FC<LocationDisclosureModalProps> = ({
  visible,
  onAccept,
  onDeny,
  privacyPolicyUrl = 'https://www.mctit.com/privacy-policy',
}) => {
  const handleOpenPrivacy = () => {
    if (privacyPolicyUrl) {
      Linking.openURL(privacyPolicyUrl).catch((err) =>
        console.warn('Could not open privacy policy URL', err)
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDeny}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header Icon & Title */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>📍</Text>
          </View>
          <Text style={styles.title}>Location Permission Notice</Text>
          <Text style={styles.subtitle}>Prominent Disclosure & User Consent</Text>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Required Google Play Background Location Prominent Disclosure Statement */}
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>
                <Text style={styles.boldText}>T-Matrix Track</Text> collects location
                data to enable real-time trip route tracking, distance calculation, and field work
                order status synchronization{' '}
                <Text style={styles.accentText}>
                  even when the app is closed or not in use
                </Text>
                .
              </Text>
            </View>

            <Text style={styles.sectionHeading}>Why is this needed?</Text>
            <Text style={styles.bodyText}>
              • <Text style={styles.boldText}>Continuous Route Tracking:</Text> Records accurate
              trip milestones and waypoints while technicians are driving, even when the screen is
              turned off or another app (such as navigation) is active.{'\n'}
              • <Text style={styles.boldText}>Automated Work Order Logging:</Text> Verifies arrival
              at work sites and synchronizes dispatch records with your enterprise server.
            </Text>

            <Text style={styles.sectionHeading}>Data Privacy & Protection</Text>
            <Text style={styles.bodyText}>
              Your location data is encrypted in transit and transmitted exclusively to your
              organization's Maximo backend. It is{' '}
              <Text style={styles.boldText}>never sold</Text>,{' '}
              <Text style={styles.boldText}>never shared with third parties</Text>, and{' '}
              <Text style={styles.boldText}>never used for advertising</Text>.
            </Text>

            {/* Privacy Policy Link */}
            <TouchableOpacity onPress={handleOpenPrivacy} style={styles.privacyLinkContainer}>
              <Text style={styles.privacyLinkText}>Read our Privacy Policy →</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>Accept & Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.denyButton}
              onPress={onDeny}
              activeOpacity={0.7}
            >
              <Text style={styles.denyButtonText}>Deny / Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
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
    marginBottom: 16,
  },
  scrollArea: {
    maxHeight: 280,
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  highlightBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
    marginBottom: 14,
  },
  highlightText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#F8FAFC',
  },
  accentText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  sectionHeading: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bodyText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  privacyLinkContainer: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  privacyLinkText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  buttonGroup: {
    gap: 10,
  },
  acceptButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  denyButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  denyButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
