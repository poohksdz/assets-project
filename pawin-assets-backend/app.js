// app.js (Backend)
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const connectToDatabase = require('./config/db.js');
const socketIO = require('./socket');

dotenv.config();

// นำเข้า Routes
const userRoutes = require('./routes/userRoutes');
const assetRoutes = require('./routes/assetRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// ---  ส่วนที่ต้องแก้เรื่องรูปภาพให้ตรงจุด  ---

// 1. ชี้ไปที่โฟลเดอร์ images ใน Frontend (รูปที่มีอยู่แล้ว)
const frontendImagesPath = path.resolve(__dirname, '..', 'pawin-assets-frontend', 'public', 'images');
app.use('/images', express.static(frontendImagesPath));

// 2. ชี้ไปที่โฟลเดอร์ uploads ใน Backend (รูปที่อัปโหลดใหม่)
const backendUploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(backendUploadsPath));

// 🛠️ ตรวจสอบ Path ใน Terminal ตอนรัน (เพื่อความชัวร์)
console.log(`📂 Images Location: ${frontendImagesPath}`);
console.log(`📂 Uploads Location: ${backendUploadsPath}`);

// ------------------------------------------

app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/ping', (req, res) => res.send('Backend Server is Ready! ✅'));

// Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({ message: err.message });
});

// Cron Job (แจ้งเตือน)
cron.schedule('0 8 * * *', async () => {
  let connection;
  try {
    connection = await connectToDatabase();
    // ... โค้ดแจ้งเตือนเดิม ...
  } finally {
    if (connection) connection.release();
  }
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
socketIO.init(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (Socket.io Ready)`);
});