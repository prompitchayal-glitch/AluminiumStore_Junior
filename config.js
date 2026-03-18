// config.ts

// ❗ สำหรับ development บนเครื่องเดียวกัน ใช้ localhost
// ❗ สำหรับ development บน device/emulator ใช้ IP ที่ถูกต้องของเครื่อง
export const API_URL = "http://localhost:3000/api";

// ถ้าต้องใช้ IP แทน ให้เปลี่ยนไปใช้:
// export const API_URL = "http://192.168.1.x:3000/api";  // ให้เปลี่ยน 192.168.1.x ให้เป็น IP ของเครื่องที่รัน backend
// export const API_URL = "http://10.0.2.2:3000/api";    // สำหรับ Android Emulator
// export const API_URL = "http://127.0.0.1:3000/api";   // สำหรับ localhost (ไม่ได้ผลกับ emulator)

