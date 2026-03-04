// utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  // สร้าง Token จาก ID และรหัสลับใน .env
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // ให้ Token มีอายุ 30 วัน
  });
};

module.exports = generateToken;