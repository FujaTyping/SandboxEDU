# SandboxEDU 📚

แพลตฟอร์มการเรียนรู้ออนไลน์สำหรับนักเรียนระดับมัธยมศึกษา รองรับการดูวิดีโอบทเรียน ทำแบบทดสอบที่สร้างโดย AI วิเคราะห์ทักษะ และดูเนื้อหาแบบออฟไลน์

---

## ฟีเจอร์หลัก

### 🎬 วิดีโอบทเรียน
- ดูวิดีโอบทเรียนออนไลน์ พร้อมบันทึกความคืบหน้าอัตโนมัติ
- รองรับการดูแบบ fullscreen และหมุนจอแนวนอน
- ดาวน์โหลดวิดีโอเพื่อดูแบบออฟไลน์ได้

### 📝 แบบทดสอบ AI
- ระบบสร้างข้อสอบอัตโนมัติจาก AI แยกตามระดับความยาก (ง่าย / ปานกลาง / ยาก)
- มีคำใบ้และคำอธิบายเฉลยรายข้อ
- บันทึกประวัติผลการสอบพร้อมกราฟแสดงพัฒนาการ

### 📊 วิเคราะห์ทักษะ
- วิเคราะห์จุดแข็ง-จุดอ่อนของผู้เรียนจากประวัติการทำแบบทดสอบ
- แสดงผลเป็น Radar Chart แยกตามวิชา

### 📥 Offline Mode
- ดาวน์โหลดวิดีโอบทเรียนเพื่อดูโดยไม่ต้องต่ออินเทอร์เน็ต
- แสดง banner แจ้งเตือนเมื่ออยู่ในโหมดออฟไลน์
- Cache ข้อมูลโปรไฟล์และความคืบหน้าไว้ใน local storage

### 🔄 ซิงค์ข้อมูล
- ซิงค์ความคืบหน้าการดูวิดีโอและประวัติแบบทดสอบข้ามอุปกรณ์
- กดปุ่ม "ซิงค์ข้อมูล" ในหน้าตั้งค่าเพื่อ sync กับ server

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router (file-based routing) |
| Auth | Supabase Auth + JWT custom token |
| UI | NativeWind (TailwindCSS) + Lucide icons |
| Video | expo-video v3 |
| Storage | AsyncStorage + expo-file-system |
| Charts | react-native-svg (Radar Chart, Line Chart) |
| Math | react-native-mathjax |

---

## การติดตั้งและรันโปรเจกต์

### ข้อกำหนด
- Node.js 18 ขึ้นไป
- npm
- Expo Go (สำหรับทดสอบบนอุปกรณ์จริง) หรือ Android/iOS Simulator

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=https://your-api-server.com
```

| ตัวแปร | คำอธิบาย |
|--------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL ของ Supabase project |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key จาก Supabase dashboard |
| `EXPO_PUBLIC_API_BASE_URL` | URL ของ backend API (Elysia) |

### 3. รันแอพ

```bash
# Development (Expo Go)
npx expo start

# Android (Development Build)
npm run android

# iOS (Development Build)
npm run ios
```

สแกน QR Code ที่แสดงในเทอร์มินัลด้วยแอพ **Expo Go** บนอุปกรณ์ของคุณ

---

## โครงสร้างโปรเจกต์

```
app/
├── (tabs)/
│   ├── index.tsx        # หน้า Home — สถิติ, ทักษะ, Quick Actions
│   ├── explore.tsx      # หน้าสำรวจ — บทเรียนและแบบทดสอบ
│   └── settings.tsx     # หน้าตั้งค่า — โปรไฟล์, ซิงค์, ออกจากระบบ
├── video/[id].tsx       # หน้าดูวิดีโอบทเรียนและทำแบบทดสอบ
├── exam/[id].tsx        # หน้าสอบแบบทดสอบ (full screen)
├── login.tsx            # หน้าเข้าสู่ระบบ
├── register.tsx         # หน้าสมัครสมาชิก
└── profile-edit.tsx     # หน้าแก้ไขโปรไฟล์

lib/
├── auth/                # JWT refresh, token management
├── cache/               # User profile cache
├── offline/             # Download manager
├── progress/            # Video progress, quiz history
└── sync/                # Cross-device sync manager
```

---

## การใช้งานแอพ

### สมัครสมาชิก
1. เปิดแอพ → กด **สมัครสมาชิก**
2. กรอกอีเมลและรหัสผ่าน
3. ยืนยัน OTP จากอีเมล
4. กรอกข้อมูลโปรไฟล์ (ชื่อ, ชั้น, ห้อง)

### ดูบทเรียน
1. ไปที่แท็บ **สำรวจ** → เลือก **บทเรียน**
2. กดคอร์สที่ต้องการ → กด **ลงทะเบียน**
3. กด **เริ่มเรียน** เพื่อดูวิดีโอ
4. กด **เรียนจบ** เมื่อดูครบ

### ทำแบบทดสอบ
1. ไปที่แท็บ **สำรวจ** → เลือก **แบบทดสอบ**
2. เลือกคอร์ส → เลือกระดับความยาก
3. กด **เริ่มทำแบบทดสอบ**
4. ตอบคำถาม — กด 💡 เพื่อดูคำใบ้ก่อนตอบ

### ดาวน์โหลดวิดีโอ (Offline)
1. เปิดหน้าบทเรียน → กดปุ่ม **ดาวน์โหลด**
2. รอจนดาวน์โหลดเสร็จ
3. ดูได้โดยไม่ต้องต่ออินเทอร์เน็ต

### วิเคราะห์ทักษะ
1. ไปที่แท็บ **Home**
2. เลื่อนลงมาที่ส่วน **ทักษะของฉัน**
3. กดปุ่ม **วิเคราะห์ทักษะ**

### ซิงค์ข้อมูลข้ามอุปกรณ์
1. ไปที่แท็บ **ตั้งค่า**
2. กด **ซิงค์ข้อมูล**

---


## License

Private — All rights reserved.
