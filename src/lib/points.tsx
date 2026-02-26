// src/lib/points.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "eco_points_v1";

type PointsCtx = {
  points: number;
  isReady: boolean;
  addPoints: (delta: number) => Promise<void>;
  spendPoints: (cost: number) => Promise<boolean>; 
  setPoints: (value: number) => Promise<void>;
};

const PointsContext = createContext<PointsCtx | null>(null);

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const [points, setPointsState] = useState(0);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw != null) setPointsState(Number(raw) || 0);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = async (v: number) => {
    setPointsState(v);
    await AsyncStorage.setItem(STORAGE_KEY, String(v));
  };

  const value = useMemo<PointsCtx>(
    () => ({
      points,
      isReady,
      addPoints: async (delta) => {
        if (!Number.isFinite(delta)) return;
        const next = Math.max(0, points + Math.floor(delta));
        await persist(next);
      },
      spendPoints: async (cost) => {
        cost = Math.floor(cost);
        if (!Number.isFinite(cost) || cost <= 0) return true;
        if (points < cost) return false;
        await persist(points - cost);
        return true;
      },
      setPoints: async (v) => {
        await persist(Math.max(0, Math.floor(v)));
      },
    }),
    [points, isReady]
  );

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>;
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints must be used inside PointsProvider");
  return ctx;
}
