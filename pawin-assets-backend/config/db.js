// src/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

// 🚀 สร้าง "สระน้ำเชื่อมต่อ" เตรียมไว้เลย 50 ท่อ
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pawin_tech', // 👈 ชี้ไปที่ฐานข้อมูลจริงของคุณ pooh
  waitForConnections: true,
  connectionLimit: 50, // รองรับ 50 คนพร้อมกันสบายๆ
  queueLimit: 0
});

// ฟังก์ชันสำหรับดึงท่อมาใช้งาน
const connectToDatabase = async () => {
  return await pool.getConnection();
};

module.exports = connectToDatabase;