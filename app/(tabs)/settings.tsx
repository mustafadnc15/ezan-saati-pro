import { SoundType, useSettingsStore } from '@/store/settingsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/*
  Since we don't have direct access to 'scheduleDailyPrayers' from here efficiently without passing data,
  we might need to export the scheduling logic or trigger it. 
  For now, we'll just update the store. The scheduling logic should ideally react to store changes 
  or be called explicitly. We'll verify this linkage.
*/
import { registerForPushNotificationsAsync } from '@/services/notifications';

export default function SettingsScreen() {
    const { notificationSound, setNotificationSound } = useSettingsStore();

    const handleSoundChange = async (sound: SoundType) => {
        setNotificationSound(sound);
        // Re-register channels and potentially reschedule
        await registerForPushNotificationsAsync(sound);
        // Note: Actual rescheduling of notifications needs prayer times. 
        // Ideally we'd trigger a reschedule here if we had the data.
    };

    const options: { label: string; value: SoundType }[] = [
        { label: 'Varsayılan (Cihaz Sesi)', value: 'default' },
        { label: 'Ezan Sesi', value: 'adhan' },
        { label: 'Bismillah', value: 'bismillah' },
    ];

    return (
        <View className="flex-1 bg-gray-900">
            <SafeAreaView className="flex-1 px-6 pt-4">
                <Text className="text-white text-3xl font-bold mb-8">Ayarlar</Text>

                <View className="mb-8">
                    <Text className="text-teal-400 text-lg font-semibold mb-4 border-b border-teal-500/30 pb-2">
                        Bildirim Sesi
                    </Text>

                    <View className="bg-white/10 rounded-xl overflow-hidden">
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => handleSoundChange(option.value)}
                                className={`flex-row items-center justify-between p-4 border-b border-white/5 ${index === options.length - 1 ? 'border-b-0' : ''}`}
                            >
                                <View className="flex-row items-center">
                                    <FontAwesome
                                        name={option.value === 'default' ? 'bell-o' : 'volume-up'}
                                        size={20}
                                        color="#e2e8f0"
                                        style={{ width: 30 }}
                                    />
                                    <Text className="text-white text-base font-medium ml-2">{option.label}</Text>
                                </View>

                                {notificationSound === option.value && (
                                    <FontAwesome name="check-circle" size={20} color="#2dd4bf" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text className="text-gray-500 text-xs mt-2 ml-1">
                        * Bildirim sesi değişikliği için bildirim izni gereklidir.
                    </Text>
                </View>

                {/* Other Settings placeholders */}
                <View>
                    <Text className="text-teal-400 text-lg font-semibold mb-4 border-b border-teal-500/30 pb-2">
                        Uygulama
                    </Text>
                    <View className="bg-white/10 rounded-xl p-4">
                        <Text className="text-gray-300">Versiyon 1.0.0</Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
