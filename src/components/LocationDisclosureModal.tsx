import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
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
  privacyPolicyUrl = 'https://mctindia.co.in/mobileapps-privacy',
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
          {/* Top Header with Icon and Close Button */}
          <View style={styles.topBar}>
            <View style={{ width: 32 }} />
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📍</Text>
            </View>
            <TouchableOpacity 
              onPress={onDeny} 
              style={styles.closeBtn} 
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Location Permission Notice</Text>
          <Text style={styles.subtitle}>Prominent Disclosure & User Consent</Text>

          {/* Full-view scrollable body */}
          <ScrollView 
            style={styles.scrollArea} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 24 : 44,
  },
  dialog: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    width: '100%',
    maxWidth: 480,
    flex: 1,
    maxHeight: '94%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 21,
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
    marginBottom: 12,
  },
  scrollArea: {
    flex: 1,
    marginBottom: 14,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  highlightBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
    marginBottom: 14,
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
  sectionHeading: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bodyText: {
    color: '#94A3B8',
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 10,
  },
  privacyLinkContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  privacyLinkText: {
    color: '#38BDF8',
    fontSize: 14,
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
