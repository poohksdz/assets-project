const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');
const jwt = require('jsonwebtoken');
const { getIO } = require('../socket');

// ========================================================
// 🚀 ฟังก์ชันคำนวณวันสิ้นเดือน (หลบเสาร์-อาทิตย์ ให้เป็นวันศุกร์)
const getWorkingEndOfMonth = (monthsToAdd = 1) => {
  let date = new Date();

  // เลื่อนไปเดือนถัดไป แล้วตั้งวันที่เป็น 0 (จะได้วันสุดท้ายของเดือนที่ต้องการเป๊ะๆ)
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

/**
 * ฟังก์ชันช่วยปิดการเชื่อมต่อแบบ Pool Friendly
 */
const closeConn = async (conn) => {
  if (!conn) return;
  try {
    if (typeof conn.release === 'function') {
      await conn.release();
    } else if (typeof conn.end === 'function') {
      await conn.end();
    }
  } catch (err) {
    console.error("❌ Error closing connection:", err.message);
  }
};

// -----------------------------------------------------------------------------------
// 1. ฟังก์ชันขอเบิกของ (ระงับสิทธิ์หากเครดิตติดลบ)
const createBorrowRecord = asyncHandler(async (req, res) => {
  const { cartItems } = req.body;
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401); throw new Error('กรุณาล็อกอินก่อนทำรายการ'); }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const connection = await connectToDatabase();

  try {
    // ตรวจสอบเครดิตผู้ใช้งานก่อน (ถ้าติดลบ ห้ามยืม)
    const [userCheck] = await connection.query('SELECT credit FROM users WHERE _id = ?', [decoded.id]);
    const currentCredit = userCheck[0]?.credit || 0;

    if (currentCredit < 0) {
      res.status(403);
      throw new Error(`ไม่สามารถทำรายการได้เนื่องจากยอดเครดิตของคุณติดลบ (฿${Math.abs(currentCredit).toLocaleString()}) กรุณาติดต่อเจ้าหน้าที่เพื่อชำระค่าปรับ`);
    }

    await connection.beginTransaction();

    for (let item of cartItems) {
      // 🚀 ดึง is_longterm พ่วงมาเช็คด้วย
      const [stockCheck] = await connection.query('SELECT quantity, is_longterm FROM tbl_product WHERE ID = ?', [item.ID]);

      if (stockCheck.length === 0 || stockCheck[0].quantity < item.borrowQty) {
        throw new Error(`สินค้ารหัส ${item.electotronixPN} มีสต๊อกไม่เพียงพอ`);
      }

      // 🚀 กำหนด Due Date
      let dueDate;
      if (stockCheck[0].is_longterm) {
        // ของระยะยาว: ให้ดิวเป็น "วันศุกร์สิ้นเดือนถัดไป" อัตโนมัติ (ใส่ 1 คือนับไป 1 เดือน)
        dueDate = getWorkingEndOfMonth(1);
      } else {
        // ของชั่วคราว: นับ 30 วันตามปกติ
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
      }

      await connection.query(
        'INSERT INTO tbl_borrow (user_id, product_id, quantity, status, borrow_date, due_date) VALUES (?, ?, ?, ?, NOW(), ?)',
        [decoded.id, item.ID, item.borrowQty, 'pending_approval', dueDate]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'ส่งคำขอเบิกอุปกรณ์แล้ว รอการอนุมัติจาก Admin' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(400); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});


// -----------------------------------------------------------------------------------
// 🚀 1.1 Admin อนุมัติการเบิกของ (หักสต๊อก และเปลี่ยนเป็น active)
const approveBorrow = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const connection = await connectToDatabase();

  try {
    await connection.beginTransaction();

    const [borrows] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.quantity as currentStock 
      FROM tbl_borrow b 
      JOIN tbl_product p ON b.product_id = p.ID 
      WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord || borrowRecord.status !== 'pending_approval') {
      res.status(400); throw new Error('รายการนี้ไม่อยู่ในสถานะรออนุมัติเบิก');
    }

    if (borrowRecord.currentStock < borrowRecord.quantity) {
      res.status(400); throw new Error(`สต๊อก ${borrowRecord.electotronixPN} ไม่เพียงพอสำหรับการจ่ายของ`);
    }

    await connection.query(`UPDATE tbl_product SET quantity = quantity - ? WHERE ID = ?`, [borrowRecord.quantity, borrowRecord.product_id]);
    await connection.query(`UPDATE tbl_borrow SET status = 'active' WHERE id = ?`, [borrowId]);

    const approveTitle = 'อนุมัติการเบิกสำเร็จ ✅';
    const approveMsg = `Admin อนุมัติให้คุณเบิก ${borrowRecord.electotronixPN} จำนวน ${borrowRecord.quantity} ชิ้น เรียบร้อยแล้ว`;
    await connection.query(
      `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [borrowRecord.user_id, approveTitle, approveMsg]
    );
    try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: approveTitle, message: approveMsg }); } catch (e) { }

    await connection.commit();
    res.json({ message: 'อนุมัติการเบิกอุปกรณ์เรียบร้อยแล้ว' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500); throw new Error('เกิดข้อผิดพลาดในการอนุมัติเบิก: ' + error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 1.2 Admin ปฏิเสธการเบิกของ
const rejectBorrow = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await connection.query(`
      SELECT b.*, p.electotronixPN 
      FROM tbl_borrow b 
      JOIN tbl_product p ON b.product_id = p.ID 
      WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord || borrowRecord.status !== 'pending_approval') {
      res.status(400); throw new Error('รายการนี้ไม่อยู่ในสถานะรออนุมัติเบิก');
    }

    await connection.beginTransaction();
    await connection.query(`DELETE FROM tbl_borrow WHERE id = ?`, [borrowId]);

    const rejectTitle = 'คำขอเบิกถูกปฏิเสธ ❌';
    const rejectMsg = `Admin ไม่อนุมัติการเบิก ${borrowRecord.electotronixPN} ของคุณ`;
    await connection.query(
      `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [borrowRecord.user_id, rejectTitle, rejectMsg]
    );
    try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: rejectTitle, message: rejectMsg }); } catch (e) { }

    await connection.commit();
    res.json({ message: 'ปฏิเสธคำขอเบิกอุปกรณ์เรียบร้อยแล้ว' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 1.3 ดึงรายการรออนุมัติเบิก (สำหรับ Admin)
const getAllPendingBorrows = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [pendingList] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.img, u.name AS userName 
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      JOIN users u ON b.user_id = u._id 
      WHERE b.status = 'pending_approval'
      ORDER BY b.borrow_date ASC
    `);
    res.json(pendingList);
  } catch (error) {
    res.status(500); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 2. ดึงรายการรอตรวจสอบคืนของ (สำหรับ Admin)
const getAllPendingReturns = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    // 🚀 ดึง is_longterm และ asset_condition แนบไปให้ Frontend หน้า AdminApprovals ด้วย
    const [pendingList] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.price AS productPrice, p.is_longterm, u.name AS userName, u.credit AS userCredit
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      JOIN users u ON b.user_id = u._id 
      WHERE b.status = 'pending_return'
      ORDER BY b.return_date ASC
    `);
    res.json(pendingList);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 3. User ส่งคืนของ หรือ ถ่ายรูปเช็คสถานะ
const requestReturn = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;

  // 🚀 รับค่าจาก FormData (Frontend ส่งมาเป็น string)
  const isCheckIn = req.body.is_checkin === 'true' ? 1 : 0;
  const assetCondition = req.body.asset_condition || null;

  if (!req.file) { res.status(400); throw new Error('กรุณาแนบรูปภาพหลักฐาน'); }

  const imgUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await connection.query('SELECT * FROM tbl_borrow WHERE id = ?', [borrowId]);
    const borrowRecord = borrows[0];
    if (!borrowRecord) { res.status(404); throw new Error('ไม่พบข้อมูลการยืม'); }

    let penalty = 0;
    const now = new Date();
    const dueDate = new Date(borrowRecord.due_date);

    // 🚀 ถ้าเป็นการ "เช็คสถานะระยะยาว" เราจะไม่คิดค่าปรับตอนเขาส่งรูป (เว้นแต่จะเขียนกฎแยกต่างหาก)
    if (!isCheckIn && now > dueDate) {
      const diffDays = Math.ceil(Math.abs(now - dueDate) / (1000 * 60 * 60 * 24));
      penalty = diffDays * 50;
    }

    // 🚀 บันทึกสถานะ, รูปล่าสุด, การเช็คอิน, และสภาพอุปกรณ์
    await connection.query(
      `UPDATE tbl_borrow 
       SET status = 'pending_return', 
           return_image = ?, 
           penalty_fee = ?, 
           return_date = NOW(),
           is_checkin = ?, 
           asset_condition = ?
       WHERE id = ?`,
      [imgUrl, penalty, isCheckIn, assetCondition, borrowId]
    );
    res.json({ message: 'ส่งหลักฐานเรียบร้อย รอแอดมินตรวจสอบ' });
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 4. Admin อนุมัติคืนของ หรือ อนุมัติรายงานสถานะ
const approveReturn = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.is_longterm 
      FROM tbl_borrow b 
      JOIN tbl_product p ON b.product_id = p.ID WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord || borrowRecord.status !== 'pending_return') {
      res.status(400); throw new Error('รายการนี้ไม่อยู่ในสถานะรอตรวจสอบ');
    }

    await connection.beginTransaction();

    // 🚀 แยกทางเดิน: ของระยะยาว vs ของชั่วคราว
    if (borrowRecord.is_longterm || borrowRecord.is_checkin) {

      // 🔵 ของระยะยาว: ยืดเวลาเป็น "วันศุกร์สิ้นเดือนหน้า" ให้อัตโนมัติ
      const newDueDate = getWorkingEndOfMonth(1);

      await connection.query(`
        UPDATE tbl_borrow 
        SET status = 'active',        -- กลับไป active ให้ยืมต่อ
            due_date = ?,             -- อัปเดตวันใหม่ (ศุกร์สิ้นเดือนหน้า)
            return_image = NULL,      -- เคลียร์รูปรอของรอบหน้า
            is_checkin = 0,
            asset_condition = NULL,
            penalty_fee = 0
        WHERE id = ?`, [newDueDate, borrowId]);

      const checkinTitle = 'รายงานสถานะสำเร็จ ✅';
      const checkinMsg = `Admin ตรวจสอบ ${borrowRecord.electotronixPN} แล้ว อนุญาตให้ใช้งานต่อได้`;
      await connection.query(
        `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
        [borrowRecord.user_id, checkinTitle, checkinMsg]
      );
      try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: checkinTitle, message: checkinMsg }); } catch (e) { }

    } else {

      // 🟠 ของชั่วคราว: คืนของตามปกติ
      await connection.query(`UPDATE tbl_borrow SET status = 'returned' WHERE id = ?`, [borrowId]);
      await connection.query(`UPDATE tbl_product SET quantity = quantity + ? WHERE ID = ?`, [borrowRecord.quantity, borrowRecord.product_id]);

      if (borrowRecord.penalty_fee > 0) {
        await connection.query(`UPDATE users SET credit = credit - ? WHERE _id = ?`, [borrowRecord.penalty_fee, borrowRecord.user_id]);
      }

      const returnTitle = 'คืนอุปกรณ์สำเร็จ ✅';
      const returnMsg = `อนุมัติการคืน ${borrowRecord.electotronixPN} เรียบร้อยแล้ว`;
      await connection.query(
        `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
        [borrowRecord.user_id, returnTitle, returnMsg]
      );
      try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: returnTitle, message: returnMsg }); } catch (e) { }
    }

    await connection.commit();
    res.json({ message: 'ดำเนินการสำเร็จ' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 5. Admin ปฏิเสธรูปภาพ (ปรับเงินกรณีทุจริต หรือ ให้ถ่ายรูปใหม่)
const rejectReturn = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const { penalty, reason } = req.body;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.is_longterm 
      FROM tbl_borrow b 
      JOIN tbl_product p ON b.product_id = p.ID WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord) { res.status(404); throw new Error('ไม่พบข้อมูลการยืม'); }

    await connection.beginTransaction();

    const finalPenalty = penalty ? parseFloat(penalty) : (borrowRecord.penalty_fee || 0);

    if (finalPenalty > 0) {
      await connection.query(`UPDATE users SET credit = credit - ? WHERE _id = ?`, [finalPenalty, borrowRecord.user_id]);
    }

    // ดีดสถานะกลับไปเป็น active เพื่อให้ User ส่งรูปใหม่ ไม่ว่าจะเป็นของระยะสั้นหรือยาว
    await connection.query(
      `UPDATE tbl_borrow 
       SET status = 'active', 
           return_image = NULL, 
           is_checkin = 0,
           asset_condition = NULL,
           penalty_fee = 0 
       WHERE id = ?`,
      [borrowId]
    );

    // ตั้งชื่อเตือนให้ตรงกับประเภท
    const titleType = borrowRecord.is_longterm ? 'รายงานสถานะไม่ผ่าน ❌' : 'ตรวจพบการทุจริต! ❌';
    const actionType = borrowRecord.is_longterm ? 'การตรวจสอบ' : 'การคืน';
    const msg = `${actionType} ${borrowRecord.electotronixPN} ถูกปฏิเสธ: ${reason || 'รูปภาพไม่ถูกต้อง'} ${finalPenalty > 0 ? `| โดนหักเครดิตลงโทษ: ฿${finalPenalty.toLocaleString()}` : ''}`;

    await connection.query(
      `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [borrowRecord.user_id, titleType, msg]
    );
    try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: titleType, message: msg }); } catch (e) { }

    await connection.commit();
    res.json({ message: 'ปฏิเสธหลักฐานเรียบร้อย ให้ผู้ใช้ดำเนินการใหม่' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 6. ดึงประวัติการยืมส่วนตัว
const getMyBorrowHistory = asyncHandler(async (req, res) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401); throw new Error('กรุณาล็อกอิน'); }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const connection = await connectToDatabase();

  try {
    // ดึงประวัติการยืม
    const [history] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.category, p.img, p.price, p.is_longterm
      FROM tbl_borrow b 
      JOIN tbl_product p ON b.product_id = p.ID 
      WHERE b.user_id = ? 
      ORDER BY b.borrow_date DESC`, [decoded.id]);

    // ดึง credit ปัจจุบันของ user
    const [userRows] = await connection.query(
      'SELECT credit FROM users WHERE _id = ?', [decoded.id]
    );
    const credit = userRows[0]?.credit || 0;

    // คำนวณค่าปรับทั้งหมดที่โดนหักไป (จากรายการที่ returned + มี penalty_fee > 0)
    const [penaltyRows] = await connection.query(
      'SELECT IFNULL(SUM(penalty_fee), 0) as totalPenalty FROM tbl_borrow WHERE user_id = ? AND penalty_fee > 0', [decoded.id]
    );
    const totalPenalty = penaltyRows[0]?.totalPenalty || 0;

    res.json({ history, credit, totalPenalty });
  } finally {
    await closeConn(connection);
  }
});

module.exports = {
  createBorrowRecord,
  approveBorrow,
  rejectBorrow,
  getAllPendingBorrows,
  getMyBorrowHistory,
  requestReturn,
  approveReturn,
  rejectReturn,
  getAllPendingReturns
};