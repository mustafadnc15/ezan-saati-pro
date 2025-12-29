import { registerForPushNotificationsAsync } from '@/services/notifications';
import { usePrayerStore } from '@/store/prayerStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { differenceInSeconds, format, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
  const { prayerData, location, city, loading, error, setLocation, setCity, fetchData } = usePrayerStore();
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: string } | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Date formatting
  const today = new Date();
  const dateStr = format(today, 'd MMMM EEEE', { locale: tr });

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

      // Get City Name
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const cityName = address.city || address.subregion || address.region || "Bilinmiyor";
          setCity(cityName);
        }
      } catch (e) {
        console.log("Reverse geocode failed", e);
      }

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
        remaining: 'Yarın' // Simplified logic for next day
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
    <View style={{ flex: 1 }} className="bg-gray-900">
      <ImageBackground
        source={require('@/assets/images/main-screen-image.png')}
        style={{ flex: 1 }}
        contentFit="cover"
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* HEADER SECTION */}
          <View className="items-center mt-4 mb-2">
            {/* Location Pill */}
            <BlurView intensity={30} tint="light" className="overflow-hidden rounded-full mb-3 px-4 py-1.5 flex-row items-center border border-white/30">
              <FontAwesome name="map-marker" size={14} color="#0f766e" style={{ marginRight: 6 }} />
              <Text className="text-gray-800 font-bold text-xs uppercase tracking-wider">
                {city ? city.toUpperCase() : (location ? 'KONUM ALINIYOR...' : 'KONUM BEKLENİYOR')}
              </Text>
            </BlurView>

            {/* City Title */}
            <Text className="text-gray-800 text-5xl font-bold tracking-tight mb-2 drop-shadow-sm">
              {city || '...'}
            </Text>

            {/* Date Info */}
            <View className="flex-row items-center mb-4">
              <FontAwesome name="calendar" size={14} color="#4b5563" style={{ marginRight: 6 }} />
              <Text className="text-gray-600 font-medium text-base">
                {dateStr}
              </Text>
            </View>

            {/* Hijri Date Pill */}
            <View className="bg-white/40 px-3 py-1 rounded-lg border border-white/50">
              <Text className="text-gray-700 font-medium text-xs">
                {prayerData ? `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.en} ${prayerData.date.hijri.year}` : '...'}
              </Text>
            </View>
          </View>

          {/* SPACER for Main Visual (Mosque in BG) */}
          <View className="flex-1" />

          {/* FLOATING TIMER CARD */}
          <View className="items-center mb-8 mx-6">
            <BlurView intensity={60} tint="light" className="w-full overflow-hidden rounded-3xl p-6 border border-white/60 items-center shadow-lg">
              <Text className="text-gray-500 font-bold tracking-widest text-xs mb-1 uppercase">
                SIRADAKİ VAKİT: {nextPrayer ? PRAYER_NAMES_TR[nextPrayer.name].toUpperCase() : '...'}
              </Text>

              <View className="flex-row items-center justify-center mt-1">
                <FontAwesome name="clock-o" size={20} color="#0f766e" style={{ marginRight: 8 }} />
                <Text className="text-teal-700 text-4xl font-mono font-bold tracking-wider">
                  {nextPrayer?.remaining || '--:--:--'}
                </Text>
              </View>
            </BlurView>
          </View>

          {/* BOTTOM SHEET / PANEL */}
          <View className="bg-white rounded-t-[36px] pt-6 pb-8 px-6 shadow-2xl h-[35%]">

            {/* Sheet Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <FontAwesome name="clock-o" size={20} color="#0f766e" style={{ marginRight: 8 }} />
                <Text className="text-xl font-bold text-gray-800">Namaz Vakitleri</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/settings')}>
                <FontAwesome name="bell" size={20} color="#4b5563" />
              </TouchableOpacity>
            </View>

            {/* Loading State */}
            {loading && <ActivityIndicator size="small" color="#0f766e" />}
            {error && <Text className="text-red-500 text-center text-sm">{error}</Text>}

            {/* Prayer Times Horizontal Scroll */}
            {!loading && !error && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                {ORDERED_PRAYERS.map((key) => {
                  const time = prayerData?.timings[key as keyof typeof prayerData.timings]?.split(' ')[0];
                  const isNext = nextPrayer?.name === key;

                  return (
                    <View
                      key={key}
                      className={`mr-3 rounded-2xl py-4 px-5 items-center justify-center min-w-[90px] ${isNext ? 'bg-teal-500 shadow-teal-500/30 shadow-lg' : 'bg-gray-50 border border-gray-100'}`}
                    >
                      <Text className={`text-sm mb-1 font-medium ${isNext ? 'text-teal-50' : 'text-gray-400'}`}>
                        {PRAYER_NAMES_TR[key]}
                      </Text>
                      <View className="flex-row items-center">
                        {key === 'Sunrise' ? (
                          <FontAwesome name="sun-o" size={14} color={isNext ? '#fff' : '#f59e0b'} style={{ marginRight: 4 }} />
                        ) : (
                          <FontAwesome name="moon-o" size={14} color={isNext ? '#fff' : '#6b7280'} style={{ marginRight: 4 }} />
                        )}
                        <Text className={`text-lg font-bold ${isNext ? 'text-white' : 'text-gray-800'}`}>
                          {time}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Bottom Actions Row */}
            <View className="flex-row justify-between items-center mt-auto">
              <TouchableOpacity
                className="flex-row items-center bg-gray-100 px-5 py-3 rounded-full"
                onPress={() => router.push('/qibla')}
              >
                <View className="bg-teal-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                  <FontAwesome name="compass" size={12} color="white" />
                </View>
                <Text className="font-bold text-gray-700">Kıble</Text>
              </TouchableOpacity>

              {/* Menu / Settings Button */}
              <TouchableOpacity
                className="bg-gray-800 w-12 h-12 rounded-full items-center justify-center shadow-lg"
                onPress={() => router.push('/settings')}
              >
                <FontAwesome name="th-large" size={18} color="white" />
              </TouchableOpacity>
            </View>

          </View>

        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
