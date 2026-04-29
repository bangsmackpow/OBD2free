import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useBle } from "../contexts/BleContext";
import { COLORS, SIZES } from "../constants";
import { ConnectionState } from "../types";

const DashboardScreen: React.FC = () => {
  const {
    state,
    engineData,
    scanForDevices,
    connectToDevice,
    devices,
    disconnect,
  } = useBle();

  const renderStatus = () => {
    let statusColor: string = COLORS.text.secondary;
    let statusText = "Disconnected";

    switch (state) {
      case ConnectionState.CONNECTED:
        statusColor = COLORS.neon.green;
        statusText = "Connected";
        break;
      case ConnectionState.CONNECTING:
        statusColor = COLORS.neon.yellow;
        statusText = "Connecting...";
        break;
      case ConnectionState.SCANNING:
        statusColor = COLORS.neon.blue;
        statusText = "Scanning...";
        break;
      case ConnectionState.ERROR:
        statusColor = COLORS.neon.red;
        statusText = "Error";
        break;
    }

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>
    );
  };

  const renderEngineData = () => {
    if (state !== ConnectionState.CONNECTED) return null;

    return (
      <ScrollView
        style={styles.dataContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gaugeRow}>
          <Gauge
            label="RPM"
            value={engineData.rpm}
            unit="RPM"
            max={8000}
            color={COLORS.neon.red}
            size="large"
          />
          <Gauge
            label="Speed"
            value={engineData.speed}
            unit="km/h"
            max={200}
            color={COLORS.neon.blue}
            size="large"
          />
        </View>

        <View style={styles.gaugeRow}>
          <Gauge
            label="Coolant"
            value={engineData.coolantTemp}
            unit="°C"
            max={130}
            color={COLORS.neon.blue}
          />
          <Gauge
            label="Intake Air"
            value={engineData.intakeAirTemp}
            unit="°C"
            max={60}
            color={COLORS.neon.orange}
          />
        </View>

        <View style={styles.gaugeRow}>
          <Gauge
            label="Throttle"
            value={engineData.throttlePosition}
            unit="%"
            max={100}
            color={COLORS.neon.pink}
          />
          <Gauge
            label="Load"
            value={engineData.engineLoad}
            unit="%"
            max={100}
            color={COLORS.neon.purple}
          />
        </View>

        <View style={styles.infoRow}>
          <InfoCard
            label="STFT"
            value={`${engineData.stft.toFixed(1)}%`}
            color={COLORS.neon.green}
          />
          <InfoCard
            label="LTFT"
            value={`${engineData.ltft.toFixed(1)}%`}
            color={COLORS.neon.yellow}
          />
          <InfoCard
            label="Timing"
            value={`${engineData.timingAdvance.toFixed(1)}°`}
            color={COLORS.neon.blue}
          />
        </View>

        <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderScanUI = () => (
    <View style={styles.scanContainer}>
      <Text style={styles.title}>OBD2 Scanner</Text>
      <Text style={styles.subtitle}>
        {state === ConnectionState.SCANNING
          ? "Searching for OBD2 adapters..."
          : "Tap to scan for your OBDLink LX"}
      </Text>

      <TouchableOpacity style={styles.scanButton} onPress={scanForDevices}>
        <Text style={styles.scanButtonText}>
          {state === ConnectionState.SCANNING ? "Scanning..." : "Scan"}
        </Text>
      </TouchableOpacity>

      {devices.length > 0 && (
        <View style={styles.deviceList}>
          <Text style={styles.deviceListTitle}>Found Devices:</Text>
          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceItem}
              onPress={() => connectToDevice(device.id)}
            >
              <Text style={styles.deviceName}>
                {device.name || "OBD2 Adapter"}
              </Text>
              <Text style={styles.deviceId}>{device.id.slice(0, 20)}...</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderStatus()}
      {state === ConnectionState.CONNECTED
        ? renderEngineData()
        : renderScanUI()}
    </SafeAreaView>
  );
};

const Gauge: React.FC<{
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
  size?: "small" | "medium" | "large";
}> = ({ label, value, unit, max, color, size = "medium" }) => {
  const percentage = Math.min(value / max, 1);
  const sizeMap = { small: 100, medium: 140, large: 180 };
  const gaugeSize = sizeMap[size];

  return (
    <View
      style={[styles.gaugeContainer, { width: gaugeSize, height: gaugeSize }]}
    >
      <Text style={styles.gaugeLabel}>{label}</Text>
      <View
        style={[
          styles.gaugeRing,
          { width: gaugeSize - 20, height: gaugeSize - 20 },
        ]}
      >
        <View
          style={[
            styles.gaugeFill,
            {
              width: gaugeSize - 40,
              height: gaugeSize - 40,
              borderRadius: (gaugeSize - 40) / 2,
              backgroundColor: color,
              transform: [{ scaleX: percentage }],
            },
          ]}
        />
      </View>
      <Text style={[styles.gaugeValue, { color }]}>{value.toFixed(0)}</Text>
      <Text style={styles.gaugeUnit}>{unit}</Text>
    </View>
  );
};

const InfoCard: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <View style={[styles.infoCard, { borderLeftColor: color }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SIZES.sm,
  },
  statusText: {
    fontFamily: "System",
    fontSize: SIZES.md,
    fontWeight: "600",
  },
  scanContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SIZES.lg,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.text.secondary,
    marginBottom: SIZES.xl,
    textAlign: "center",
  },
  scanButton: {
    backgroundColor: COLORS.neon.blue,
    paddingHorizontal: SIZES.xl * 2,
    paddingVertical: SIZES.md,
    borderRadius: 30,
  },
  scanButtonText: {
    color: COLORS.background.dark,
    fontSize: SIZES.lg,
    fontWeight: "bold",
  },
  deviceList: {
    width: "100%",
    marginTop: SIZES.xl,
  },
  deviceListTitle: {
    color: COLORS.text.secondary,
    fontSize: SIZES.md,
    marginBottom: SIZES.sm,
  },
  deviceItem: {
    backgroundColor: COLORS.background.card,
    padding: SIZES.md,
    borderRadius: 10,
    marginBottom: SIZES.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.neon.green,
  },
  deviceName: {
    color: COLORS.text.primary,
    fontSize: SIZES.lg,
    fontWeight: "600",
  },
  deviceId: {
    color: COLORS.text.muted,
    fontSize: SIZES.sm,
    marginTop: 2,
  },
  dataContainer: {
    flex: 1,
    padding: SIZES.md,
  },
  gaugeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: SIZES.lg,
  },
  gaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeLabel: {
    color: COLORS.text.secondary,
    marginBottom: SIZES.sm,
  },
  gaugeRing: {
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.background.elevated,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gaugeFill: {
    position: "absolute",
    left: 0,
    top: 0,
    transformOrigin: "right center",
  },
  gaugeValue: {
    fontSize: SIZES.xxl,
    fontWeight: "bold",
    marginTop: SIZES.sm,
  },
  gaugeUnit: {
    fontSize: SIZES.sm,
    color: COLORS.text.muted,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SIZES.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.background.card,
    padding: SIZES.md,
    borderRadius: 10,
    marginHorizontal: SIZES.xs,
    borderLeftWidth: 4,
  },
  infoLabel: {
    color: COLORS.text.secondary,
    fontSize: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  infoValue: {
    fontSize: SIZES.lg,
    fontWeight: "bold",
  },
  disconnectButton: {
    backgroundColor: COLORS.neon.red,
    padding: SIZES.md,
    borderRadius: 10,
    marginTop: SIZES.lg,
    alignItems: "center",
  },
  disconnectText: {
    color: COLORS.background.dark,
    fontWeight: "bold",
    fontSize: SIZES.md,
  },
});

export default DashboardScreen;
