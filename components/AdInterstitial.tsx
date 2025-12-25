import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function AdInterstitial({ visible, onClose }: Props) {
    const [canClose, setCanClose] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (visible) {
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
    }, [visible]);

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
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
                        Bu bir tam ekran reklam placeholder'ıdır.
                        5 saniye sonra kapatılabilir.
                    </Text>
                </View>

                <View className="mb-10">
                    <Text className="text-gray-600 text-xs">Test Ad Mode</Text>
                </View>

            </SafeAreaView>
        </Modal>
    );
}
