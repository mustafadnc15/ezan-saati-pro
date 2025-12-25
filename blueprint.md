Harika bir tercih. React Native, özellikle Expo ekosistemi ile birleştiğinde, geliştirme hızını inanılmaz artırır. Native modül bağlama dertleriyle uğraşmadan, sensörlere (pusula) ve konuma (GPS) erişmek Expo SDK ile çok kolaydır.

İşte "Ezan Vakti Pro" klonu için React Native + Expo odaklı revize edilmiş plan ve prompt:

1. Expo Teknoloji Yığını (Tech Stack)
Flutter'daki paketlerin Expo dünyasındaki karşılıkları şunlardır:

Core: React Native (Expo Managed Workflow), TypeScript.

Routing: expo-router (Dosya tabanlı yönlendirme, modern standart).

State Management: Zustand (Redux'a göre çok daha hafif ve hızlı) veya React Context.

Styling: NativeWind (Tailwind CSS'in React Native versiyonu - hızlı UI için ideal).

Veri Saklama: react-native-async-storage/async-storage (Vakitleri cache'lemek için).

API: Axios veya yerleşik Fetch API.

Kritik Expo Kütüphaneleri:

📍 Konum: expo-location

🔔 Bildirim: expo-notifications (Ezan alarmları için)

🧭 Pusula: expo-sensors (Magnetometer modülü)

🎨 Gradientler: expo-linear-gradient (O mistik gökyüzü arka planları için)

🗺️ Harita: react-native-maps

2. Geliştirme Blueprint'i (Adım Adım)
Faz 1: Kurulum ve Temel Veri
Expo projesini npx create-expo-app@latest ile kur (TypeScript seç).

expo-location ile kullanıcıdan izin al ve koordinatları çek.

Bu koordinatları Aladhan API'ye gönderip aylık namaz vakitlerini çek.

Veriyi AsyncStorage'a kaydet (Böylece kullanıcı interneti kapatsa da vakitleri görür).

Faz 2: Zamanlayıcı ve Mantık
Anlık saati (new Date()) API'den gelen vakitlerle kıyaslayan bir useNextPrayer hook'u yaz.

Geri sayım sayacını (Countdown) oluştur.

Vakit girdiğinde (Örn: İftar/Akşam) tetiklenecek görsel değişimleri ayarla.

Faz 3: Bildirim Sistemi (En Kritik Kısım)
expo-notifications kullanarak yerel bildirimleri planla (Scheduling).

Önemli: iOS ve Android izinlerini app.json içinde doğru yapılandır.

Faz 4: Kıble ve UI
expo-sensors kullanarak telefonun dönüş açısını al.

Kullanıcının koordinatları ile Kabe'nin koordinatları arasındaki açıyı hesaplayan matematiksel formülü (Haversine formülü türevi) entegre et.