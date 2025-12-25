import FontAwesome from '@expo/vector-icons/FontAwesome';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ID Configuration
const INTERSTITIAL_ID_IOS = 'ca-app-pub-7272302945895997/8901229319';
const INTERSTITIAL_ID_ANDROID = 'ca-app-pub-7272302945895997/2695091223';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let InterstitialAd: any;
let AdEventType: any;
let TestIds: any;

if (!isExpoGo) {
    try {
        const mobileAds = require('react-native-google-mobile-ads');
        InterstitialAd = mobileAds.InterstitialAd;
        AdEventType = mobileAds.AdEventType;
        TestIds = mobileAds.TestIds;
    } catch (e) {
        console.warn("AdMob Interstitial load failed:", e);
    }
}

// Select ID
const adUnitId = __DEV__ && !isExpoGo && TestIds
    ? TestIds.INTERSTITIAL
    : Platform.select({ ios: INTERSTITIAL_ID_IOS, android: INTERSTITIAL_ID_ANDROID });

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function AdInterstitial({ visible, onClose }: Props) {
    // --- MOCK LOGIC (Expo Go) OR Fallback ---
    const [mockVisible, setMockVisible] = useState(false);
    const [canClose, setCanClose] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // --- REAL AD LOGIC ---
    useEffect(() => {
        if (!visible) {
            setMockVisible(false);
            return;
        }

        // If Expo Go or AdMob failed to load, show Mock
        if (isExpoGo || !InterstitialAd) {
            setMockVisible(true);
            return;
        }

        // Load Real Ad
        const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });

        const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
            interstitial.show();
        });

        const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            // Ad closed by user
            onClose();
        });

        const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
            console.warn("Interstitial load error:", error);
            // If error, maybe show mock? Or just close? Use Mock for dev feedback.
            setMockVisible(true);
        });

        interstitial.load();

        return () => {
            unsubscribeLoaded();
            unsubscribeClosed();
            unsubscribeError();
        };
    }, [visible]);


    // --- MOCK UI LOGIC ---
    useEffect(() => {
        if (mockVisible) {
            setCanClose(false);
            setCountdown(5);

            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanClose(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [mockVisible]);

    if (!mockVisible) return null; // Real ad handles its own UI (native overlay)

    return (
        <Modal visible={mockVisible} animationType="slide" transparent={false}>
            <SafeAreaView className="flex-1 bg-black items-center justify-between py-10 relative">
                {/* Close Button Area */}
                <View className="w-full items-end px-4">
                    {canClose ? (
                        <TouchableOpacity onPress={onClose} className="bg-white/20 p-2 rounded-full">
                            <FontAwesome name="close" size={24} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-black/50 p-2 rounded-full">
                            <Text className="text-white font-bold">{countdown}</Text>
                        </View>
                    )}
                </View>

                <View className="items-center justify-center">
                    <View className="w-64 h-64 bg-gray-800 items-center justify-center rounded-xl mb-6">
                        <FontAwesome name="buysellads" size={80} color="#4b5563" />
                    </View>
                    <Text className="text-white text-2xl font-bold mb-2">Reklam (Geçiş Reklamı)</Text>
                    <Text className="text-gray-400 text-center px-10">
                        {isExpoGo ? "Expo Go - Placeholder" : "AdMob Yüklenemedi - Placeholder"}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-2 px-10 text-center">
                        Bu bir simülasyondur. Gerçek buildda AdMob arayüzü çıkar.
                    </Text>
                </View>

                <View className="mb-10">
                    <Text className="text-gray-600 text-xs">Test Ad Mode</Text>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
