import { usePrayerStore } from '@/store/prayerStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function MosquesScreen() {
    const { location } = usePrayerStore();
    const [mapRegion, setMapRegion] = useState<any>(null);
    const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status !== 'granted') return;

            if (location) {
                setMapRegion({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            } else {
                let loc = await Location.getCurrentPositionAsync({});
                setMapRegion({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        })();
    }, [location]);

    const openExternalMap = () => {
        const query = "camiler";
        const url = Platform.select({
            ios: `maps://?q=${query}`,
            android: `geo:0,0?q=${query}`
        });
        Linking.openURL(url || `https://www.google.com/maps/search/${query}`);
    };

    if (!permissionStatus) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-900">
                <ActivityIndicator size="large" color="#2dd4bf" />
            </View>
        );
    }

    if (permissionStatus !== 'granted') {
        return (
            <View className="flex-1 items-center justify-center bg-gray-900 px-10">
                <FontAwesome name="exclamation-triangle" size={40} color="#f87171" className="mb-4" />
                <Text className="text-white text-center text-lg">Konum izni olmadan camileri gösteremeyiz.</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900 relative">
            {mapRegion ? (
                <MapView
                    style={styles.map}
                    // Use Google Maps on Android (requires key), Default (Apple Maps) on iOS (no key required)
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                    region={mapRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    userInterfaceStyle="dark"
                />
            ) : (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2dd4bf" />
                    <Text className="text-gray-400 mt-2">Harita Yükleniyor...</Text>
                </View>
            )}

            {/* Overlay Controls */}
            <SafeAreaView className="absolute top-0 w-full items-center pointer-events-none">
                <View className="bg-black/60 px-6 py-2 rounded-full mt-2 backdrop-blur-sm pointer-events-auto">
                    <Text className="text-white font-bold">Yakındaki Camiler</Text>
                </View>
            </SafeAreaView>

            {/* Floating Action Button for External Search */}
            <View className="absolute bottom-10 w-full items-center pointer-events-box-none">
                <TouchableOpacity
                    onPress={openExternalMap}
                    className="bg-teal-600 px-6 py-3 rounded-full flex-row items-center shadow-lg"
                    style={{ elevation: 5 }}
                >
                    <FontAwesome name="map-marker" size={20} color="white" style={{ marginRight: 10 }} />
                    <Text className="text-white font-bold">Haritada Ara (Google/Apple)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    map: {
        width: width,
        height: height,
    },
});
