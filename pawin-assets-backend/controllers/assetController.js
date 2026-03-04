// controllers/assetController.js
const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');
const fs = require('fs'); // 1. เพิ่มโมดูลจัดการไฟล์
const path = require('path'); // 2. เพิ่มโมดูลจัดการเส้นทาง

// @desc    ดึงข้อมูลอุปกรณ์ทั้งหมด (พร้อมตรวจสอบไฟล์รูปภาพจริง)
// @route   GET /api/assets
const getAssets = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    // ดึงข้อมูลทั้งหมดเรียงตาม ID ล่าสุดไว้ก่อน
    const [rows] = await connection.query('SELECT * FROM tbl_product ORDER BY ID DESC'); 

    // 3. กำหนดที่อยู่โฟลเดอร์รูปภาพให้ถูกต้อง (ตามโครงสร้างเครื่องคุณ pooh)
    const backendUploadsPath = path.resolve(__dirname, '..', 'uploads');
    const frontendImagesPath = path.resolve(__dirname, '..', '..', 'pawin-assets-frontend', 'public', 'images');

    // 4. วนลูปตรวจสอบไฟล์ทีละรายการก่อนส่งกลับ
    const assetsWithFileCheck = rows.map(item => {
      let hasRealFile = false;

      if (item.img && !['', 'null', '-', '/', 'undefined', 'no-image'].includes(String(item.img).trim().toLowerCase())) {
        const fileName = path.basename(item.img);
        const existsInImages = fs.existsSync(path.join(frontendImagesPath, fileName));
        const existsInUploads = fs.existsSync(path.join(backendUploadsPath, fileName));

        if (existsInImages || existsInUploads) {
          hasRealFile = true;
        }
      }

      // ส่ง Object เดิมกลับไป พร้อมเพิ่มสถานะ fileExists
      return { ...item, fileExists: hasRealFile };
    });

    res.json(assetsWithFileCheck);
  } finally {
    if (connection) connection.release(); 
  }
});

// -----------------------------------------------------------------------------------

// @desc    เพิ่มอุปกรณ์ใหม่เข้าระบบ (สำหรับ Admin)
// @route   POST /api/assets
const createAsset = asyncHandler(async (req, res) => {
  const { 
    electotronixPN, value, description, category, 
    subcategory, quantity, manufacture, position, footprint, img,
    is_longterm // 🚀 1. รับค่าสวิตช์จากหน้าบ้าน
  } = req.body;

  // ตรวจสอบข้อมูลจำเป็น
  if (!electotronixPN || !category || quantity == null) {
    res.status(400);
    throw new Error('กรุณากรอกข้อมูล (P/N, หมวดหมู่ และจำนวน) ให้ครบถ้วน');
  }

  const connection = await connectToDatabase();
  try {
    // เช็ค P/N ซ้ำ
    const [existingAsset] = await connection.query('SELECT * FROM tbl_product WHERE electotronixPN = ?', [electotronixPN]);
    if (existingAsset.length > 0) {
      res.status(400);
      throw new Error('อุปกรณ์ P/N นี้มีอยู่ในระบบแล้ว');
    }

    // ปรับแต่ง Path รูปภาพให้เป็นมาตรฐานเว็บ (Forward Slash)
    let formattedImgPath = img ? img.replace(/\\/g, '/') : '';
    if (formattedImgPath && !formattedImgPath.startsWith('/')) {
      formattedImgPath = '/' + formattedImgPath;
    }

    // 🚀 2. บันทึกลงฐานข้อมูล (เพิ่ม is_longterm โดยแปลงเป็น 1 หรือ 0)
    const [result] = await connection.query(
      `INSERT INTO tbl_product 
      (electotronixPN, value, description, category, subcategory, quantity, manufacture, position, footprint, img, is_longterm) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        electotronixPN, value || '-', description || '-', category, 
        subcategory || '-', quantity, manufacture || '-', position || '-', footprint || '-', formattedImgPath,
        is_longterm ? 1 : 0
      ]
    );

    res.status(201).json({ message: 'เพิ่มอุปกรณ์ใหม่เรียบร้อยแล้ว!', id: result.insertId });
  } finally {
    if (connection) connection.release(); 
  }
});

// -----------------------------------------------------------------------------------

// @desc    แก้ไขข้อมูลอุปกรณ์ (Update Asset)
// @route   PUT /api/assets/:id
const updateAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    electotronixPN, value, description, category, 
    subcategory, quantity, manufacture, position, footprint, img,
    is_longterm // 🚀 รับค่าแก้ไขสวิตช์จากหน้าบ้าน
  } = req.body;

  const connection = await connectToDatabase();
  try {
    let formattedImgPath = img ? img.replace(/\\/g, '/') : '';
    if (formattedImgPath && !formattedImgPath.startsWith('/')) {
      formattedImgPath = '/' + formattedImgPath;
    }

    // 🚀 อัปเดตข้อมูลรวมถึง is_longterm
    await connection.query(
      `UPDATE tbl_product 
       SET electotronixPN=?, value=?, description=?, category=?, subcategory=?, 
           quantity=?, manufacture=?, position=?, footprint=?, img=?, is_longterm=?
       WHERE ID=?`,
      [
        electotronixPN, value || '-', description || '-', category, 
        subcategory || '-', quantity, manufacture || '-', position || '-', footprint || '-', formattedImgPath,
        is_longterm ? 1 : 0, id
      ]
    );

    res.json({ message: 'อัปเดตข้อมูลอุปกรณ์สำเร็จ' });
  } finally {
    if (connection) connection.release(); 
  }
});

// -----------------------------------------------------------------------------------

// @desc    ลบอุปกรณ์ (Delete Asset)
// @route   DELETE /api/assets/:id
const deleteAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const connection = await connectToDatabase();
  try {
    await connection.query('DELETE FROM tbl_product WHERE ID = ?', [id]);
    res.json({ message: 'ลบอุปกรณ์ออกจากระบบสำเร็จ' });
  } finally {
    if (connection) connection.release(); 
  }
});

// 🚀 อย่าลืมส่งออกฟังก์ชัน Update และ Delete ไปให้ Routes ใช้ด้วย
module.exports = { 
  getAssets, 
  createAsset, 
  updateAsset, 
  deleteAsset 
};