import React, {createContext, useContext, useState, useEffect, ReactNode, useCallback} from 'react';
import {BleService} from '../services/BleService';
import {BLEDevice, ConnectionState, EngineData} from '../types';
import {OBD2Service} from '../services/OBD2Service';

interface BleContextType {
  state: ConnectionState;
  device: BLEDevice | null;
  error: string | null;
  devices: BLEDevice[];
  engineData: EngineData;
  scanForDevices: () => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: () => void;
  startPolling: () => Promise<void>;
  stopPolling: () => void;
}

const BleContext = createContext<BleContextType | undefined>(undefined);

interface BleProviderProps {
  children: ReactNode;
}

export const BleProvider: React.FC<BleProviderProps> = ({children}) => {
  const [state, setState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [device, setDevice] = useState<BLEDevice | null>(null);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [engineData, setEngineData] = useState<EngineData>({
    rpm: 0,
    speed: 0,
    coolantTemp: 0,
    intakeAirTemp: 0,
    throttlePosition: 0,
    engineLoad: 0,
    timingAdvance: 0,
    stft: 0,
    ltft: 0,
    map: 0,
    maf: 0,
  });

  const updateEngineData = useCallback((data: EngineData) => {
    setEngineData(data);
  }, []);

  useEffect(() => {
    initializeBle();

    return () => {
      cleanup();
    };
  }, []);

  const initializeBle = async () => {
    try {
      setState(ConnectionState.CONNECTING);
      await BleService.initialize();
      setState(ConnectionState.DISCONNECTED);
    } catch (err: any) {
      setError(err.message);
      setState(ConnectionState.ERROR);
    }
  };

  const cleanup = () => {
    BleService.off('response', updateEngineData);
  };

  const scanForDevices = async () => {
    setState(ConnectionState.SCANNING);
    setDevices([]);
    try {
      await BleService.startScanning();

      // Set up device discovery listener
      const handleDeviceFound = (device: BLEDevice) => {
        setDevices(prev => {
          // Avoid duplicates
          if (prev.some(d => d.id === device.id)) return prev;
          return [...prev, device];
        });
      };

      BleService.on('deviceFound', handleDeviceFound);

      // Stop scanning after delay
      setTimeout(() => {
        BleService.stopScanning();
        setState(ConnectionState.DISCONNECTED);
        BleService.off('deviceFound', handleDeviceFound);
      }, 5000);
    } catch (err: any) {
      setError(err.message);
      setState(ConnectionState.ERROR);
    }
  };

  const connectToDevice = async (deviceId: string) => {
    try {
      setState(ConnectionState.CONNECTING);
      setError(null);

      await BleService.connectToDevice(deviceId);

      // Convert Device to BLEDevice
      const connectedDevice = BleService.getConnectedDevice();
      setDevice({
        id: connectedDevice?.id ?? '',
        name: connectedDevice?.name ?? 'OBD2 Adapter',
        rssi: connectedDevice?.rssi ?? -100,
      });

      // Start polling OBD2 data
      await OBD2Service.startPolling();

      // Subscribe to data updates
      OBD2Service.onReading(updateEngineData);

      setState(ConnectionState.CONNECTED);
    } catch (err: any) {
      setError(err.message);
      setState(ConnectionState.ERROR);
      throw err;
    }
  };

  const disconnect = () => {
    OBD2Service.stopPolling();
    OBD2Service.offReading(updateEngineData);
    BleService.disconnect();
    setDevice(null);
    setState(ConnectionState.DISCONNECTED);
  };

  const startPolling = async () => {
    if (state !== ConnectionState.CONNECTED) {
      throw new Error('Not connected to device');
    }
    OBD2Service.onReading(updateEngineData);
  };

  const stopPolling = () => {
    OBD2Service.offReading(updateEngineData);
  };

  const value: BleContextType = {
    state,
    device,
    error,
    devices,
    engineData,
    scanForDevices,
    connectToDevice,
    disconnect,
    startPolling,
    stopPolling,
  };

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
};

export const useBle = (): BleContextType => {
  const context = useContext(BleContext);
  if (!context) {
    throw new Error('useBle must be used within a BleProvider');
  }
  return context;
};
