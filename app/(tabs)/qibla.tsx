import AdBanner from '@/components/AdBanner';
import { usePrayerStore } from '@/store/prayerStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Magnetometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;


export default function QiblaScreen() {
    const { qiblaAngle, location } = usePrayerStore();
    const [subscription, setSubscription] = useState<any>(null);
    const [magnetometer, setMagnetometer] = useState(0);

    // Shared values for smooth animation
    const heading = useSharedValue(0);

    useEffect(() => {
        _subscribe();
        return () => _unsubscribe();
    }, []);

    useEffect(() => {
        // qiblaAngle is the angle from True North.
        // Magnetometer gives us degree from North (0 to 360).
        // If phone points North (0), Compass image should be 0.
        // If phone points East (90), Compass image should rotate -90 to keep N pointing Up? 
        // No, in a digital compass:
        // 'N' on the screen should behave like a real compass needle. 
        // If I turn right (East), the 'N' needle should swing left (relative to phone).

        // Let's assume the Compass Rose image has 'N' at the top.
        // We rotate the image by -magnetometer.

        // Smooth animation
        heading.value = withSpring(-magnetometer, {
            damping: 20,
            stiffness: 90,
        });

    }, [magnetometer]);

    const _subscribe = () => {
        // 100ms update
        Magnetometer.setUpdateInterval(100);
        setSubscription(
            Magnetometer.addListener((data) => {
                setMagnetometer(_angle(data));
            })
        );
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    const _angle = (magnetometer: any) => {
        let angle = 0;
        if (magnetometer) {
            let { x, y } = magnetometer;
            // atan2(y, x) gives radians.
            if (Math.atan2(y, x) >= 0) {
                angle = Math.atan2(y, x) * (180 / Math.PI);
            } else {
                angle = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
            }
        }
        // Adjustment might be needed based on device orientation (portrait)
        return Math.round(angle - 90 >= 0 ? angle - 90 : angle + 271);
    };

    const animatedCompassStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${heading.value}deg` }],
        };
    });

    const qiblaPointerStyle = useAnimatedStyle(() => {
        // The compass rose rotates to point North (-mag).
        // The Qibla arrow should point to Qibla Angle relative to the Compass Rose.
        // So if Compass Rose is at 0 (North), Qibla Arrow should be at `qiblaAngle`.
        // Since the Compass Rose Container is rotating, we just need to place the arrow IN it 
        // at the fixed Qibla angle, OR place it outside?

        // Approach:
        // Rotate the entire 'Compass Rose' container toward North.
        // Inside that container, 'N' is at 0.
        // We place the Qibla marker at `qiblaAngle`.
        return {
            transform: [{ rotate: `${qiblaAngle}deg` }],
        };
    });

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#0f766e', '#1e293b']}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
                <View className="items-center mb-10">
                    <Text className="text-white text-3xl font-bold mb-2">Kıble Pusulası</Text>
                    <Text className="text-gray-300">
                        {location ? `Kıble Açısı: ${qiblaAngle}°` : 'Konum alınıyor...'}
                    </Text>
                </View>

                {/* Compass Container */}
                <View className="items-center justify-center" style={{ width: COMPASS_SIZE, height: COMPASS_SIZE }}>

                    {/* Tick Mark Logic (Static, indicating 'phone forward') */}
                    <View className="absolute -top-8 z-10 p-2 bg-yellow-500 rounded-full border-2 border-white shadow-lg shadow-yellow-500/50">
                        <FontAwesome name="chevron-up" size={20} color="white" />
                    </View>

                    {/* Rotating Compass Board */}
                    <Animated.View
                        style={[
                            {
                                width: '100%',
                                height: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: COMPASS_SIZE / 2,
                                borderWidth: 4,
                                borderColor: 'rgba(255,255,255,0.1)',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                            },
                            animatedCompassStyle
                        ]}
                    >
                        {/* Cardinal Points */}
                        <View className="absolute top-2"><Text className="text-red-500 font-bold text-xl">N</Text></View>
                        <View className="absolute bottom-2"><Text className="text-white font-bold text-xl">S</Text></View>
                        <View className="absolute right-4"><Text className="text-white font-bold text-xl">E</Text></View>
                        <View className="absolute left-4"><Text className="text-white font-bold text-xl">W</Text></View>

                        {/* Inner Details/Ticks could go here */}
                        <View className="w-2 h-2 bg-white rounded-full absolute" />

                        {/* Qibla Indicator (Attached to the Compass Card!) */}
                        <Animated.View
                            style={[
                                {
                                    position: 'absolute',
                                    width: COMPASS_SIZE,
                                    height: COMPASS_SIZE,
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                },
                                qiblaPointerStyle
                            ]}
                        >
                            {/* The Pointer itself */}
                            <View className="mt-8 items-center">
                                <View className="w-1 h-3 bg-teal-400" />
                                <View className="p-2 bg-teal-500/20 rounded-full">
                                    <FontAwesome name="star" size={24} color="#2dd4bf" />
                                </View>
                                <Text className="text-teal-300 text-xs font-bold mt-1">Kıble</Text>
                            </View>
                        </Animated.View>

                    </Animated.View>
                </View>

                <View className="mt-10 px-8 mb-4">
                    <Text className="text-gray-400 text-center text-sm">
                        Telefonunuzu yere paralel tutarak çevirin.
                        Ok işareti Kabe yönünü göstermektedir.
                    </Text>
                </View>

                <View className="absolute bottom-4">
                    <AdBanner />
                </View>

            </LinearGradient>
        </View>
    );
}
