const express = require('express');
const router = express.Router();

// 🚀 1. เพิ่มการนำเข้าฟังก์ชัน updateAsset และ deleteAsset เข้ามาด้วย
const { getAssets, createAsset, updateAsset, deleteAsset } = require('../controllers/assetController');

// Route สำหรับดึงข้อมูล (GET)
router.get('/', getAssets);

// Route สำหรับให้ Admin ส่งข้อมูลมาบันทึก (POST)
router.post('/', createAsset);

// 🚀 2. เพิ่ม Route สำหรับแก้ไข (PUT) และ ลบ (DELETE) โดยต้องระบุ ID ของอุปกรณ์ด้วย
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

module.exports = router;