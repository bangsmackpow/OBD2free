import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSession} from '../contexts/SessionContext';
import {PREMIUM_CONFIG, COLORS, SIZES} from '../constants';

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
}

const PremiumGate: React.FC<PremiumGateProps> = ({feature, children}) => {
  const {isPremium, checkPremiumAccess} = useSession();

  // Grant access if user is premium
  if (checkPremiumAccess()) {
    return <>{children}</>;
  }

  // Locked - show paywall prompt
  return (
    <View style={styles.lockedContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.lockIcon}>🔒</Text>
      </View>
      <Text style={styles.title}>Premium Feature</Text>
      <Text style={styles.description}>
        {feature} requires a Premium subscription.
      </Text>
      <TouchableOpacity style={styles.upgradeButton} onPress={() => {/* navigate to paywall */}}>
        <Text style={styles.upgradeText}>Upgrade to Premium</Text>
      </TouchableOpacity>
      <Text style={styles.pricing}>
        ${PREMIUM_CONFIG.MONTHLY_PRICE}/month or ${PREMIUM_CONFIG.LIFETIME_PRICE} one-time
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl * 2,
    backgroundColor: COLORS.background.card,
    margin: SIZES.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.neon.purple,
  },
  iconContainer: {
    marginBottom: SIZES.lg,
  },
  lockIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SIZES.sm,
  },
  description: {
    fontSize: SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  upgradeButton: {
    backgroundColor: COLORS.neon.green,
    paddingHorizontal: SIZES.xl * 2,
    paddingVertical: SIZES.md,
    borderRadius: 30,
    marginBottom: SIZES.md,
  },
  upgradeText: {
    color: COLORS.background.dark,
    fontWeight: 'bold',
    fontSize: SIZES.lg,
  },
  pricing: {
    fontSize: SIZES.sm,
    color: COLORS.text.muted,
  },
});

export default PremiumGate;
