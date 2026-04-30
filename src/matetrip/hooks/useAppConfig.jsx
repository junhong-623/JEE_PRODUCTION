import { useContext, createContext, useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTrip } from "../contexts/TripContext";

const DEFAULT = {
  ocrEnabled:       false,
  photosEnabled:    false,
  photosMaxPerTrip: 5,
  chatEnabled:      false,
};

const AppConfigContext = createContext(DEFAULT);

export function AppConfigProvider({ children }) {
  const { activeTrip } = useTrip();
  const [config, setConfig] = useState(DEFAULT);

  useEffect(() => {
    if (!activeTrip?.id) {
      setConfig(DEFAULT);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "trips", activeTrip.id),
      (snap) => {
        const features = snap.exists() ? (snap.data().features || {}) : {};
        setConfig({ ...DEFAULT, ...features });
      },
      (err) => {
        console.error("[AppConfig] error:", err);
        setConfig(DEFAULT);
      }
    );

    return unsub;
  }, [activeTrip?.id]);

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
