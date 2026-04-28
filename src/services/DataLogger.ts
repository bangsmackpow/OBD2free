import {MMKV} from 'react-native-mmkv';
import RNFS from 'react-native-fs';
import {v4 as uuidv4} from 'uuid';
import {OBD2Reading, EngineData, GPSPoint, LoggingSession} from '../types';
import {OBD2Service} from './OBD2Service';
import {GPSService} from './GPSService';
import {LOGGING_CONFIG, STORAGE_KEYS} from '../constants';

class DataLoggerClass {
  private storage: MMKV;
  private currentSession: LoggingSession | null = null;
  private csvBuffer: string[] = [];
  private isLogging = false;
  private flushInterval: NodeJS.Timeout | null = null;
  private readingCallback: ((data: EngineData) => void) | null = null;

  constructor() {
    this.storage = new MMKV({
      id: 'obd2free-storage',
      encryptionKey: 'obd2free-encryption-key',
    });
    this.readingCallback = this.handleReading.bind(this);
  }

  async startSession(vehicleId: string, userId: string): Promise<string> {
    if (this.isLogging) {
      await this.stopSession();
    }

    const sessionId = uuidv4();
    const now = Date.now();

    this.currentSession = {
      id: sessionId,
      vehicleId,
      userId,
      startTime: now,
    };

    this.csvBuffer = [this.getCSVHeader()];
    this.isLogging = true;
    this.currentSession!.distance = 0; // initialize

    // Start flush interval
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, LOGGING_CONFIG.FLUSH_INTERVAL);

    // Subscribe to OBD2 readings
    if (this.readingCallback) {
      OBD2Service.onReading(this.readingCallback);
    }

    // Save session metadata to MMKV
    this.saveSessionMetadata();

    return sessionId;
  }

  // OBD2 reading callback
  public handleReading(data: EngineData): void {
    if (!this.isLogging || !this.currentSession) return;

    // Get GPS for this reading
    const gpsPoint = this.getLastGPS();

    // Build CSV row
    const row = this.buildCSVRow(data, gpsPoint);
    this.csvBuffer.push(row);

    // Auto-flush if buffer is full
    if (this.csvBuffer.length >= LOGGING_CONFIG.BUFFER_SIZE) {
      this.flushBuffer();
    }
  }

  private buildCSVRow(data: EngineData, gps: GPSPoint | null): string {
    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      gps?.lat ?? '',
      gps?.lng ?? '',
      gps?.speed ?? '',
      data.rpm.toFixed(1),
      data.speed.toFixed(1),
      data.coolantTemp.toFixed(1),
      data.intakeAirTemp.toFixed(1),
      data.throttlePosition.toFixed(2),
      data.engineLoad.toFixed(2),
      data.timingAdvance.toFixed(2),
      data.stft.toFixed(2),
      data.ltft.toFixed(2),
      data.map.toFixed(2),
      data.maf.toFixed(2),
      data.ambientTemp?.toFixed(1) ?? '',
      data.fuelLevel?.toFixed(1) ?? '',
      data.voltage?.toFixed(3) ?? '',
    ];

    return row.join(',');
  }

  private getCSVHeader(): string {
    return [
      'timestamp',
      'latitude',
      'longitude',
      'gps_speed',
      'rpm',
      'speed',
      'coolant_temp',
      'intake_air_temp',
      'throttle_pos',
      'engine_load',
      'timing_advance',
      'stft',
      'ltft',
      'map',
      'maf',
      'ambient_temp',
      'fuel_level',
      'voltage',
    ].join(',');
  }

  private flushBuffer(): Promise<void> {
    if (this.csvBuffer.length < 2) return Promise.resolve();

    const csvContent = this.csvBuffer.join('\n') + '\n';
    this.csvBuffer = [this.getCSVHeader()]; // Reset buffer with header

    // Write to file system
    return this.writeToFile(csvContent);
  }

  private async writeToFile(content: string): Promise<void> {
    if (!this.currentSession) return;

    const filename = `session_${this.currentSession.id}.csv`;
    const filepath = `${RNFS.CachesDirectoryPath}/${filename}`;

    try {
      const exists = await RNFS.exists(filepath);
      if (exists) {
        // Append to existing file
        await RNFS.appendFile(filepath, content);
      } else {
        // Create new file
        await RNFS.writeFile(filepath, content);
      }
    } catch (error) {
      console.error('File write error:', error);
    }
  }

  async stopSession(): Promise<LoggingSession | null> {
    if (!this.isLogging || !this.currentSession) return null;

    // Stop OBD2 reading subscription
    if (this.readingCallback) {
      OBD2Service.offReading(this.readingCallback);
    }

    // Flush remaining buffer
    await this.flushBuffer();

    // Update session metadata
    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    // Calculate derived metrics
    await this.calculateSessionMetrics();

    // Save to storage
    this.saveSessionMetadata();

    // Cleanup
    const session = this.currentSession;
    this.currentSession = null;
    this.isLogging = false;

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

     return session;
   }

   private async calculateSessionMetrics(): Promise<void> {
    if (!this.currentSession) return;

    const session = this.currentSession;
    // Read CSV file and calculate stats
    const filename = `session_${session.id}.csv`;
    const filepath = `${RNFS.CachesDirectoryPath}/${filename}`;

    try {
      const csvContent = await RNFS.readFile(filepath, 'utf8');
      const lines = csvContent.split('\n').slice(1); // Skip header
      let maxSpeed = 0;
      let totalSpeed = 0;
      let speedCount = 0;
      let prevPoint: GPSPoint | null = null;

      for (const line of lines) {
        if (!line.trim()) continue;
        const cols = line.split(',');
        const speed = parseFloat(cols[4]) || 0; // speed column

        maxSpeed = Math.max(maxSpeed, speed);
        totalSpeed += speed;
        speedCount++;

        // Distance calculation from GPS
        if (cols[1] && cols[2]) {
          const lat = parseFloat(cols[1]);
          const lng = parseFloat(cols[2]);
          const currentPoint: GPSPoint = {lat, lng, timestamp: Date.now()};

          if (prevPoint) {
            const delta = this.calculateDistance(prevPoint, currentPoint);
            session.distance = (session.distance ?? 0) + delta;
          }
          prevPoint = currentPoint;
        }
      }

      session.maxSpeed = maxSpeed;
      session.avgSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;
      session.distance = session.distance || 0;
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  }

  private calculateDistance(p1: GPSPoint, p2: GPSPoint): number {
    // Haversine formula in km
    const R = 6371;
    const dLat = this.toRad(p2.lat - p1.lat);
    const dLon = this.toRad(p2.lng - p1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(p1.lat)) *
        Math.cos(this.toRad(p2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async compressSessionFile(): Promise<void> {
    if (!this.currentSession) return;

    const filename = `session_${this.currentSession.id}.csv`;
    const filepath = `${RNFS.CachesDirectoryPath}/${filename}`;

    try {
      const stats = await RNFS.stat(filepath);
      if (stats.size > LOGGING_CONFIG.COMPRESS_THRESHOLD) {
        // GZIP compression would go here in production
        // For now, just note it
        console.log(`Session file is ${stats.size} bytes - would compress`);
      }
    } catch (error) {
      console.error('Compression check error:', error);
    }
  }

  private saveSessionMetadata(): void {
    if (!this.currentSession) return;

    // Save to MMKV
    const sessions = this.getStoredSessions();
    sessions[this.currentSession.id] = this.currentSession;
    this.storage.set(STORAGE_KEYS.LAST_SESSION, JSON.stringify(sessions));

    // Update session count
    this.storage.set(STORAGE_KEYS.SESSION_COUNT, sessions.length.toString());
  }

  private getStoredSessions(): Record<string, LoggingSession> {
    const data = this.storage.getString(STORAGE_KEYS.LAST_SESSION);
    return data ? JSON.parse(data) : {};
  }

  // GPS tracking
  private lastGPS: GPSPoint | null = null;

  updateGPS = (point: GPSPoint): void => {
    GPSService['lastLocation'] = point;
    // Store last GPS in MMKV for emergency access
    this.storage.set(STORAGE_KEYS.LAST_GPS, JSON.stringify(point));
  };

  private getLastGPS(): GPSPoint | null {
    // Use GPSService instead of internal state
    return GPSService.getLastLocation();
  }

  // Upload to Cloudflare R2
  async uploadSession(sessionId: string, presignedUrl: string): Promise<boolean> {
    if (!this.currentSession || this.currentSession.id !== sessionId) {
      return false;
    }

    const filename = `session_${sessionId}.csv`;
    const filepath = `${RNFS.CachesDirectoryPath}/${filename}`;

    try {
      const fileExists = await RNFS.exists(filepath);
      if (!fileExists) {
        console.error('Session file not found');
        return false;
      }

      const fileSize = (await RNFS.stat(filepath)).size;
      this.currentSession.fileSize = fileSize;

      // Upload via presigned URL (direct to R2)
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: require('react-native-fs').readFile(filepath, 'base64'),
        headers: {
          'Content-Type': 'text/csv',
          'Content-Length': fileSize.toString(),
        },
      });

      if (response.ok) {
        console.log('Upload successful');
        this.currentSession.fileKey = `sessions/${sessionId}/${filename}`;
        this.saveSessionMetadata();
        return true;
      } else {
        console.error('Upload failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  }

  // Get all sessions
  getSessions(): LoggingSession[] {
    const sessions = this.getStoredSessions();
    return Object.values(sessions).sort(
      (a, b) => (b.startTime ?? 0) - (a.startTime ?? 0),
    );
  }

  getSession(id: string): LoggingSession | undefined {
    const sessions = this.getStoredSessions();
    return sessions[id];
  }

  // Getters
  getIsLogging(): boolean {
    return this.isLogging;
  }

  getCurrentSession(): LoggingSession | null {
    return this.currentSession;
  }

  // Cleanup old sessions (keep only N most recent)
  cleanupOldSessions(keepCount: number = LOGGING_CONFIG.MAX_LOCAL_SESSIONS): void {
    const sessions = this.getStoredSessions();
    const sessionArray = Object.values(sessions);
    if (sessionArray.length <= keepCount) return;

    const toDelete = sessionArray.slice(keepCount).map(s => s.id);
    toDelete.forEach(id => {
      delete sessions[id];
      // Delete file
      RNFS.unlink(`${RNFS.CachesDirectoryPath}/session_${id}.csv`).catch(() => {});
    });

    this.storage.set(STORAGE_KEYS.LAST_SESSION, JSON.stringify(sessions));
  }

  destroy(): void {
    if (this.isLogging) {
      this.stopSession();
    }
    this.storage = null as any;
  }
}

export const DataLogger = new DataLoggerClass();
