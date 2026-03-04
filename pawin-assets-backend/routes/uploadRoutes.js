// src/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// ⚙️ 1. ตั้งค่าที่เก็บไฟล์และชื่อไฟล์
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // 📂 โฟลเดอร์ปลายทาง
  },
  filename(req, file, cb) {
    // เปลี่ยนชื่อไฟล์เป็น: image-16453... .jpg
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// 🛡️ 2. ตัวกรอง: รับเฉพาะไฟล์รูปภาพเท่านั้น
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only! (รับเฉพาะไฟล์รูปภาพเท่านั้น)'));
  }
}

// 📦 3. สร้าง Middleware สำหรับอัปโหลด
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาด 5MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

// 🚀 4. เส้นทางรับไฟล์ (POST /api/upload)
// คำว่า 'image' ตรงนี้ ต้องตรงกับที่ Frontend ส่งมา (formData.append('image', file))
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  // ส่ง Path ของรูปกลับไปให้ Frontend เอาไปบันทึกลง Database
  res.json({
    message: 'Image Uploaded Successfully',
    image: `/uploads/${req.file.filename}` 
  });
});

module.exports = router;