// src/controllers/userController.js

// 🚀 1. ส่วนนำเข้าเครื่องมือต่างๆ ที่จำเป็น (Imports)
const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');
const bcrypt = require('bcryptjs'); // หรือใช้ 'bcrypt' ตามที่คุณ pooh ได้ติดตั้งไว้
const generateToken = require('../utils/generateToken.js');

// ------------------------------------------------------------------

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const connection = await connectToDatabase();
  try {
    // 1. ค้นหา User ด้วย email จากตารางจริง
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    // 2. ตรวจสอบ User และเช็ครหัสผ่านด้วย bcrypt
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        user: {
          _id: user._id,           // ID หลักของตาราง
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          // แปลงค่า 0/1 จาก database เป็น true/false เพื่อให้ frontend ใช้งานง่าย
          isAdmin: user.isAdmin === 1,
          isPCBAdmin: user.isPCBAdmin === 1,
          isStore: user.isStore === 1,
          isStaff: user.isStaff === 1,
        },
        // สร้าง Token โดยอ้างอิงจาก _id
        token: generateToken(user._id), 
      });
    } else {
      res.status(401);
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  } finally {
    // 🚀 อุดรอยรั่วสำคัญ: คืนท่อลงสระ (Pool) เสมอ ไม่ว่าจะ Login ผ่านหรือไม่ก็ตาม
    if (connection) connection.release(); 
  }
});

// ------------------------------------------------------------------
// 🚀 ฟังก์ชันอื่นๆ ที่รอการเขียนโค้ดเพิ่มเติม (ใส่ไว้เพื่อไม่ให้ module.exports พัง)
const getUsers = asyncHandler(async (req, res) => {
  res.send('getUsers function is ready');
});

const getUserById = asyncHandler(async (req, res) => {
  res.send('getUserById function is ready');
});

const registerUser = asyncHandler(async (req, res) => {
  res.send('registerUser function is ready');
});

const updateUser = asyncHandler(async (req, res) => {
  res.send('updateUser function is ready');
});

const forgotPassword = asyncHandler(async (req, res) => {
  res.send('forgotPassword function is ready');
});

const resetPassword = asyncHandler(async (req, res) => {
  res.send('resetPassword function is ready');
});

// ------------------------------------------------------------------

module.exports = {
  getUsers,
  getUserById,
  registerUser,
  updateUser,
  authUser,          // <--- รวมระบบ Login เข้าไปแล้ว
  forgotPassword,
  resetPassword,
};