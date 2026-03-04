// src/routes/borrowRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// 1. ดึงฟังก์ชันมาจาก Controller
const { 
  createBorrowRecord, 
  approveBorrow,          
  rejectBorrow,           
  getAllPendingBorrows,   
  getMyBorrowHistory, 
  requestReturn, 
  approveReturn, 
  rejectReturn, 
  getAllPendingReturns 
} = require('../controllers/borrowController');

// 2. ตั้งค่า Multer สำหรับอัปโหลดรูปตอนคืนของ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, 'return-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 3. เส้นทาง API (🚀 วางลำดับเจาะจงไว้บนสุด ป้องกัน Error 404)

// --- 📦 ส่วนของการดึงข้อมูล (GET) ต้องอยู่ด้านบน ---
router.get('/pending', getAllPendingReturns);                 // Admin: ดูรอคืน
router.get('/pending-borrows', getAllPendingBorrows);         // Admin: ดูรอเบิก
router.get('/my-history', getMyBorrowHistory);                // User: ดูประวัติ

// --- 📦 ส่วนของการสร้าง/แก้ไข (POST/PUT) ---
router.post('/', createBorrowRecord);                         // User: ส่งคำขอเบิก
router.post('/:id/return', upload.single('return_image'), requestReturn); // User: ส่งรูปคืน

// Admin Action (Borrow)
router.put('/:id/approve-borrow', approveBorrow);             // Admin: อนุมัติเบิก
router.put('/:id/reject-borrow', rejectBorrow);               // Admin: ปฏิเสธเบิก

// Admin Action (Return)
router.put('/:id/approve', approveReturn);                    // Admin: อนุมัติคืน
router.put('/:id/reject', rejectReturn);                      // Admin: ปฏิเสธคืน

module.exports = router;