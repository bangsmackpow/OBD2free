// OBD2 Parameter IDs (PIDs)
export enum OBD2PID {
  // Standard PIDs (Mode 01)
  ENGINE_LOAD = '04',
  COOLANT_TEMP = '05',
  STFT_BANK1 = '06',
  LTFT_BANK1 = '07',
  INTAKE_MAP = '0B',
  ENGINE_RPM = '0C',
  VEHICLE_SPEED = '0D',
  TIMING_ADVANCE = '0E',
  INTAKE_AIR_TEMP = '0F',
  MAF_AIR_FLOW = '10',
  THROTTLE_POS = '11',
  OBD_STANDARD = '1C',
  DISTANCE_MIL = '21',
  FUEL_TANK_LEVEL = '2F',
  CONTROL_MODULE_VOLTAGE = '42',
  AMBIENT_AIR_TEMP = '46',

  // Manufacturer-specific (Mode 22)
  MAZDA_BOOST_PRESSURE = '56', // Mazda-specific
  MAZDA_KNOCK_SENSOR = '2300', // Enhanced mode
  BMW_BATTERY_REG_STATUS = '2E', // F10 specific
}

// ELM327 AT Commands
export enum ATCommand {
  RESET = 'AT Z',
  PROTOCOL_AUTO = 'AT SP 0',
  ALLOW_LONG_MESSAGES = 'AT AL',
  HEADERS_ON = 'AT H1',
  READ_BATTERY_VOLTAGE = 'AT RV',
  DESCRIBE_PROTOCOL = 'AT DP',
  PRINT_VERSION = 'AT I',
  ADAPTIVE_TIMING = 'AT AT1',
  SET_TIMEOUT = 'AT ST 4A', // 74ms timeout
}

// OBD2 Modes
export enum OBD2Mode {
  CURRENT_DATA = '01',
  FREEZE_FRAME = '02',
  DTC = '03',
  CLEAR_DTC = '04',
  TEST_RESULTS = '05',
  TEST_RESULTS_2006 = '06',
  // Enhanced/Mode 22 for manufacturer-specific
  ENHANCED = '22',
}

// OBD2 Response Modes (add 0x40 to request mode)
export enum OBD2ResponseMode {
  CURRENT_DATA = '41',
  DTC = '43',
  ENHANCED = '62',
}

// PID Support Bits (PID 0x00)
export interface PIDSupport {
  pids01to20: boolean;
  pids21to40: boolean;
  pids41to60: boolean;
  pids61to80: boolean;
  // ... extend as needed
}

// Parsed OBD2 Data
export interface OBD2Reading {
  pid: OBD2PID;
  value: number;
  unit: string;
  timestamp: number;
}

// Engine-specific data
export interface EngineData {
  rpm: number;
  speed: number;
  coolantTemp: number;
  intakeAirTemp: number;
  throttlePosition: number;
  engineLoad: number;
  timingAdvance: number;
  stft: number;
  ltft: number;
  map: number;
  maf: number;
  ambientTemp?: number;
  fuelLevel?: number;
  voltage?: number;
}

// DTC (Diagnostic Trouble Code)
export interface DTC {
  code: string;
  description?: string;
  status: 'active' | 'pending' | 'historical';
}

// Vehicle Profile
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  nickname?: string;
  obdProtocol?: string;
}

// Datalogging Session
export interface LoggingSession {
  id: string;
  vehicleId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  distance?: number;
  maxSpeed?: number;
  avgSpeed?: number;
  fileKey?: string; // R2 object key
  fileSize?: number;
  gpsTrack?: GPSPoint[];
  notes?: string;
}

// GPS Point
export interface GPSPoint {
  lat: number;
  lng: number;
  speed?: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
}

// Performance Metrics
export interface PerformanceMetrics {
  zeroTo60?: number; // seconds
  quarterMileTime?: number;
  quarterMileSpeed?: number;
  lapTime?: number;
  sectorTimes?: number[];
}

// Dashboard Widget Configuration
export type WidgetType = 'gauge' | 'graph' | 'text' | 'table' | 'digital';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: {x: number; y: number; w: number; h: number};
  dataSource: {
    pid: OBD2PID;
    label: string;
    unit: string;
    min: number;
    max: number;
    threshold?: {value: number; color: string}[];
  };
  appearance?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    showMinMax?: boolean;
  };
}

// Bluetooth Device Info
export interface BLEDevice {
  id: string;
  name: string;
  rssi?: number;
  advertisedServiceUuids?: string[];
  isConnectable?: boolean;
}

// Connection State
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  SCANNING = 'scanning',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  ERROR = 'error',
}

// Premium Status
export enum PremiumStatus {
  FREE = 'free',
  PREMIUM = 'premium',
  LIFETIME = 'lifetime',
  ENTERPRISE = 'enterprise',
}

// User Profile
export interface User {
  id: string;
  email: string;
  premiumStatus: PremiumStatus;
  premiumExpiry?: number; // timestamp
  vehicles: Vehicle[];
}
