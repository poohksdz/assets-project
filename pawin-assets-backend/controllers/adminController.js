// src/controllers/adminController.js
const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');

// ========================================================
// 🚀 ฟังก์ชันคำนวณวันสิ้นเดือน (หลบเสาร์-อาทิตย์ ให้เป็นวันศุกร์)
const getWorkingEndOfMonth = (monthsToAdd = 1) => {
  let date = new Date();
  
  // เลื่อนไปเดือนถัดไป แล้วตั้งวันที่เป็น 0 (จะได้วันสุดท้ายของเดือนที่ต้องการ)
  date.setMonth(date.getMonth() + monthsToAdd + 1);
  date.setDate(0); 

  // เช็ควันในสัปดาห์ (0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์)
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 6) { 
    // ถ้าวันสุดท้ายเป็น "วันเสาร์" ให้ถอยกลับ 1 วัน (เป็นวันศุกร์)
    date.setDate(date.getDate() - 1);
  } else if (dayOfWeek === 0) { 
    // ถ้าวันสุดท้ายเป็น "วันอาทิตย์" ให้ถอยกลับ 2 วัน (เป็นวันศุกร์)
    date.setDate(date.getDate() - 2);
  }

  // ล็อคเวลาเป็น 23:59:59 น. ของวันนั้น
  date.setHours(23, 59, 59, 999);
  return date;
};
// ========================================================

//  1. ดึงภาพรวมสถิติ
const getAdminStats = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [usersData] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [assetsData] = await connection.query('SELECT COUNT(*) as count FROM tbl_product');
    const [borrowedData] = await connection.query("SELECT IFNULL(SUM(quantity), 0) as count FROM tbl_borrow WHERE status IN ('active', 'pending_return')");
    const [penaltiesData] = await connection.query('SELECT IFNULL(SUM(penalty_fee), 0) as total FROM tbl_borrow');
    
    res.json({
      totalUsers: usersData[0].count,
      totalAssets: assetsData[0].count,
      borrowedItems: Number(borrowedData[0].count),
      penalties: Number(penaltiesData[0].total)
    });
  } finally {
    if (connection) connection.release();
  }
});

//  2. ดึงรายชื่อพนักงานทั้งหมด
const getAllUsers = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [users] = await connection.query('SELECT _id, name, email, credit, isAdmin FROM users ORDER BY name ASC');
    res.json(users);
  } finally {
    if (connection) connection.release();
  }
});

// 3. ใหม่: ดึงรายการยืมที่ยังไม่คืนทั้งหมด (Global Deployment Log)
const getAllActiveBorrows = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    // 🚀 เพิ่มการดึง p.is_longterm มาด้วย เพื่อให้ Frontend แสดงป้ายกำกับได้ถูก
    const [activeBorrows] = await connection.query(`
      SELECT 
        b.ID as borrow_id, 
        u.name as operator_name, 
        p.electotronixPN, 
        p.category,
        p.is_longterm,
        b.quantity, 
        b.due_date, 
        b.status
      FROM tbl_borrow b
      JOIN users u ON b.user_id = u._id
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.status IN ('active', 'pending_return')
      ORDER BY b.due_date ASC
    `);
    res.json(activeBorrows);
  } finally {
    if (connection) connection.release();
  }
});

// 4. ใหม่: ดึงรายละเอียดการยืมรายบุคคล (Operator Tactical View)
const getUserBorrowDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const connection = await connectToDatabase();
  try {
    // 🚀 เพิ่มการดึง p.is_longterm
    const [borrowedItems] = await connection.query(`
      SELECT 
        b.ID as borrow_id, 
        p.electotronixPN, 
        p.category, 
        p.img,
        p.is_longterm,
        b.quantity, 
        b.borrow_date, 
        b.due_date, 
        b.status
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.user_id = ? AND b.status IN ('active', 'pending_return')
      ORDER BY b.borrow_date DESC
    `, [id]);
    
    res.json(borrowedItems);
  } finally {
    if (connection) connection.release();
  }
});

// 5. แก้ไขเครดิตพนักงาน
const updateUserCredit = asyncHandler(async (req, res) => {
  const { userId, newCredit } = req.body;
  const connection = await connectToDatabase();
  try {
    await connection.query('UPDATE users SET credit = ? WHERE _id = ?', [newCredit, userId]);
    res.json({ message: 'CREDIT_SYNC_SUCCESS' });
  } finally {
    if (connection) connection.release();
  }
});

// 6. แก้ไขราคาอุปกรณ์
const updateProductPrice = asyncHandler(async (req, res) => {
  const { productId, newPrice } = req.body;
  const connection = await connectToDatabase();
  try {
    await connection.query('UPDATE tbl_product SET price = ? WHERE ID = ?', [newPrice, productId]);
    res.json({ message: 'PRICE_SYNC_SUCCESS' });
  } finally {
    if (connection) connection.release();
  }
});

// 7. แก้ไขจำนวนสต๊อกสินค้า
const updateProductQuantity = asyncHandler(async (req, res) => {
  const { productId, newQuantity } = req.body;
  const connection = await connectToDatabase();
  try {
    await connection.query('UPDATE tbl_product SET quantity = ? WHERE ID = ?', [newQuantity, productId]);
    res.json({ message: 'QUANTITY_SYNC_SUCCESS' });
  } finally {
    if (connection) connection.release();
  }
});

// 8. ใหม่: อนุมัติรับของคืนและบวกสต๊อกกลับเข้าคลัง
const approveReturn = asyncHandler(async (req, res) => {
  const { borrowId } = req.body;
  const connection = await connectToDatabase();
  
  try {
    await connection.beginTransaction();

    // 🚀 ดึง is_longterm มาเช็ค
    const [borrowRecord] = await connection.query(
      `SELECT b.product_id, b.quantity, b.status, p.is_longterm 
       FROM tbl_borrow b
       JOIN tbl_product p ON b.product_id = p.ID 
       WHERE b.ID = ?`, 
      [borrowId]
    );
    
    if (borrowRecord.length === 0) {
      await connection.rollback();
      res.status(404);
      throw new Error('ไม่พบข้อมูลการยืม');
    }

    const { product_id, quantity, status, is_longterm } = borrowRecord[0];

    if (status === 'returned') {
      await connection.rollback();
      res.status(400);
      throw new Error('อุปกรณ์นี้ถูกคืนไปแล้ว');
    }

    // 🚀 ถ้าแอดมินกดรับของจากในหน้า Dashboard ให้แยกตามประเภท
    if (is_longterm) {
       // 🔵 ของระยะยาว: ทำการ "ยืมใหม่ให้อัตโนมัติ" ไปจนถึงศุกร์สิ้นเดือนหน้า
       const newDueDate = getWorkingEndOfMonth(1); 

       await connection.query(
         'UPDATE tbl_borrow SET status = "active", due_date = ?, is_checkin = 0, asset_condition = NULL WHERE ID = ?', 
         [newDueDate, borrowId]
       );
    } else {
       // 🟠 ของชั่วคราว: คืนของตามปกติ
       await connection.query(
         'UPDATE tbl_borrow SET status = "returned", return_date = NOW() WHERE ID = ?', 
         [borrowId]
       );
       await connection.query(
         'UPDATE tbl_product SET quantity = quantity + ? WHERE ID = ?', 
         [quantity, product_id]
       );
    }

    await connection.commit();
    res.json({ message: 'RETURN_APPROVED_SUCCESS' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
});

module.exports = { 
  getAdminStats, 
  getAllUsers, 
  getAllActiveBorrows, 
  getUserBorrowDetails, 
  updateUserCredit, 
  updateProductPrice, 
  updateProductQuantity,
  approveReturn 
};