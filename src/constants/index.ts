export const COLORS = {
  // Primary neon colors
  neon: {
    blue: '#00D4FF',
    green: '#39FF14',
    pink: '#FF10F0',
    purple: '#BC13FE',
    yellow: '#FFFF00',
    orange: '#FF5E00',
    red: '#FF0055',
  } as const,

  // Backgrounds
  background: {
    dark: '#0A0A0A',
    darker: '#050505',
    card: '#141414',
    elevated: '#1E1E1E',
  } as const,

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    muted: '#666666',
  } as const,

  // Status
  status: {
    success: '#39FF14',
    warning: '#FFAA00',
    error: '#FF0055',
    info: '#00D4FF',
  } as const,
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
  mono: 'Menlo',
};

export const SIZES = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// OBD2 Configuration
import {OBD2PID} from '../types';

export const OBD2_CONFIG = {
  DEFAULT_POLL_RATE: 100, // ms (10Hz for OBDLink LX)
  SLOW_PID_INTERVAL: 5, // poll every Nth cycle for slow-changing PIDs
  COMMAND_TIMEOUT: 200, // ms
  MAX_COMMAND_QUEUE: 5,
  COMMAND_DELAY: 50, // min ms between same PID requests (prevent buffer overflow)
  AUTO_RETRY_ATTEMPTS: 3,
  ADAPTIVE_TIMING: true,
  // Standard PIDs to poll (order matters - fast PIDs first)
  PRIMARY_PIDS: [
    OBD2PID.ENGINE_RPM,
    OBD2PID.VEHICLE_SPEED,
    OBD2PID.ENGINE_LOAD,
    OBD2PID.THROTTLE_POS,
    OBD2PID.COOLANT_TEMP,
    OBD2PID.INTAKE_AIR_TEMP,
    OBD2PID.STFT_BANK1,
    OBD2PID.LTFT_BANK1,
    OBD2PID.TIMING_ADVANCE,
    OBD2PID.INTAKE_MAP,
    OBD2PID.MAF_AIR_FLOW,
    OBD2PID.FUEL_TANK_LEVEL,
    OBD2PID.CONTROL_MODULE_VOLTAGE,
    OBD2PID.AMBIENT_AIR_TEMP,
  ],
  // Manufacturer-specific PIDs
  MAZDA_BOOST_PRESSURE: '0x56', // Mode 22 PID - Mazda specific (not yet in enum)
  BMW_BATTERY_VOLTAGE: '0x42', // Already in standard PID, but may need Mode 22 for enhanced
} as const;

// BLE Configuration
export const BLE_CONFIG = {
  // Service UUIDs
  OBD2_SERVICE_UUID: 'FFE0', // Common for ELM327-based adapters
  OBD2_CHARACTERISTIC_UUID: 'FFE1',
  // Alt UUIDs for different adapters
  ALT_SERVICE_UUIDS: ['FFE0', '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'], // Nordic UART
  ALT_CHARACTERISTIC_UUIDS: ['FFE1', '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'],
  // Scanning
  SCAN_DURATION: 5, // seconds
  SCAN_MODE: 'LowLatency',
  // Connection
  AUTO_RECONNECT: true,
  RECONNECT_DELAY: 3000, // ms
  MTU_SIZE: 512,
} as const;

// Data Logging Configuration
export const LOGGING_CONFIG = {
  BUFFER_SIZE: 500, // records per CSV chunk
  FLUSH_INTERVAL: 5000, // ms (force flush even if buffer not full)
  MAX_LOCAL_SESSIONS: 10,
  UPLOAD_ON_WIFI_ONLY: true,
  MIN_BATTERY_LEVEL: 20, // % - don't upload if battery below this
  COMPRESS_THRESHOLD: 1024 * 1024, // 1MB - compress files larger than this
} as const;

// GPS Configuration
export const GPS_CONFIG = {
  UPDATE_INTERVAL: 1000, // ms
  FAST_INTERVAL: 200, // ms during active logging
  DISTANCE_FILTER: 5, // meters - minimum distance between updates
  ACCURACY_FILTER: 50, // meters - max acceptable accuracy
  TIMEOUT: 10000, // ms
} as const;

// Cloudflare Configuration
export const CLOUDFLARE_CONFIG = {
  API_URL: 'https://api.obd2free.app',
  WORKER_URL: 'https://worker.obd2free.app',
  R2_BUCKET: 'obd2free-logs',
  D1_DATABASE: 'obd2free-db',
  PRESIGNED_URL_EXPIRY: 3600, // 1 hour
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  UPLOAD_CHUNK_SIZE: 5 * 1024 * 1024, // 5MB (R2 multipart min)
} as const;

// Premium Configuration
export const PREMIUM_CONFIG = {
  MONTHLY_PRICE: 5.99, // USD
  YEARLY_PRICE: 49.99, // USD
  LIFETIME_PRICE: 49.99, // USD
  FREE_LIMITS: {
    MAX_DASHBOARDS: 3,
    MAX_LOCAL_SESSIONS: 10,
    MAX_VEHICLES: 2,
    CLOUD_SYNC: false,
    ADVANCED_ANALYTICS: false,
    MANUFACTURER_DIAGNOSTICS: false,
  } as const,
} as const;

// App Storage Keys (MMKV)
export const STORAGE_KEYS = {
  // User
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  PREMIUM_STATUS: 'premium_status',
  PREMIUM_EXPIRY: 'premium_expiry',

  // Vehicle
  CURRENT_VEHICLE: 'current_vehicle',
  VEHICLES: 'vehicles',

  // Connection
  LAST_CONNECTED_DEVICE: 'last_connected_device',
  DEVICE_NAME: 'device_name',

  // Dashboard
  DASHBOARD_LAYOUTS: 'dashboard_layouts',
  ACTIVE_DASHBOARD: 'active_dashboard',

  // Sessions
  LAST_SESSION: 'last_session',
  SESSION_COUNT: 'session_count',

  // Settings
  POLL_RATE: 'poll_rate',
  AUTO_CONNECT: 'auto_connect',
  BACKGROUND_LOGGING: 'background_logging',
  UNITS: 'units', // metric/imperial

  // GPS
  LAST_GPS: 'last_gps',
  HOME_LOCATION: 'home_location',

  // Cloud
  API_TOKEN: 'api_token',
  SYNC_ENABLED: 'sync_enabled',
} as const;

// Units
export const UNITS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial',
} as const;

export const UNIT_CONVERSIONS = {
  speed: {
    [UNITS.METRIC]: { factor: 1, suffix: 'km/h' },
    [UNITS.IMPERIAL]: { factor: 0.621371, suffix: 'mph' },
  },
  distance: {
    [UNITS.METRIC]: { factor: 1, suffix: 'km' },
    [UNITS.IMPERIAL]: { factor: 0.621371, suffix: 'mi' },
  },
  temperature: {
    [UNITS.METRIC]: { factor: 1, offset: 0, suffix: '°C' },
    [UNITS.IMPERIAL]: { factor: 1.8, offset: 32, suffix: '°F' }, // C to F: (C * 1.8) + 32
  },
} as const;
