import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Detect if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Helper to safely get the module. On Android Expo Go, we return null to avoid the crash.
const getNotifications = () => {
    if (Platform.OS === 'android' && isExpoGo) {
        console.warn("Notifications disabled on Android Expo Go to prevent crash.");
        return null;
    }

    try {
        return require('expo-notifications');
    } catch (error) {
        console.warn("expo-notifications could not be loaded", error);
        return null;
    }
};

// Initialize handler only if module exists
const Notifications = getNotifications();

if (Notifications) {
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldShowBanner: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowList: true,
            }),
        });
    } catch (e) {
        console.warn("Failed to set notification handler", e);
    }
}

export async function registerForPushNotificationsAsync() {
    const Notifications = getNotifications();
    if (!Notifications) return false;

    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('adhan-channel', {
                name: 'Ezan Vakti',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                sound: 'default',
            });
        } catch (e) {
            console.warn("Notification Channel creation failed:", e);
        }
    }

    if (Device.isDevice) {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                alert('Bildirim izni verilmedi!');
                return false;
            }
        } catch (e) {
            console.warn("Notification Permission request failed:", e);
            return false;
        }
        return true;
    }
    return true;
}

export async function scheduleTestNotification() {
    const Notifications = getNotifications();
    if (!Notifications) {
        alert("Bildirimler bu cihazda/ortamda (Android Expo Go) desteklenmiyor.");
        return;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Ezan Vakti Test 📢",
                body: "Bu bir test bildirimidir. Ezan okunuyor...",
                sound: 'default',
            },
            trigger: null,
        });
    } catch (e) {
        console.error("Test notification failed:", e);
        alert("Bildirim gönderilemedi. Expo Go kısıtlaması olabilir.");
    }
}

export async function scheduleDailyPrayers(timings: Record<string, string>) {
    const Notifications = getNotifications();
    if (!Notifications) return;

    try {
        await Notifications.cancelAllScheduledNotificationsAsync();

        const prayers = [
            { key: 'Fajr', label: 'İmsak Vakti' },
            { key: 'Sunrise', label: 'Güneş Doğdu' },
            { key: 'Dhuhr', label: 'Öğle Ezanı' },
            { key: 'Asr', label: 'İkindi Ezanı' },
            { key: 'Maghrib', label: 'Akşam Ezanı' },
            { key: 'Isha', label: 'Yatsı Ezanı' },
        ];

        for (const p of prayers) {
            const timeStr = timings[p.key].split(' ')[0];
            const [hour, minute] = timeStr.split(':').map(Number);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: p.label,
                    body: `Ezan vakti geldi: ${timeStr} 🕌`,
                    sound: 'default',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute,
                },
            });
        }
    } catch (e) {
        console.error("Scheduling failed:", e);
    }
}
