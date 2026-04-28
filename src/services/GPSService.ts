import Geolocation from 'react-native-geolocation-service';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import {GPSPoint} from '../types';
import {GPS_CONFIG} from '../constants';

class GPSServiceClass {
  public lastLocation: GPSPoint | null = null;
  private watchId: number | null = null;
  private isActive = false;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'OBD2Free needs location access to track your drives and correlate data with GPS.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS: permissions handled by geolocation service
    return true;
  }

  async startTracking(highAccuracy: boolean = false): Promise<void> {
    if (this.isActive) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Location permission is required for tracking.');
      throw new Error('Location permission denied');
    }

    const options = {
      enableHighAccuracy: highAccuracy,
      distanceFilter: GPS_CONFIG.DISTANCE_FILTER,
      interval: highAccuracy ? GPS_CONFIG.FAST_INTERVAL : GPS_CONFIG.UPDATE_INTERVAL,
      fastestInterval: GPS_CONFIG.FAST_INTERVAL,
      timeout: GPS_CONFIG.TIMEOUT,
      // Android-specific
      forceRequestLocation: Platform.OS === 'android',
      showLocationDialog: false,
    };

    this.watchId = Geolocation.watchPosition(
      (position) => this.onLocationUpdate(position),
      (error) => this.onLocationError(error),
      options,
    );

    this.isActive = true;
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isActive = false;
  }

  private onLocationUpdate = (position: any): void => {
    const coords = position.coords;
    const {latitude, longitude, speed, altitude, accuracy} = coords;
    const timestamp = (coords as any).timestamp ?? Date.now();

    const point: GPSPoint = {
      lat: latitude,
      lng: longitude,
      speed: speed ? speed * 3.6 : undefined,
      altitude: altitude ?? undefined,
      accuracy,
      timestamp,
    };

    // Filter by accuracy
    if (accuracy > GPS_CONFIG.ACCURACY_FILTER) {
      return;
    }

     this.lastLocation = point;
   };

   private onLocationError = (error: any): void => {
    console.error('GPS error:', error);
    // Emit error event for UI notification
  };

  // Get last known location
  getLastLocation(): GPSPoint | null {
    return this.lastLocation;
  }

  // One-time location fetch
  async getCurrentLocation(highAccuracy: boolean = true): Promise<GPSPoint> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const coords = position.coords;
          const {latitude, longitude, speed, altitude, accuracy} = coords;
          const timestamp = (coords as any).timestamp ?? Date.now();
          resolve({
            lat: latitude,
            lng: longitude,
            speed: speed ? speed * 3.6 : undefined,
            altitude: altitude ?? undefined,
            accuracy,
            timestamp,
          });
        },
        (error) => reject(error),
        {enableHighAccuracy: highAccuracy, timeout: GPS_CONFIG.TIMEOUT},
      );
    });
  }

  // Check if location services are enabled
  isLocationEnabled(): boolean {
    // Platform-specific check would go here
    return true;
  }

  destroy(): void {
    this.stopTracking();
    this.lastLocation = null;
  }
}

export const GPSService = new GPSServiceClass();
