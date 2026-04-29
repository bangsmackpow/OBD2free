import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { DataLogger } from "../services/DataLogger";
import { OBD2Service } from "../services/OBD2Service";
import { GPSService } from "../services/GPSService";
import {
  User,
  Vehicle,
  LoggingSession,
  PremiumStatus,
  GPSPoint,
} from "../types";
import { STORAGE_KEYS } from "../constants";

interface SessionContextType {
  user: User | null;
  currentSession: LoggingSession | null;
  vehicles: Vehicle[];
  sessions: LoggingSession[];
  isPremium: boolean;
  startSession: (vehicleId: string) => Promise<string>;
  stopSession: () => Promise<LoggingSession | null>;
  updateGPS: (point: GPSPoint) => void;
  addVehicle: (vehicle: Vehicle) => void;
  setPremiumStatus: (status: PremiumStatus, expiry?: number) => void;
  checkPremiumAccess: () => boolean;
  uploadSession: (sessionId: string) => Promise<boolean>;
  getSessionById: (id: string) => LoggingSession | undefined;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<LoggingSession | null>(
    null,
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sessions, setSessions] = useState<LoggingSession[]>([]);

  // Load persisted data on mount
  useEffect(() => {
    loadUserData();
    loadVehicles();
    loadSessions();

    return () => {
      // Cleanup
    };
  }, []);

  const loadUserData = () => {
    try {
      // In real app, this would restore from secure storage + API
      const defaultUser: User = {
        id: "user_001",
        email: "user@example.com",
        premiumStatus: PremiumStatus.FREE,
        vehicles: [],
      };
      setUser(defaultUser);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const loadVehicles = () => {
    // Load from storage
    const saved = DataLogger["storage"]?.getString("vehicles");
    if (saved) {
      setVehicles(JSON.parse(saved));
    }
  };

  const loadSessions = () => {
    const allSessions = DataLogger.getSessions();
    setSessions(allSessions);
  };

  const startSession = async (vehicleId: string): Promise<string> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check connection
    if (!OBD2Service.getIsConnected()) {
      throw new Error("OBD2 device not connected");
    }

    // Start GPS tracking
    await GPSService.startTracking(true); // high accuracy during trips

    // Start data logger
    const sessionId = await DataLogger.startSession(vehicleId, user.id);
    const session = DataLogger.getCurrentSession();

    setCurrentSession(session);
    loadSessions(); // Refresh sessions list

    return sessionId;
  };

  const stopSession = async (): Promise<LoggingSession | null> => {
    if (!currentSession) return null;

    // Stop OBD2 polling
    OBD2Service.stopPolling();

    // Stop GPS tracking
    GPSService.stopTracking();

    // Stop data logger
    const completed = await DataLogger.stopSession();

    if (completed) {
      setCurrentSession(null);
      loadSessions();
    }
    return completed;
  };

  const updateGPS = (point: GPSPoint) => {
    DataLogger.updateGPS(point);
  };

  const addVehicle = (vehicle: Vehicle) => {
    const updated = [...vehicles, vehicle];
    setVehicles(updated);
    DataLogger["storage"]?.set("vehicles", JSON.stringify(updated));
  };

  const setPremiumStatus = (status: PremiumStatus, expiry?: number) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      premiumStatus: status,
      premiumExpiry: expiry,
    };
    setUser(updatedUser);
    // Persist to storage
    DataLogger["storage"]?.set(STORAGE_KEYS.PREMIUM_STATUS, status);
    if (expiry) {
      DataLogger["storage"]?.set(
        STORAGE_KEYS.PREMIUM_EXPIRY,
        expiry.toString(),
      );
    }
  };

  const checkPremiumAccess = (): boolean => {
    if (!user) return false;

    if (user.premiumStatus === PremiumStatus.FREE) return false;
    if (user.premiumStatus === PremiumStatus.LIFETIME) return true;
    if (user.premiumStatus === PremiumStatus.ENTERPRISE) return true;

    // Check expiry for subscription
    if (user.premiumExpiry && user.premiumExpiry > Date.now()) {
      return true;
    }

    return false;
  };

  const uploadSession = async (sessionId: string): Promise<boolean> => {
    // In real implementation, get presigned URL from backend
    // const presignedUrl = await CloudflareAPI.getPresignedUrl(sessionId);
    // return DataLogger.uploadSession(sessionId, presignedUrl);
    console.log(`Upload session ${sessionId} to cloud (not implemented)`);
    return false;
  };

  const getSessionById = (id: string): LoggingSession | undefined => {
    return DataLogger.getSession(id);
  };

  const value: SessionContextType = {
    user,
    currentSession,
    vehicles,
    sessions,
    isPremium: checkPremiumAccess(),
    startSession,
    stopSession,
    updateGPS,
    addVehicle,
    setPremiumStatus,
    checkPremiumAccess,
    uploadSession,
    getSessionById,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
