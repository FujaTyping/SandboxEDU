# SandboxEDU API

ระบบ Backend สำหรับ Sandbox.EDU แอปพลิเคชันการเรียนรู้แบบปรับตัวเฉพาะบุคคลที่เน้นการทำงานแบบออฟไลน์เป็นหลัก Offline, API นี้ทำหน้าที่จัดการการซิงก์ข้อมูล, การยืนยันตัวตนผู้ใช้งาน และการส่งมอบเนื้อหาวิดีโอการเรียนการสอน

### เทคโนโลยีที่ใช้ (Tech Stack)

* **Runtime:** [Bun](https://bun.sh/) - รันไทม์ JavaScript ที่มีความเร็วสูงมาก
* **Framework:** [ElysiaJS](https://elysiajs.com/) - เว็บเฟรมเวิร์กที่เร็วและออกแบบมาเพื่อ Bun โดยเฉพาะ
* **Database & Storage:** [Supabase](https://supabase.com/) - ฐานข้อมูล PostgreSQL และระบบ Object Storage สำหรับเก็บไฟล์วิดีโอ
* **Authentication:** JWT (JSON Web Tokens) / Supabase Authentication