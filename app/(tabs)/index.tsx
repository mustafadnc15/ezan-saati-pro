import AdBanner from '@/components/AdBanner';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { usePrayerStore } from '@/store/prayerStore';
import { differenceInSeconds, isAfter } from 'date-fns';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
/* 
  Turkish Prayer Names Mapping
  Aladhan keys: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha
*/
const PRAYER_NAMES_TR: Record<string, string> = {
  Fajr: 'İmsak',
  Sunrise: 'Güneş',
  Dhuhr: 'Öğle',
  Asr: 'İkindi',
  Maghrib: 'Akşam',
  Isha: 'Yatsı',
};

const ORDERED_PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function HomeScreen() {
  const { prayerData, location, loading, error, setLocation, fetchData } = usePrayerStore();
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: string } | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Focus effect to refresh logic if needed
  useFocusEffect(
    React.useCallback(() => {
      // Optional: refresh logic
    }, [])
  );

  // Request Permission & Fetch
  useEffect(() => {
    (async () => {
      // Init notifications
      await registerForPushNotificationsAsync();

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      await fetchData();
    })();
  }, []);

  // Timer Logic
  useEffect(() => {
    if (!prayerData) return;

    const interval = setInterval(() => {
      updateTimer();
    }, 1000);

    updateTimer(); // Initial call

    return () => clearInterval(interval);
  }, [prayerData]);

  // Clean up sound
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  async function playAdhanSound() {
    try {
      // Uncomment this line when you have the file:
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/adhan.wav')
      );
      setSound(sound);
      await sound.playAsync();

      // Stop after 20 seconds (User request: reduce duration)
      setTimeout(async () => {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
      }, 20000);

    } catch (error) {
      console.log("Sound play error", error);
      alert("Ezan sesi çalınamadı: " + (error as any).message);
    }
  }

  const updateTimer = () => {
    if (!prayerData) return;

    const now = new Date();
    const timings = prayerData.timings;

    let foundNext = false;

    for (const p of ORDERED_PRAYERS) {
      const pTime = timings[p as keyof typeof timings];
      const cleanTime = pTime.split(' ')[0];

      const [hours, minutes] = cleanTime.split(':');
      const pDate = new Date();
      pDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (isAfter(pDate, now)) {
        const diff = differenceInSeconds(pDate, now);
        setNextPrayer({
          name: p,
          time: cleanTime,
          remaining: formatSeconds(diff)
        });
        foundNext = true;
        break;
      }
    }

    if (!foundNext) {
      setNextPrayer({
        name: 'Fajr',
        time: timings.Fajr.split(' ')[0],
        remaining: 'Yarın'
      });
    }
  };

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#0f766e', '#1e293b']}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} className="px-6 pt-4">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-gray-300 text-sm font-medium">Konumun</Text>
              <Text className="text-white text-xl font-bold">
                {location ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : 'Konum Bekleniyor...'}
              </Text>
            </View>
            <View>
              <Text className="text-gray-300 text-sm text-right">Hicri</Text>
              <Text className="text-white text-lg font-bold text-right">
                {prayerData?.date.hijri.day} {prayerData?.date.hijri.month.en} {prayerData?.date.hijri.year}
              </Text>
            </View>
          </View>

          <View className="items-center justify-center py-10">
            <Text className="text-teal-200 text-lg font-semibold mb-2">Sıradaki Vakit</Text>
            <Text className="text-white text-5xl font-extrabold tracking-widest">
              {nextPrayer ? PRAYER_NAMES_TR[nextPrayer.name] : '...'}
            </Text>
            <View className="mt-4 bg-white/10 px-6 py-3 rounded-full border border-white/20">
              <Text className="text-3xl text-white font-mono font-bold">
                {nextPrayer?.remaining || '--:--:--'}
              </Text>
            </View>
          </View>

          <View className="flex-1 mt-6">
            {loading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : error ? (
              <Text className="text-red-400 text-center">{error}</Text>
            ) : (
              <View className="bg-white/10 rounded-3xl p-4 border border-white/5 backdrop-blur-md">
                {ORDERED_PRAYERS.map((key) => {
                  const time = prayerData?.timings[key as keyof typeof prayerData.timings]?.split(' ')[0];
                  const isNext = nextPrayer?.name === key;

                  return (
                    <View
                      key={key}
                      className={`flex-row justify-between items-center py-4 px-4 border-b border-white/10 last:border-0 ${isNext ? 'bg-teal-500/20 rounded-xl' : ''}`}
                    >
                      <Text className={`text-lg ${isNext ? 'text-teal-300 font-bold' : 'text-white font-medium'}`}>
                        {PRAYER_NAMES_TR[key]}
                      </Text>
                      <Text className={`text-xl ${isNext ? 'text-teal-300 font-bold' : 'text-gray-200'}`}>
                        {time}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>







          <View className="mb-6">
            <AdBanner />
          </View>

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
