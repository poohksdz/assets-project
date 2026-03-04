const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // สำคัญมาก! ตัวนี้ทำให้เรารับข้อมูลแบบ JSON (เช่น ตัวเลขจำนวนที่อัปเดต) ได้

// 1. ตั้งค่าการเชื่อมต่อ
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'pawin_tech' // เชื่อมกับ DB ของ Pawin Technology
});

db.connect((err) => {
  if (err) throw err;
  console.log('--- PAWIN-ASSETS: Database Connected! ---');
});

// ==========================================
// 🚀 โซน API สำหรับหน้า Dashboard (รายการอุปกรณ์)
// ==========================================
app.get('/api/assets', (req, res) => {
const sql = "SELECT * FROM tbl_product ORDER BY ID DESC LIMIT 100";  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    return res.json(results);
  });
});

// ==========================================
// 🚀 โซน API สำหรับหน้า Dashboard (รายการอุปกรณ์)
// ==========================================
app.get('/api/assets', (req, res) => {
  // เปลี่ยนชื่อตารางเป็น tbl_product และดึงมาแค่ 200 รายการล่าสุดก่อน
  const sql = "SELECT * FROM tbl_product ORDER BY ID DESC LIMIT 200"; 
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    return res.json(results);
  });
});

// 3. ดึงข้อมูลหมวดหมู่ (Category) จาก tbl_issue
app.get('/api/categories', (req, res) => {
  const sql = "SELECT DISTINCT category FROM tbl_issue WHERE category IS NOT NULL AND category != ''"; 
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    const formattedCats = results.map((item, index) => ({ ID: index, category: item.category }));
    return res.json(formattedCats);
  });
});

// 4. ดึงข้อมูลหมวดหมู่ย่อย (Subcategory) จาก tbl_issue
app.get('/api/subcategories', (req, res) => {
  const sql = "SELECT DISTINCT category, subcategory FROM tbl_issue WHERE subcategory IS NOT NULL AND subcategory != ''"; 
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    const formattedSubs = results.map((item, index) => ({ 
      ID: index, 
      category: item.category, 
      subcategory: item.subcategory 
    }));
    return res.json(formattedSubs);
  });
});

// 5. อัปเดตจำนวนเมื่อกด Save ใน Modal (อัปเดตกลับไปที่ tbl_issue)
app.put('/api/update-qty/:id', (req, res) => {
  const { id } = req.params;
  const { qty } = req.body;
  
  const sql = "UPDATE tbl_issue SET requestqty = ? WHERE ID = ?";
  db.query(sql, [qty, id], (err, results) => {
    if (err) return res.status(500).json(err);
    return res.json({ message: "อัปเดตจำนวนสำเร็จ!", results });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});