# การใช้งาน pnpm กับ SandboxEDU

โปรเจคนี้รองรับ **pnpm** เป็น package manager หลัก

---

## ติดตั้ง pnpm

### Windows
```bash
# ใช้ npm
npm install -g pnpm

# หรือใช้ PowerShell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

### macOS/Linux
```bash
# ใช้ npm
npm install -g pnpm

# หรือใช้ curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

---

## การใช้งาน

### 1. ติดตั้ง Dependencies
```bash
pnpm install
```

### 2. รัน Development Server
```bash
pnpm start
```

### 3. รันบน Platform ต่างๆ
```bash
# Android
pnpm android

# iOS
pnpm ios

# Web
pnpm web
```

### 4. Clear Cache และรันใหม่
```bash
pnpm start -c
```

---

## การตั้งค่าที่สำคัญ

### `.npmrc`
โปรเจคมีไฟล์ `.npmrc` ที่ตั้งค่าให้ pnpm ทำงานกับ Expo และ WASM modules:

```ini
node-linker=hoisted
public-hoist-pattern[]=*
shamefully-hoist=true
```

**สำคัญ:** ไฟล์นี้จำเป็นสำหรับการทำงานของ `expo-sqlite` และ native modules อื่นๆ

---

## ปัญหาที่พบบ่อย

### 1. WASM Module Error
**ปัญหา:** `Unable to resolve module ./wa-sqlite/wa-sqlite.wasm`

**วิธีแก้:**
- ตรวจสอบว่ามีไฟล์ `.npmrc` ในโปรเจค
- ลบ `node_modules` และรัน `pnpm install` ใหม่
- ใช้ Development Build แทน Expo Go

```bash
rm -rf node_modules
pnpm install
npx expo start -c
```

### 2. Peer Dependencies Warning
**ปัญหา:** pnpm แสดง warning เกี่ยวกับ peer dependencies

**วิธีแก้:**
- ปกติแล้วไม่ต้องกังวล warning เหล่านี้
- ถ้าต้องการซ่อน warning ให้เพิ่มใน `.npmrc`:
  ```ini
  auto-install-peers=true
  ```

### 3. Metro Bundler Cache
**ปัญหา:** แก้โค้ดแล้วไม่เห็นการเปลี่ยนแปลง

**วิธีแก้:**
```bash
pnpm start -c
```

---

## เปรียบเทียบ pnpm vs npm

| คำสั่ง | npm | pnpm |
|--------|-----|------|
| ติดตั้ง | `npm install` | `pnpm install` |
| เพิ่ม package | `npm install <pkg>` | `pnpm add <pkg>` |
| ลบ package | `npm uninstall <pkg>` | `pnpm remove <pkg>` |
| รัน script | `npm run start` | `pnpm start` |
| Update | `npm update` | `pnpm update` |

---

## ข้อดีของ pnpm

✅ **เร็วกว่า** — ติดตั้ง dependencies เร็วกว่า npm/yarn  
✅ **ประหยัดพื้นที่** — ใช้ hard links แทนการคัดลอกไฟล์  
✅ **Strict** — ป้องกัน phantom dependencies  
✅ **Monorepo** — รองรับ workspace ได้ดี

---

## Development Build (แนะนำ)

สำหรับการใช้งาน native modules เช่น `expo-sqlite`:

```bash
# ติดตั้ง expo-dev-client
pnpm add expo-dev-client

# Build สำหรับ Android
pnpm android

# Build สำหรับ iOS
pnpm ios
```

**หมายเหตุ:** Expo Go ไม่รองรับ custom native modules

---

## สรุป

1. ✅ ติดตั้ง pnpm: `npm install -g pnpm`
2. ✅ Clone โปรเจค
3. ✅ รัน `pnpm install`
4. ✅ รัน `pnpm start`
5. ✅ เปิด Expo Go หรือ Development Build

---

## ติดปัญหา?

- ตรวจสอบว่ามีไฟล์ `.npmrc` ในโปรเจค
- ลอง clear cache: `pnpm start -c`
- ลบ `node_modules` และติดตั้งใหม่: `rm -rf node_modules && pnpm install`
- ใช้ Development Build แทน Expo Go สำหรับ native modules
