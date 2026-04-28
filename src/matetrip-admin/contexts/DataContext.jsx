import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  fetchCollection,
  getAllReceiptsSampled,
} from "../services/firestore";

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const [trips,    setTrips]    = useState([]);
  const [users,    setUsers]    = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [push,     setPush]     = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, u, p] = await Promise.all([
      fetchCollection("trips"),
      fetchCollection("usernames"),
      fetchCollection("pushSubscriptions"),
    ]);
    setTrips(t);
    setUsers(u);
    setPush(p);
    // Load receipts in background
    getAllReceiptsSampled(t).then(setReceipts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeTrip = id => {
    setTrips(prev => prev.filter(t => t.id !== id));
    setReceipts(prev => prev.filter(r => r.tripId !== id));
  };

  const removePush = id => setPush(prev => prev.filter(p => p.id !== id));

  return (
    <DataContext.Provider value={{
      trips, users, receipts, push,
      loading, reload: load,
      removeTrip, removePush,
    }}>
      {children}
    </DataContext.Provider>
  );
}
