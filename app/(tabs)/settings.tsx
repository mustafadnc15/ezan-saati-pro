import { registerForPushNotificationsAsync, scheduleTestNotification } from '@/services/notifications';
import { SoundType, useSettingsStore } from '@/store/settingsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { notificationSound, setNotificationSound } = useSettingsStore();
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const playPreview = async (type: SoundType) => {
        try {
            // Stop previous sound
            if (sound) {
                await sound.unloadAsync();
            }

            let source;
            switch (type) {
                case 'adhan':
                    source = require('../../assets/sounds/adhan.wav');
                    break;
                case 'bismillah':
                    source = require('../../assets/sounds/bismillah.wav');
                    break;
                case 'default':
                default:
                    setSound(null);
                    return;
            }

            if (source) {
                const { sound: newSound } = await Audio.Sound.createAsync(source);
                setSound(newSound);
                await newSound.playAsync();
            }
        } catch (error) {
            console.log("Error playing preview:", error);
        }
    };

    const handleSoundChange = async (newSound: SoundType) => {
        setNotificationSound(newSound);
        Vibration.vibrate(50); // Feedback
        playPreview(newSound);

        // Re-register channels and potentially reschedule
        await registerForPushNotificationsAsync(newSound);
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

                    <TouchableOpacity
                        onPress={() => scheduleTestNotification()}
                        className="mt-4 bg-teal-500/20 border border-teal-500/50 p-4 rounded-xl flex-row items-center justify-center"
                    >
                        <FontAwesome name="paper-plane" size={16} color="#2dd4bf" style={{ marginRight: 8 }} />
                        <Text className="text-teal-300 font-semibold">Seçili Sesi Test Et (Bildirim Gönder)</Text>
                    </TouchableOpacity>
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
