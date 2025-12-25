import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { fetchPrayerTimes, PrayerData } from '../services/api';

interface Coords {
    latitude: number;
    longitude: number;
}

interface PrayerState {
    prayerData: PrayerData | null;
    location: Coords | null;
    qiblaAngle: number;
    loading: boolean;
    error: string | null;

    setLocation: (coords: Coords) => void;
    fetchData: () => Promise<void>;
    calculateQiblaAngle: (coords: Coords) => number;
}

const MECCA_COORDS = {
    latitude: 21.4225,
    longitude: 39.8262,
};

export const usePrayerStore = create<PrayerState>()(
    persist(
        (set, get) => ({
            prayerData: null,
            location: null,
            qiblaAngle: 0,
            loading: false,
            error: null,

            calculateQiblaAngle: (coords: Coords) => {
                const phiK = (MECCA_COORDS.latitude * Math.PI) / 180.0;
                const lambdaK = (MECCA_COORDS.longitude * Math.PI) / 180.0;
                const phi = (coords.latitude * Math.PI) / 180.0;
                const lambda = (coords.longitude * Math.PI) / 180.0;
                const psi = (180.0 / Math.PI) * Math.atan2(
                    Math.sin(lambdaK - lambda),
                    Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
                );
                return Math.round(psi);
            },

            setLocation: (coords: Coords) => {
                const angle = get().calculateQiblaAngle(coords);
                set({ location: coords, qiblaAngle: angle });
                // Auto fetch if data is stale or missing? Logic handled in component or here.
                // For now, just set location.
            },

            fetchData: async () => {
                const { location } = get();
                if (!location) {
                    set({ error: 'Konum izni verilmedi veya alınamadı.' });
                    return;
                }

                set({ loading: true, error: null });
                try {
                    const data = await fetchPrayerTimes(location.latitude, location.longitude);
                    set({ prayerData: data, loading: false });
                } catch (err: any) {
                    set({ error: err.message || 'Veri alınamadı', loading: false });
                }
            },
        }),
        {
            name: 'prayer-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
