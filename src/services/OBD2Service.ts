import {BleService} from './BleService';
import {OBD2PID, OBD2Mode, ATCommand, OBD2Reading, EngineData} from '../types';
import {OBD2_CONFIG, BLE_CONFIG} from '../constants';

class OBD2ServiceClass {
  private isInitialized = false;
  private commandQueue: Array<{pid: OBD2PID; priority?: number}> = [];
  private isProcessingQueue = false;
  private lastCommandTime = 0;
  private lastReadings: Map<OBD2PID, OBD2Reading> = new Map();
  private readingCallbacks: Array<(data: EngineData) => void> = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize BLE service
    await BleService.initialize();

    // Set up BLE response listener
    BleService.on('response', this.handleResponse.bind(this));

    // Initialize ELM327 adapter
    await this.initializeELM327();

    this.isInitialized = true;
  }

  private async initializeELM327(): Promise<void> {
    try {
      // Reset adapter
      await this.sendATCommand(ATCommand.RESET);
      await this.delay(100);

      // Set adaptive timing
      if (OBD2_CONFIG.ADAPTIVE_TIMING) {
        await this.sendATCommand(ATCommand.ADAPTIVE_TIMING);
      }

      // Set timeout (74ms)
      await this.sendATCommand(ATCommand.SET_TIMEOUT);

      // Allow long messages
      await this.sendATCommand(ATCommand.ALLOW_LONG_MESSAGES);

      // Auto-detect protocol
      await this.sendATCommand(ATCommand.PROTOCOL_AUTO);

      // Headers ON for DTC reading
      await this.sendATCommand(ATCommand.HEADERS_ON);

      // Verify connection
      const version = await this.sendATCommand(ATCommand.PRINT_VERSION);
      console.log('ELM327 Version:', version);

      const protocol = await this.sendATCommand(ATCommand.DESCRIBE_PROTOCOL);
      console.log('Protocol:', protocol);

      // Read battery voltage
      const voltage = await this.sendATCommand(ATCommand.READ_BATTERY_VOLTAGE);
      console.log('Adapter Voltage:', voltage);

      // Get supported PIDs
      await this.discoverSupportedPIDs();
    } catch (error) {
      console.error('ELM327 initialization failed:', error);
      throw error;
    }
  }

  private async sendATCommand(command: ATCommand, attempts: number = 1): Promise<string> {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await BleService.sendCommandWithResponse(command);
        return response;
      } catch (error) {
        if (i === attempts - 1) throw error;
        await this.delay(100);
      }
    }
    throw new Error('AT command failed');
  }

  private async discoverSupportedPIDs(): Promise<void> {
    // Query standard PID support (0x00)
    try {
      const response = await this.sendOBDCommand(OBD2Mode.CURRENT_DATA, '00');
      if (response) {
        console.log('PID Support:', response);
        // Parse bitmask to determine which PIDs are supported
      }
    } catch (error) {
      console.warn('Could not query PID support:', error);
    }
  }

  private async sendOBDCommand(mode: OBD2Mode, pid: string): Promise<string | null> {
    const command = `${mode}${pid}`;
    try {
      return await BleService.sendCommandWithResponse(command, OBD2_CONFIG.COMMAND_TIMEOUT);
    } catch (error) {
      console.error(`OBD command failed: ${command}`, error);
      return null;
    }
  }

  private parseResponse(response: string, pid: OBD2PID): number | null {
    try {
      // Response format: "41 0C 1A F8" for mode 01, PID 0C
      // or "62 56 AB CD" for mode 22 enhanced
      const parts = response.trim().split(/\s+/);

      // Find the response matching the requested PID
      let dataIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '41' && parts[i + 1] === pid) {
          dataIndex = i + 2;
          break;
        }
        if (parts[i] === '62' && parts[i + 1] === pid) {
          dataIndex = i + 2;
          break;
        }
      }

      if (dataIndex === -1 || dataIndex >= parts.length) {
        return null;
      }

      const payload = parts.slice(dataIndex);

      // Parse based on PID
      switch (pid) {
        case OBD2PID.ENGINE_RPM:
          // A*256 + B, then /4
          const a = parseInt(payload[0], 16);
          const b = parseInt(payload[1], 16);
          return ((a * 256) + b) / 4;

        case OBD2PID.VEHICLE_SPEED:
          return parseInt(payload[0], 16);

        case OBD2PID.ENGINE_LOAD:
          return parseInt(payload[0], 16) / 2.55;

        case OBD2PID.COOLANT_TEMP:
        case OBD2PID.INTAKE_AIR_TEMP:
        case OBD2PID.AMBIENT_AIR_TEMP:
          return parseInt(payload[0], 16) - 40;

        case OBD2PID.STFT_BANK1:
        case OBD2PID.LTFT_BANK1:
          return (parseInt(payload[0], 16) / 1.28) - 100;

        case OBD2PID.INTAKE_MAP:
          return parseInt(payload[0], 16);

        case OBD2PID.THROTTLE_POS:
          return parseInt(payload[0], 16) / 2.55;

        case OBD2PID.TIMING_ADVANCE:
          return (parseInt(payload[0], 16) / 2) - 64;

        case OBD2PID.MAF_AIR_FLOW:
          return ((parseInt(payload[0], 16) * 256) + parseInt(payload[1], 16)) / 100;

        case OBD2PID.FUEL_TANK_LEVEL:
          return (parseInt(payload[0], 16) * 100) / 255;

        case OBD2PID.CONTROL_MODULE_VOLTAGE:
          return ((parseInt(payload[0], 16) * 256) + parseInt(payload[1], 16)) / 1000;

        case OBD2PID.DISTANCE_MIL:
          return (parseInt(payload[0], 16) * 256) + parseInt(payload[1], 16);

        case OBD2PID.OBD_STANDARD:
          return parseInt(payload[0], 16); // Map to protocol name

        // Manufacturer-specific parsing
        case OBD2PID.MAZDA_BOOST_PRESSURE:
          // Mode 22 - interpretation varies by vehicle
          return parseInt(payload[0], 16);

        default:
          console.warn('Unhandled PID parser:', pid);
          return null;
      }
    } catch (error) {
      console.error('Parse error:', error, 'PID:', pid);
      return null;
    }
  }

  private lastResponseTimestamp = 0;
  private pendingResponse: {pid: OBD2PID} | null = null;

  private handleResponse(data: {response: string}): void {
    const {response} = data;

    if (!this.pendingResponse) return;

    const value = this.parseResponse(response, this.pendingResponse.pid);
    if (value !== null) {
      const reading: OBD2Reading = {
        pid: this.pendingResponse.pid,
        value,
        unit: this.getUnitForPID(this.pendingResponse.pid),
        timestamp: Date.now(),
      };

      this.lastReadings.set(this.pendingResponse.pid, reading);
      this.lastResponseTimestamp = Date.now();

      // Emit updated engine data
      this.emitEngineData();
    }

    this.pendingResponse = null;
  }

  private emitEngineData(): void {
    const data: EngineData = {
      rpm: this.lastReadings.get(OBD2PID.ENGINE_RPM)?.value ?? 0,
      speed: this.lastReadings.get(OBD2PID.VEHICLE_SPEED)?.value ?? 0,
      coolantTemp: this.lastReadings.get(OBD2PID.COOLANT_TEMP)?.value ?? 0,
      intakeAirTemp: this.lastReadings.get(OBD2PID.INTAKE_AIR_TEMP)?.value ?? 0,
      throttlePosition: this.lastReadings.get(OBD2PID.THROTTLE_POS)?.value ?? 0,
      engineLoad: this.lastReadings.get(OBD2PID.ENGINE_LOAD)?.value ?? 0,
      timingAdvance: this.lastReadings.get(OBD2PID.TIMING_ADVANCE)?.value ?? 0,
      stft: this.lastReadings.get(OBD2PID.STFT_BANK1)?.value ?? 0,
      ltft: this.lastReadings.get(OBD2PID.LTFT_BANK1)?.value ?? 0,
      map: this.lastReadings.get(OBD2PID.INTAKE_MAP)?.value ?? 0,
      maf: this.lastReadings.get(OBD2PID.MAF_AIR_FLOW)?.value ?? 0,
      ambientTemp: this.lastReadings.get(OBD2PID.AMBIENT_AIR_TEMP)?.value,
      fuelLevel: this.lastReadings.get(OBD2PID.FUEL_TANK_LEVEL)?.value,
      voltage: this.lastReadings.get(OBD2PID.CONTROL_MODULE_VOLTAGE)?.value,
    };

    this.readingCallbacks.forEach(cb => cb(data));
  }

  private getUnitForPID(pid: OBD2PID): string {
    const units: Record<OBD2PID, string> = {
      [OBD2PID.ENGINE_RPM]: 'RPM',
      [OBD2PID.VEHICLE_SPEED]: 'km/h',
      [OBD2PID.ENGINE_LOAD]: '%',
      [OBD2PID.COOLANT_TEMP]: '°C',
      [OBD2PID.INTAKE_AIR_TEMP]: '°C',
      [OBD2PID.AMBIENT_AIR_TEMP]: '°C',
      [OBD2PID.THROTTLE_POS]: '%',
      [OBD2PID.STFT_BANK1]: '%',
      [OBD2PID.LTFT_BANK1]: '%',
      [OBD2PID.TIMING_ADVANCE]: '°',
      [OBD2PID.INTAKE_MAP]: 'kPa',
      [OBD2PID.MAF_AIR_FLOW]: 'g/s',
      [OBD2PID.FUEL_TANK_LEVEL]: '%',
      [OBD2PID.CONTROL_MODULE_VOLTAGE]: 'V',
      [OBD2PID.DISTANCE_MIL]: 'km',
      [OBD2PID.OBD_STANDARD]: '',
      [OBD2PID.MAZDA_BOOST_PRESSURE]: 'psi',
      [OBD2PID.MAZDA_KNOCK_SENSOR]: 'raw',
      [OBD2PID.BMW_BATTERY_REG_STATUS]: 'raw',
    };
    return units[pid] || '';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API
  async startPolling(): Promise<void> {
    if (!BleService.getIsConnected()) {
      throw new Error('Not connected');
    }

    // Start queue processing
    this.enqueuePIDs(OBD2_CONFIG.PRIMARY_PIDS);
    this.processQueue();
  }

  stopPolling(): void {
    this.commandQueue = [];
    this.isProcessingQueue = false;
  }

  private enqueuePIDs(pids: readonly OBD2PID[]): void {
    pids.forEach(pid => {
      this.commandQueue.push({pid});
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.commandQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.commandQueue.length > 0 && BleService.getIsConnected()) {
      const item = this.commandQueue.shift();
      if (!item) continue;

      // Ensure minimum delay between commands
      const now = Date.now();
      const timeSinceLast = now - this.lastCommandTime;
      if (timeSinceLast < OBD2_CONFIG.COMMAND_DELAY) {
        await this.delay(OBD2_CONFIG.COMMAND_DELAY - timeSinceLast);
      }

      this.pendingResponse = {pid: item.pid};
      const success = await this.sendOBDCommand(OBD2Mode.CURRENT_DATA, item.pid);
      if (!success) {
        console.warn('Command failed:', item.pid);
      }

      this.lastCommandTime = Date.now();
    }

    this.isProcessingQueue = false;

    // Re-enqueue PIDs for continuous polling
    if (BleService.getIsConnected()) {
      this.enqueuePIDs(OBD2_CONFIG.PRIMARY_PIDS);
      // Schedule next cycle
      setTimeout(() => this.processQueue(), OBD2_CONFIG.DEFAULT_POLL_RATE);
    }
  }

  onReading(callback: (data: EngineData) => void): void {
    this.readingCallbacks.push(callback);
  }

  offReading(callback: (data: EngineData) => void): void {
    const index = this.readingCallbacks.indexOf(callback);
    if (index > -1) {
      this.readingCallbacks.splice(index, 1);
    }
  }

  getLastReading(pid: OBD2PID): OBD2Reading | undefined {
    return this.lastReadings.get(pid);
  }

  getAllReadings(): EngineData {
    return {
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
      ambientTemp: this.lastReadings.get(OBD2PID.AMBIENT_AIR_TEMP)?.value,
      fuelLevel: this.lastReadings.get(OBD2PID.FUEL_TANK_LEVEL)?.value,
      voltage: this.lastReadings.get(OBD2PID.CONTROL_MODULE_VOLTAGE)?.value,
    };
  }

  // Diagnostic functions
  async readDTCs(): Promise<string[]> {
    const response = await this.sendOBDCommand(OBD2Mode.DTC, '');
    if (!response) return [];

    // Parse DTCs from response
    // Format: 43 01 01 03 ... (count followed by codes)
    const parts = response.trim().split(/\s+/);
    if (parts.length < 3) return [];

    const dtcs: string[] = [];
    // Skip mode (43) and count, then decode each 2-byte code
    for (let i = 2; i < parts.length; i += 2) {
      if (i + 1 >= parts.length) break;
      const code = this.decodeDTC(parts[i], parts[i + 1]);
      dtcs.push(code);
    }
    return dtcs;
  }

  private decodeDTC(high: string, low: string): string {
    const byte1 = parseInt(high, 16);
    const byte2 = parseInt(low, 16);

    const letter =
      byte1 & 0b10000000 ? 'P' :
      byte1 & 0b01000000 ? 'C' :
      byte1 & 0b00100000 ? 'B' : 'U';

    const digit1 = (byte1 & 0b00110000) >> 4;
    const digit2 = byte1 & 0b00001111;
    const digit3 = (byte2 & 0b11110000) >> 4;
    const digit4 = byte2 & 0b00001111;

    return `${letter}${digit1}${digit2}${digit3}${digit4}`;
  }

  async clearDTCs(): Promise<boolean> {
    const response = await this.sendOBDCommand(OBD2Mode.CLEAR_DTC, '');
    return response !== null;
  }

  // Manufacturer-specific diagnostics
  async readMazdaBoost(): Promise<number | null> {
    // Mode 22 PID 0x56 (Mazda-specific)
    const response = await this.sendOBDCommand(OBD2Mode.ENHANCED, '56');
    if (!response) return null;
    // Parse response (format varies by model year)
    const parts = response.trim().split(/\s+/);
    const dataIndex = parts.findIndex((p, i) => p === '62' && parts[i + 1] === '56');
    if (dataIndex !== -1 && dataIndex + 2 < parts.length) {
      return parseInt(parts[dataIndex + 2], 16);
    }
    return null;
  }

  // Connection state
  async connect(deviceId: string): Promise<void> {
    await BleService.connectToDevice(deviceId);
    await this.initialize();
  }

  disconnect(): void {
    this.stopPolling();
    BleService.disconnect();
  }

  destroy(): void {
    this.stopPolling();
    BleService.destroy();
  }

  getIsConnected(): boolean {
    return BleService.getIsConnected();
  }
}

export const OBD2Service = new OBD2ServiceClass();
