import { format } from 'date-fns';

const BASE_URL = 'https://api.aladhan.com/v1';

export interface PrayerTimes {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
}

export interface HijriDate {
    date: string;
    format: string;
    day: string;
    weekday: { en: string; ar: string };
    month: { number: number; en: string; ar: string };
    year: string;
    designation: { abbreviated: string; expanded: string };
}

export interface PrayerData {
    timings: PrayerTimes;
    date: {
        readable: string;
        timestamp: string;
        hijri: HijriDate;
        gregorian: any;
    };
    meta: any;
}

export interface ApiResponse {
    code: number;
    status: string;
    data: PrayerData;
}

export const fetchPrayerTimes = async (latitude: number, longitude: number): Promise<PrayerData> => {
    try {
        const dateStr = format(new Date(), 'dd-MM-yyyy');
        // Method 13: Diyanet İşleri Başkanlığı, Turkey
        const url = `${BASE_URL}/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=13`;

        const response = await fetch(url);
        const json: ApiResponse = await response.json();

        if (json.code !== 200) {
            throw new Error(`API Error: ${json.status}`);
        }

        return json.data;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        throw error;
    }
};
