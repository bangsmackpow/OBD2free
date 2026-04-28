import {BleManager, Device, State, Service, Characteristic, Subscription, BleRestoredState, ScanMode} from 'react-native-ble-plx';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import {BLE_CONFIG} from '../constants';

class BleServiceClass {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private characteristicRx: string | null = null;
  private characteristicTx: string | null = null;
  private responseListener: Subscription | null = null;
  private isInitialized = false;

  private responseBuffer = '';
  private pendingResponses: Map<string, {resolve: (value: string) => void; reject: (error: Error) => void}> = new Map();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.requestPermissions();

    this.manager = new BleManager({
      restoreStateIdentifier: 'obd2free-ble-state',
      restoreStateFunction: this.restoreState.bind(this),
    });

    this.isInitialized = true;
    this.setupEventListeners();
  }

  private restoreState(restoredState: BleRestoredState | null): void {
    if (restoredState) {
      console.log('Restoring BLE state');
    }
  }

  private setupEventListeners(): void {
    if (!this.manager) return;

    this.manager.onStateChange((newState: State) => {
      console.log('BLE State:', newState);
    }, true);
  }

  private async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      const perms = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      if (Platform.Version >= 35) {
        perms.push(PermissionsAndroid.PERMISSIONS.FOREGROUND_SERVICE_CONNECTED_DEVICE);
      }

      const granted = await PermissionsAndroid.requestMultiple(perms);
      const allGranted = Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (!allGranted) {
        Alert.alert('Permission Required', 'Bluetooth permissions are required.');
        throw new Error('Bluetooth permissions denied');
      }
    }
  }

  async startScanning(): Promise<void> {
    if (!this.manager) {
      await this.initialize();
    }

    try {
      await this.manager!.startDeviceScan(
        null,
        {
          scanMode: ScanMode.LowLatency,
          allowDuplicates: false,
        },
        this.onDeviceDiscovered.bind(this),
      );

      setTimeout(() => this.stopScanning(), BLE_CONFIG.SCAN_DURATION * 1000);
    } catch (error) {
      console.error('Scanning error:', error);
      throw error;
    }
  }

   private onDeviceDiscovered = (error: Error | null, device: Device | null): void => {
    if (error || !device) return;

    const deviceName = device.name?.toLowerCase() || '';
    const isOBD2Adapter = deviceName.includes('obd') || deviceName.includes('elm');

    if (isOBD2Adapter) {
      console.log('Found OBD2 adapter:', device.name, device.id);
      this.emit('deviceFound', {
        id: device.id,
        name: device.name || 'OBD2 Adapter',
        rssi: device.rssi ?? -100,
      });
    }
  };

  stopScanning(): void {
    this.manager?.stopDeviceScan();
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    if (!this.manager) {
      await this.initialize();
    }

    try {
      this.emit('connecting', {deviceId});

      const device = await this.manager!.connectToDevice(deviceId, {
        autoConnect: true,
      });

      if (!device) throw new Error('Connection failed: device is null');

      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();

      // Get services array (await services)
      const services = await device.services();

      // Find UART service
      const targetServiceUUID = BLE_CONFIG.ALT_SERVICE_UUIDS[0];
      const targetCharUUID = BLE_CONFIG.ALT_CHARACTERISTIC_UUIDS[0];

      let foundTx = false;
      let foundRx = false;

      for (const service of services) {
        if (service.uuid.toUpperCase() === targetServiceUUID) {
          const characteristics = await service.characteristics();
          for (const char of characteristics) {
            if (char.uuid.toUpperCase() === targetCharUUID) {
              const props = (char as any).properties || {};
              if (props.write) {
                this.characteristicTx = char.uuid;
                foundTx = true;
              }
              if (props.notify) {
                this.characteristicRx = char.uuid;
                foundRx = true;
              }
            }
          }
        }
      }

      if (!this.characteristicRx || !this.characteristicTx) {
        throw new Error('Required UART characteristics not found');
      }

      const service = services.find(s => s.uuid.toUpperCase() === targetServiceUUID);
      if (service) {
        this.responseListener = device.monitorCharacteristicForService(
          service.uuid,
          this.characteristicRx!,
          (error, characteristic) => {
            if (error) {
              console.error('Char monitor error:', error);
              return;
            }
            if (characteristic?.value) {
              this.handleResponse(characteristic.value);
            }
          },
        );
      }

      this.connectedDevice = device;
      this.emit('connected', {device});
      return device;
    } catch (error) {
      this.emit('connectionError', {error});
      throw error;
    }
  }

  disconnect(): void {
    this.responseListener?.remove();
    this.connectedDevice?.cancelConnection();
    this.connectedDevice = null;
    this.characteristicRx = null;
    this.characteristicTx = null;
    this.responseBuffer = '';
    this.pendingResponses.clear();
    this.emit('disconnected');
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.connectedDevice || !this.characteristicTx) {
      throw new Error('Not connected');
    }

    const cmd = command.endsWith('\r') ? command : `${command}\r`;
    const encoded = Buffer.from(cmd, 'utf8').toString('base64');

    await this.connectedDevice.writeCharacteristicWithResponseForService(
      this.connectedDevice.id,
      this.characteristicTx,
      encoded,
    );
  }

  private handleResponse(base64Value: string): void {
    const decoded = Buffer.from(base64Value, 'base64').toString('utf8');
    this.responseBuffer += decoded;

    if (this.responseBuffer.includes('>')) {
      const response = this.responseBuffer.trimEnd();
      this.responseBuffer = '';

      const pending = this.pendingResponses.values().next().value;
      if (pending) {
        pending.resolve(response);
        this.pendingResponses.clear();
      }

      this.emit('response', {response});
    }
  }

  async sendCommandWithResponse(command: string, timeout: number = 200): Promise<string> {
    if (!this.connectedDevice) throw new Error('Not connected');

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingResponses.delete(command);
        reject(new Error('Command timeout'));
      }, timeout);

      this.pendingResponses.set(command, {
        resolve: (value: string) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error: Error) => {
          clearTimeout(timer);
          reject(error);
        },
      });

      this.sendCommand(command).catch(reject);
    });
  }

  // Event emitter
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  // Getters
  getIsConnected(): boolean {
    return this.connectedDevice !== null;
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  getManager(): BleManager | null {
    return this.manager;
  }

  destroy(): void {
    this.disconnect();
    this.manager?.destroy();
    this.manager = null;
    this.isInitialized = false;
  }
}

export const BleService = new BleServiceClass();
