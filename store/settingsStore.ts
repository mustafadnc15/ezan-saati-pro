import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SoundType = 'default' | 'adhan' | 'bismillah';

interface SettingsState {
    notificationSound: SoundType;
    setNotificationSound: (sound: SoundType) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            notificationSound: 'default', // Default to device sound
            setNotificationSound: (sound) => set({ notificationSound: sound }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
