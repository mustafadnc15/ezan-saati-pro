import Constants, { ExecutionEnvironment } from 'expo-constants';
import React from 'react';
import { Platform, Text, View } from 'react-native';

// Determine if we are in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safe import (though in managed workflow imports are static, we might crash if we just import it in Expo Go)
// Actually, standard imports work but NativeModules will be null.
// We must conditionally render.

let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;

if (!isExpoGo) {
    try {
        const mobileAds = require('react-native-google-mobile-ads');
        BannerAd = mobileAds.BannerAd;
        BannerAdSize = mobileAds.BannerAdSize;
        TestIds = mobileAds.TestIds;
    } catch (e) {
        console.warn("AdMob load failed:", e);
    }
}

// Provided ID
const PRODUCTION_ID_IOS = 'ca-app-pub-7272302945895997/9731272866';
const PRODUCTION_ID_ANDROID = 'ca-app-pub-7272302945895997/8226619509';

// Logic: Use TestIds if in Dev mode OR if you want to force test ads.
// Google AdMob: "Account not approved yet" means real ads won't serve.
// We should fallback to TestIds to prove the code works.

const adUnitId = __DEV__
    ? TestIds?.BANNER
    : Platform.select({ ios: PRODUCTION_ID_IOS, android: PRODUCTION_ID_ANDROID });

export default function AdBanner() {
    if (isExpoGo || !BannerAd) {
        return (
            <View className="items-center justify-center py-2 bg-gray-900 border-t border-gray-800">
                <View className="bg-gray-200" style={{ width: 320, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                    <Text className="text-gray-500 font-bold text-xs">EXPO GO - REKLAM GÖSTERİLEMEZ</Text>
                    <Text className="text-gray-400 text-[10px] text-center px-1">Gerçek reklam için Development Build almalısın.</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="items-center justify-center py-2 bg-gray-900 border-t border-gray-800">
            <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdFailedToLoad={(error: any) => console.error('Ad failed to load: ', error)}
            />
        </View>
    );
}
